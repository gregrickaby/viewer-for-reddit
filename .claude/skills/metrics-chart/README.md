# metrics-chart

Renders Axiom metrics query results (`application/vnd.metrics.v3+json`) as
multi-series line charts — directly in your terminal or agent transcript.

## What It Does

- **Zero-dependency charts** - Pure Python stdlib Unicode/braille line chart that renders in any terminal, transcript, or CI log
- **Optional high-fidelity images** - If `gnuplot` is installed, emits PNG/SVG/sixel, displayed inline in image-capable terminals (Kitty/Ghostty, iTerm2)
- **Series reduction** - Collapses overlapping lines and caps at top-N by peak, reporting how many series were dropped
- **Time-aware** - Local-time x-axis by default (`--tz` to override); `null` points are drawn as gaps, not zeros
- **Readable legends** - Built from the response's `group_keys` (e.g. `200 | GET`), with the y-axis unit taken from the metadata

## Installation

```bash
# Amp
amp skill add axiomhq/skills/metrics-chart

# npx (Claude Code, Cursor, Codex, and more)
npx skills add axiomhq/skills -s metrics-chart
```

## Prerequisites

- **Python 3.9+** - standard library only; no pip packages
- **gnuplot** (optional) - only for `--format png|svg|sixel`; the default ASCII renderer needs nothing

No `~/.axiom.toml` and no network access required — this skill renders a query
response you already have.

## Input

The body the Axiom metrics query service returns for
`application/vnd.metrics.v3+json`: a regularly-sampled, multi-series time
series. The v2 form (`application/json+metrics.v2`) that the
[`query-metrics`](../query-metrics/) skill's `metrics-query` emits is also
accepted (v2 and v3 differ only by a per-series `summary`, which is ignored).

## Usage

```bash
# Render a saved response (auto-picks an inline image or ASCII for your terminal)
scripts/metrics_chart.py response.json

# Straight from a pipe (e.g. the query-metrics skill's metrics-query output)
... metrics-query prod '<mpl>' <start> <end> | scripts/metrics_chart.py

# Force a zero-dependency ASCII chart anywhere
scripts/metrics_chart.py --format ascii response.json

# High-fidelity PNG to a file
scripts/metrics_chart.py --format png --output chart.png response.json
```

Common options: `--tz <IANA|UTC>`, `--top <N>`, `--all`, `--title`,
`--width`/`--height`, `--color`/`--no-color`. See [SKILL.md](SKILL.md) for the
full reference and input schema.

## Scripts

| Script                  | Purpose                                              |
| ----------------------- | ---------------------------------------------------- |
| `metrics_chart.py`      | Render a metrics v3 (or v2) response as a line chart |
| `test_metrics_chart.py` | Unit tests: `python3 -m unittest test_metrics_chart` |

## Related Skills

- [`query-metrics`](../query-metrics/) - produces the metrics query responses this skill charts
- [`building-dashboards`](../building-dashboards/) - for persistent dashboards instead of ad-hoc terminal charts
