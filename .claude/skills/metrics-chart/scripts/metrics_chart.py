#!/usr/bin/env python3
"""Render Axiom metrics query results (application/vnd.metrics.v3+json) as charts.

Input is the response body of the metrics query service
(../metrics/service/query, type `JsonV3QueryResponse`): a multi-series,
regularly-sampled time series. This script turns it into a line chart.

Design (see SKILL.md):
- Zero-dependency default: a pure-stdlib Unicode (braille) line chart that
  renders in any terminal, transcript, or CI log.
- Optional fidelity upgrade: if `gnuplot` is on PATH it can emit PNG/SVG/sixel,
  displayed inline when the terminal supports it (Kitty/Ghostty, iTerm2).
- Graceful fallback: anything the image path can't do degrades to ASCII.

The script intentionally has no third-party imports.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from datetime import datetime, timezone, tzinfo
from typing import Optional

try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover - zoneinfo is stdlib on 3.9+
    ZoneInfo = None  # type: ignore


# --------------------------------------------------------------------------- #
# Model
# --------------------------------------------------------------------------- #

@dataclass
class Metadata:
    group_keys: list = field(default_factory=list)
    warnings: list = field(default_factory=list)
    unit: Optional[str] = None
    custom_unit: Optional[str] = None

    def y_label(self) -> str:
        # Prefer the human custom_unit, fall back to the canonical unit.
        return self.custom_unit or self.unit or ""


@dataclass
class Series:
    label: str
    metric: str
    tags: dict
    start: int
    resolution: int
    values: list  # list[float | None]; None marks a gap

    def peak(self) -> float:
        present = [v for v in self.values if v is not None]
        return max(present) if present else float("-inf")

    def is_empty(self) -> bool:
        return all(v is None for v in self.values)


# --------------------------------------------------------------------------- #
# Parsing
# --------------------------------------------------------------------------- #

def _stringify_tag(v) -> str:
    # Tag values are int/float/string; +Inf/-Inf already arrive as strings.
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v)


def format_label(tags: dict, group_keys: list, multi_metric: bool, metric: str) -> str:
    """Build a series label.

    With group_keys we know which tags the query grouped on; show only their
    values, joined with ` | ` (e.g. `200 | GET`). Without them, fall back to the
    full tag set as `k=v` pairs so the series is still identifiable.
    """
    if group_keys:
        parts = [_stringify_tag(tags.get(k)) for k in group_keys if k in tags]
        label = " | ".join(parts) if parts else metric
    elif tags:
        label = ", ".join(f"{k}={_stringify_tag(tags[k])}" for k in sorted(tags))
    else:
        label = metric
    # Disambiguate when several metrics share a chart.
    if multi_metric:
        return f"{metric}{{{label}}}" if label != metric else metric
    return label


def parse(doc) -> "tuple[Metadata, list]":
    """Parse a metrics query response.

    Accepts the v3 object form ({metadata, series}) and, for free, v2/v2a (same
    shape with an extra per-series `summary` we ignore) and the v0/v1 array form
    (a bare list of series). Unknown fields are ignored.
    """
    if isinstance(doc, list):
        raw_series = doc
        meta = Metadata()
    else:
        raw_series = doc.get("series", [])
        m = doc.get("metadata", {}) or {}
        meta = Metadata(
            group_keys=list(m.get("group_keys") or []),
            warnings=list(m.get("warnings") or []),
            unit=m.get("unit"),
            custom_unit=m.get("custom_unit"),
        )

    metrics = {s.get("metric") for s in raw_series}
    multi_metric = len(metrics) > 1

    series = []
    for s in raw_series:
        metric = s.get("metric", "")
        tags = s.get("tags", {}) or {}
        series.append(
            Series(
                label=format_label(tags, meta.group_keys, multi_metric, metric),
                metric=metric,
                tags=tags,
                start=int(s.get("start", 0)),
                resolution=int(s.get("resolution", 1)) or 1,
                values=list(s.get("data", [])),
            )
        )
    return meta, series


def point_timestamps(series: Series) -> list:
    """Unix-second timestamp for every point: start + i*resolution."""
    return [series.start + i * series.resolution for i in range(len(series.values))]


# --------------------------------------------------------------------------- #
# Series reduction (collapse overlapping, then cap at top-N)
# --------------------------------------------------------------------------- #

@dataclass
class Selection:
    kept: list
    n_collapsed: int
    n_hidden: int
    total: int


def _aligned_max_diff(a: Series, b: Series) -> float:
    """Max |a-b| over timestamps both series have a present value for.

    Returns +inf when they share no comparable points (treated as distinct).
    """
    ma = {t: v for t, v in zip(point_timestamps(a), a.values) if v is not None}
    mb = {t: v for t, v in zip(point_timestamps(b), b.values) if v is not None}
    shared = ma.keys() & mb.keys()
    if not shared:
        return float("inf")
    return max(abs(ma[t] - mb[t]) for t in shared)


def collapse_overlapping(series: list, eps: float = 0.02) -> "tuple[list, int]":
    """Merge series whose lines essentially coincide.

    Two series overlap when their max point-wise difference is within `eps` of
    the global value range. The most prominent series (highest peak) is kept as
    the cluster representative. Returns (representatives, n_collapsed).
    """
    present = [v for s in series for v in s.values if v is not None]
    if not present:
        return list(series), 0
    rng = max(present) - min(present)

    reps: list = []
    for s in sorted(series, key=Series.peak, reverse=True):
        # _aligned_max_diff returns +inf for series with no shared timestamps,
        # so disjoint lines never collapse even when rng == 0 (all values equal
        # collapses eps*rng to 0, which still demands an exact overlap).
        if any(_aligned_max_diff(s, r) <= eps * rng for r in reps):
            continue
        reps.append(s)
    return reps, len(series) - len(reps)


def select_series(series: list, top_n: int = 8, eps: float = 0.02) -> Selection:
    total = len(series)
    reps, n_collapsed = collapse_overlapping(series, eps)
    reps = sorted(reps, key=Series.peak, reverse=True)
    kept = reps[:top_n]
    return Selection(kept=kept, n_collapsed=n_collapsed,
                     n_hidden=len(reps) - len(kept), total=total)


def annotation(sel: Selection) -> str:
    """One-line summary of what was dropped, or '' if everything is shown."""
    if len(sel.kept) == sel.total:
        return ""
    parts = []
    if sel.n_collapsed:
        parts.append(f"{sel.n_collapsed} overlapping")
    if sel.n_hidden:
        parts.append(f"{sel.n_hidden} low/hidden")
    extra = f" ({', '.join(parts)})" if parts else ""
    return f"showing {len(sel.kept)} of {sel.total} series{extra}"


# --------------------------------------------------------------------------- #
# Braille canvas (zero-dependency renderer primitive)
# --------------------------------------------------------------------------- #

# Braille dot -> bit. Cell is 2 cols x 4 rows; mapping per the Unicode block.
_BRAILLE = {
    (0, 0): 0x01, (0, 1): 0x02, (0, 2): 0x04, (0, 3): 0x40,
    (1, 0): 0x08, (1, 1): 0x10, (1, 2): 0x20, (1, 3): 0x80,
}


class BrailleCanvas:
    """A monochrome-per-pixel braille grid with an optional colour id per cell."""

    def __init__(self, cols: int, rows: int):
        self.cols = max(1, cols)
        self.rows = max(1, rows)
        self.px_w = self.cols * 2
        self.px_h = self.rows * 4
        self._bits = [[0] * self.cols for _ in range(self.rows)]
        self._color = [[None] * self.cols for _ in range(self.rows)]

    def set(self, px: int, py: int, color: int) -> None:
        if not (0 <= px < self.px_w and 0 <= py < self.px_h):
            return
        cc, cr = px // 2, py // 4
        self._bits[cr][cc] |= _BRAILLE[(px % 2, py % 4)]
        self._color[cr][cc] = color  # last writer wins; fine for few series

    def line(self, x0: int, y0: int, x1: int, y1: int, color: int) -> None:
        # Integer Bresenham so connected points read as a continuous line.
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx + dy
        while True:
            self.set(x0, y0, color)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x0 += sx
            if e2 <= dx:
                err += dx
                y0 += sy

    def char_at(self, col: int, row: int) -> str:
        return chr(0x2800 + self._bits[row][col])

    def color_at(self, col: int, row: int):
        return self._color[row][col]


# --------------------------------------------------------------------------- #
# Colour palette
# --------------------------------------------------------------------------- #

# (ansi foreground code, gnuplot rgb)
_PALETTE = [
    (32, "#4daf4a"), (34, "#377eb8"), (33, "#ff7f00"), (35, "#984ea3"),
    (36, "#00ced1"), (31, "#e41a1c"), (92, "#7fc97f"), (94, "#80b1d3"),
    (93, "#fdb462"), (95, "#bebada"),
]


def _ansi(code: int, text: str, enabled: bool) -> str:
    return f"\x1b[{code}m{text}\x1b[0m" if enabled else text


# --------------------------------------------------------------------------- #
# ASCII renderer
# --------------------------------------------------------------------------- #

def _fmt_value(v: float) -> str:
    av = abs(v)
    if av != 0 and (av >= 1e6 or av < 1e-3):
        return f"{v:.2e}"
    if av >= 100:
        return f"{v:.0f}"
    if av >= 1:
        return f"{v:.1f}"
    return f"{v:.3f}"


def _fmt_time(ts: int, tz: Optional[tzinfo], multiday: bool) -> str:
    dt = datetime.fromtimestamp(ts, tz)
    return dt.strftime("%m-%d %H:%M" if multiday else "%H:%M")


def render_ascii(series: list, meta: Metadata, tz: Optional[tzinfo],
                 width: int, height: int, color: bool,
                 title: Optional[str] = None,
                 note: str = "") -> str:
    lines: list = []
    plottable = [s for s in series if not s.is_empty()]
    if not plottable:
        return "(no data points to plot)"

    # Global ranges across every plotted point.
    all_ts = [t for s in plottable for t in point_timestamps(s)]
    all_v = [v for s in plottable for v in s.values if v is not None]
    t_min, t_max = min(all_ts), max(all_ts)
    y_min, y_max = min(all_v), max(all_v)
    if y_min == y_max:  # flat line: give it vertical breathing room
        y_min, y_max = y_min - 1, y_max + 1
    if t_min == t_max:
        t_max = t_min + 1

    canvas = BrailleCanvas(width, height)

    def to_px(ts: int) -> int:
        return round((ts - t_min) / (t_max - t_min) * (canvas.px_w - 1))

    def to_py(v: float) -> int:
        # invert: larger value -> higher on screen (smaller row)
        return round((y_max - v) / (y_max - y_min) * (canvas.px_h - 1))

    colors = {}
    for idx, s in enumerate(plottable):
        ci = idx % len(_PALETTE)
        colors[s.label] = ci
        ts = point_timestamps(s)
        prev = None
        for t, v in zip(ts, s.values):
            if v is None:  # gap: break the line
                prev = None
                continue
            cur = (to_px(t), to_py(v))
            if prev is None:
                canvas.set(cur[0], cur[1], ci)
            else:
                canvas.line(prev[0], prev[1], cur[0], cur[1], ci)
            prev = cur

    # Y gutter labels at top / middle / bottom rows.
    y_labels = {0: y_max, canvas.rows - 1: y_min}
    if canvas.rows >= 3:
        y_labels[canvas.rows // 2] = (y_max + y_min) / 2
    gutter = max(len(_fmt_value(v)) for v in y_labels.values())

    if title:
        lines.append(title)

    ansi_code = lambda ci: _PALETTE[ci][0]
    for r in range(canvas.rows):
        label = _fmt_value(y_labels[r]).rjust(gutter) if r in y_labels else " " * gutter
        row_chars = []
        for c in range(canvas.cols):
            ch = canvas.char_at(c, r)
            col = canvas.color_at(c, r)
            if color and col is not None and ch != chr(0x2800):
                ch = _ansi(ansi_code(col), ch, True)
            row_chars.append(ch)
        lines.append(f"{label} \u2502{''.join(row_chars)}")

    # X axis.
    multiday = (t_max - t_min) > 86400
    axis = " " * (gutter + 1) + "\u2514" + "\u2500" * canvas.cols
    lines.append(axis)
    n_ticks = max(2, min(6, canvas.cols // 12))
    tick_row = [" "] * (gutter + 2 + canvas.cols)
    for i in range(n_ticks):
        frac = i / (n_ticks - 1)
        ts = round(t_min + frac * (t_max - t_min))
        text = _fmt_time(ts, tz, multiday)
        pos = gutter + 2 + round(frac * (canvas.cols - 1))
        start = min(max(0, pos - len(text) // 2), len(tick_row) - len(text))
        for j, chx in enumerate(text):
            tick_row[start + j] = chx
    lines.append("".join(tick_row).rstrip())

    yl = meta.y_label()
    if yl:
        lines.append(f"y: {yl}")

    # Legend.
    lines.append("")
    for s in plottable:
        ci = colors[s.label]
        swatch = _ansi(ansi_code(ci), "\u2588\u2588", color)
        peak = s.peak()
        peak_txt = f"  (peak {_fmt_value(peak)})" if peak != float("-inf") else ""
        lines.append(f"{swatch} {s.label}{peak_txt}")

    if note:
        lines.append("")
        lines.append(note)
    for w in meta.warnings:
        lines.append(f"\u26a0 {w}")

    return "\n".join(lines)


# --------------------------------------------------------------------------- #
# gnuplot renderer (optional fidelity upgrade)
# --------------------------------------------------------------------------- #

def gnuplot_available() -> bool:
    return shutil.which("gnuplot") is not None


def _tz_offset_seconds(tz: Optional[tzinfo], sample_ts: int) -> int:
    dt = datetime.fromtimestamp(sample_ts, tz)
    if dt.tzinfo is None:
        # tz=None yields a naive local datetime whose utcoffset() is None;
        # attach the local zone so the offset reflects local wall-clock time
        # instead of collapsing to 0 (which would mislabel the axis as UTC).
        dt = dt.astimezone()
    off = dt.utcoffset()
    return int(off.total_seconds()) if off else 0


def _gnuplot_script(series: list, meta: Metadata, tz: Optional[tzinfo],
                    term: str, width_px: int, height_px: int,
                    title: Optional[str], output: Optional[str],
                    font_size: Optional[int] = None) -> str:
    # gnuplot's time axis is UTC-only; pre-shift each epoch by the tz offset at
    # that instant (see the emission loop below) so tick labels read as
    # wall-clock time. Per-point offsets keep labels correct even when the
    # range crosses a DST transition, where one offset would be wrong.
    multiday = False
    if series:
        spans = [point_timestamps(s) for s in series if s.values]
        if spans:
            lo = min(t[0] for t in spans)
            hi = max(t[-1] for t in spans)
            multiday = (hi - lo) > 86400

    # Scale the font and line weight with the canvas so text stays legible at
    # any size. Quote with ensure_ascii=False so non-ASCII (em dash, unicode
    # tag values) is emitted as real UTF-8 rather than a literal \uXXXX that
    # gnuplot prints verbatim.
    fs = font_size or max(13, min(30, round(min(width_px, height_px) / 28)))
    lw = max(2, round(min(width_px, height_px) / 320))
    q = lambda s: json.dumps(s, ensure_ascii=False)

    out = []
    out.append(f"set terminal {term} size {width_px},{height_px} enhanced font 'sans,{fs}'")
    if output:
        out.append(f"set output '{output}'")
    out.append("set xdata time")
    out.append("set timefmt '%s'")
    out.append("set format x '%m-%d\\n%H:%M'" if multiday else "set format x '%H:%M'")
    out.append("set grid")
    out.append("set key outside below")
    if title:
        out.append(f"set title {q(title)} font 'sans,{fs + 2}'")
    if meta.y_label():
        out.append(f"set ylabel {q(meta.y_label())}")
    out.append('set datafile missing "NaN"')

    plot_parts = [f"'-' using 1:2 with lines lw {lw} lc rgb '{_PALETTE[i % len(_PALETTE)][1]}' "
                  f"title {q(s.label)}"
                  for i, s in enumerate(series)]
    out.append("plot " + ", ".join(plot_parts))

    for s in series:
        for t, v in zip(point_timestamps(s), s.values):
            out.append(f"{t + _tz_offset_seconds(tz, t)} {'NaN' if v is None else v}")
        out.append("e")
    return "\n".join(out) + "\n"


def render_gnuplot_bytes(series, meta, tz, term, width_px, height_px,
                         title, font_size=None) -> bytes:
    """Run gnuplot writing an image to a temp file; return its bytes."""
    suffix = ".svg" if term == "svg" else ".png"
    fd, path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    try:
        script = _gnuplot_script(series, meta, tz, term, width_px, height_px,
                                 title, path, font_size)
        subprocess.run(["gnuplot"], input=script.encode(), check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        with open(path, "rb") as fh:
            return fh.read()
    finally:
        os.unlink(path)


def render_gnuplot_sixel(series, meta, tz, width_px, height_px, title,
                         font_size=None) -> bytes:
    script = _gnuplot_script(series, meta, tz, "sixelgd", width_px, height_px,
                             title, None, font_size)
    proc = subprocess.run(["gnuplot"], input=script.encode(),
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                          check=True)
    return proc.stdout


# --------------------------------------------------------------------------- #
# Inline image display
# --------------------------------------------------------------------------- #

def terminal_image_kind() -> Optional[str]:
    """Best-effort detection of an inline-image-capable terminal."""
    if not sys.stdout.isatty():
        return None
    term = os.environ.get("TERM", "")
    prog = os.environ.get("TERM_PROGRAM", "")
    if prog == "iTerm.app":
        return "iterm2"
    if (os.environ.get("KITTY_WINDOW_ID")
            or "kitty" in term or "ghostty" in term
            or prog in ("ghostty", "WezTerm")):
        return "kitty"
    return None


def emit_kitty(png: bytes) -> None:
    b64 = base64.standard_b64encode(png)
    chunk = 4096
    i = 0
    first = True
    while i < len(b64):
        piece = b64[i:i + chunk]
        i += chunk
        more = 1 if i < len(b64) else 0
        if first:
            sys.stdout.write(f"\x1b_Ga=T,f=100,q=2,m={more};")
            first = False
        else:
            sys.stdout.write(f"\x1b_Gm={more};")
        sys.stdout.write(piece.decode("ascii"))
        sys.stdout.write("\x1b\\")
    sys.stdout.write("\n")
    sys.stdout.flush()


def emit_iterm2(png: bytes) -> None:
    b64 = base64.standard_b64encode(png).decode("ascii")
    sys.stdout.write(f"\x1b]1337;File=inline=1;size={len(png)}:{b64}\x07\n")
    sys.stdout.flush()


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #

def _display_instruction(path: str) -> str:
    """Tell an agent/user to surface an image the skill just wrote.

    Terminal harnesses collapse tool output and won't paint inline ANSI, so the
    reliable way to show a chart is to render a file and have the agent display
    that file (e.g. via its image/read tool).
    """
    return (f"metrics-chart: wrote image to {path}\n"
            f"\u2192 Display this file to the user with your image tool "
            f"(e.g. read it); do not paste its contents.")


def _resolve_format(requested: str, has_gnuplot: bool, image_kind: Optional[str],
                    stdout_isatty: bool) -> str:
    """Pick a concrete output format for `auto`.

    Preference order favours images: an inline image on an image-capable
    terminal; a PNG file (to hand off to an agent) when output is piped/captured;
    ASCII only in a plain terminal or when gnuplot is unavailable.
    """
    if requested != "auto":
        return requested
    if not has_gnuplot:
        return "ascii"
    if image_kind:          # Kitty/Ghostty/iTerm2: draw the image inline.
        return "png"
    if stdout_isatty:       # plain terminal: ASCII is viewable in place.
        return "ascii"
    return "png"            # piped/captured (e.g. agent): write a file to display.


def _positive_int(value: str) -> int:
    # --top is a peak cap, not a Python slice: 0 selects nothing and negatives
    # drop a suffix (reps[:top_n]), so an empty plot would reach gnuplot. Reject
    # non-positive values at the CLI boundary instead.
    try:
        n = int(value)
    except ValueError:
        raise argparse.ArgumentTypeError(f"invalid int value: {value!r}")
    if n < 1:
        raise argparse.ArgumentTypeError("must be a positive integer")
    return n


def _resolve_tz(name: Optional[str]) -> Optional[tzinfo]:
    if name is None:
        return None  # local time (datetime.fromtimestamp with tz=None)
    if name.upper() == "UTC":
        return timezone.utc
    if ZoneInfo is None:
        raise SystemExit("zoneinfo unavailable; cannot honour --tz")
    return ZoneInfo(name)


def main(argv=None) -> int:
    p = argparse.ArgumentParser(
        description="Chart an Axiom metrics v3 (application/vnd.metrics.v3+json) result.")
    p.add_argument("input", nargs="?", help="JSON file (default: stdin)")
    p.add_argument("--format", choices=["auto", "ascii", "png", "svg", "sixel"],
                   default="auto")
    p.add_argument("--tz", help="IANA tz name (default: local; 'UTC' for UTC)")
    p.add_argument("--top", type=_positive_int, default=8,
                   help="max series to draw (default 8); must be >= 1")
    p.add_argument("--eps", type=float, default=0.02,
                   help="overlap threshold as fraction of y-range (default 0.02)")
    p.add_argument("--all", action="store_true",
                   help="draw every series (disable collapse + top-N)")
    p.add_argument("--width", type=int, help="chart width (cells for ascii, px otherwise)")
    p.add_argument("--height", type=int, help="chart height (cells for ascii, px otherwise)")
    p.add_argument("--title")
    p.add_argument("--font-size", type=int,
                   help="image font size in pt (default: scales with size)")
    p.add_argument("--output", help="write image to this path (png/svg)")
    color = p.add_mutually_exclusive_group()
    color.add_argument("--color", dest="color", action="store_true", default=None)
    color.add_argument("--no-color", dest="color", action="store_false")
    args = p.parse_args(argv)

    raw = open(args.input, "rb").read() if args.input else sys.stdin.buffer.read()
    try:
        doc = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"error: input is not valid JSON: {e}", file=sys.stderr)
        return 2

    meta, series = parse(doc)
    series = [s for s in series if not s.is_empty()]
    if not series:
        print("error: no plottable series in input", file=sys.stderr)
        return 1

    tz = _resolve_tz(args.tz)

    note = ""
    if args.all:
        kept = series
    else:
        sel = select_series(series, top_n=args.top, eps=args.eps)
        kept = sel.kept
        note = annotation(sel)
        if note:
            note += "  \u2014 tip: aggregate the query to a handful of series for clearer charts"

    kind = terminal_image_kind()
    fmt = _resolve_format(args.format, gnuplot_available(), kind,
                          sys.stdout.isatty())

    if fmt != "ascii" and not gnuplot_available():
        print("note: gnuplot not found; falling back to ascii", file=sys.stderr)
        fmt = "ascii"

    if fmt == "ascii":
        use_color = args.color if args.color is not None else (
            sys.stdout.isatty() and os.environ.get("NO_COLOR") is None
            and os.environ.get("TERM") != "dumb")
        w = args.width or max(30, min(shutil.get_terminal_size((100, 24)).columns - 10, 120))
        h = args.height or 16
        print(render_ascii(kept, meta, tz, w, h, use_color, args.title, note))
        return 0

    # Image formats via gnuplot.
    w = args.width or 1000
    h = args.height or 500
    if fmt == "sixel":
        sys.stdout.buffer.write(
            render_gnuplot_sixel(kept, meta, tz, w, h, args.title, args.font_size))
        sys.stdout.buffer.flush()
        return 0

    term = "svg" if fmt == "svg" else "pngcairo"
    img = render_gnuplot_bytes(kept, meta, tz, term, w, h, args.title, args.font_size)

    written_path = None
    if args.output:
        with open(args.output, "wb") as fh:
            fh.write(img)
        written_path = args.output

    # Display inline when the terminal supports it (handled by us, not gnuplot).
    displayed_inline = False
    if fmt == "png" and kind == "kitty":
        emit_kitty(img)
        displayed_inline = True
    elif fmt == "png" and kind == "iterm2":
        emit_iterm2(img)
        displayed_inline = True

    # No inline channel and no explicit path: stash it in a temp file.
    if not displayed_inline and written_path is None:
        suffix = ".svg" if fmt == "svg" else ".png"
        fd, path = tempfile.mkstemp(prefix="metrics-chart-", suffix=suffix)
        with os.fdopen(fd, "wb") as fh:
            fh.write(img)
        written_path = path

    if written_path is not None:
        if displayed_inline:
            # Already shown; just report where it was saved.
            print(f"metrics-chart: wrote image to {written_path}")
        else:
            # Hand the file off to the agent/user to display.
            print(_display_instruction(written_path))

    if note:
        print(note, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
