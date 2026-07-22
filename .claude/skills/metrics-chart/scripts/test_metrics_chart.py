"""Tests for metrics_chart.

Run: python3 -m unittest test_metrics_chart -v   (from the scripts/ dir)

The golden payloads mirror service/query/src/server/tests.rs so the parser is
validated against the exact bytes the metrics query service emits for
application/vnd.metrics.v3+json.
"""

from __future__ import annotations

import argparse
import io
import json
import unittest

import metrics_chart as mc


# The v3 golden payload is the v2 golden from server/tests.rs with the per-series
# `summary` field removed (the only structural difference between v2 and v3).
V3_DOC = json.loads(
    r"""{"metadata":{"group_keys":["code","method"],"warnings":["a warning"],"unit":"ms","custom_unit":"millisec"},"series":[
      {"metric":"http_requests","tags":{"code":200,"method":"GET","path":"/"},"start":1750753164,"resolution":60,"data":[420.0,42.0,30.0,9.0,15.0,18.0]},
      {"metric":"http_requests","tags":{"code":403,"method":"DELETE","path":"/user"},"start":1750753164,"resolution":60,"data":[42.0,60.0,69.0,33.0,12.0,99.0]}
    ]}"""
)

# v2 carries `summary`; the parser must ignore it and behave identically.
V2_DOC = json.loads(
    r"""{"metadata":{},"series":[
      {"metric":"http_requests","tags":{"code":200,"method":"GET","path":"/"},"start":1750753164,"resolution":60,"data":[420.0,42.0,30.0,9.0,15.0,18.0],"summary":18.0}
    ]}"""
)


class ParseTests(unittest.TestCase):
    def test_parses_v3_series_and_metadata(self):
        meta, series = mc.parse(V3_DOC)
        self.assertEqual(meta.group_keys, ["code", "method"])
        self.assertEqual(meta.warnings, ["a warning"])
        self.assertEqual(meta.unit, "ms")
        self.assertEqual(meta.custom_unit, "millisec")
        self.assertEqual(len(series), 2)
        self.assertEqual(series[0].values, [420.0, 42.0, 30.0, 9.0, 15.0, 18.0])
        self.assertEqual(series[0].start, 1750753164)
        self.assertEqual(series[0].resolution, 60)

    def test_label_uses_group_keys_in_order_pipe_joined(self):
        # group_keys = [code, method] -> "200 | GET", not "code=200,method=GET"
        _meta, series = mc.parse(V3_DOC)
        labels = sorted(s.label for s in series)
        self.assertEqual(labels, ["200 | GET", "403 | DELETE"])

    def test_label_falls_back_to_all_tags_without_group_keys(self):
        doc = {
            "series": [
                {
                    "metric": "m",
                    "tags": {"a": 1, "b": "x"},
                    "start": 0,
                    "resolution": 60,
                    "data": [1.0],
                }
            ]
        }
        _meta, series = mc.parse(doc)
        # No group_keys -> show distinguishing tags as k=v, stable order.
        self.assertEqual(series[0].label, "a=1, b=x")

    def test_v2_summary_field_is_ignored(self):
        meta, series = mc.parse(V2_DOC)
        self.assertEqual(meta.group_keys, [])
        self.assertEqual(series[0].values, [420.0, 42.0, 30.0, 9.0, 15.0, 18.0])

    def test_null_points_become_gaps(self):
        doc = {
            "series": [
                {"metric": "m", "tags": {}, "start": 0, "resolution": 60,
                 "data": [1.0, None, 3.0]}
            ]
        }
        _meta, series = mc.parse(doc)
        self.assertEqual(series[0].values, [1.0, None, 3.0])

    def test_bool_and_float_int_tag_values_format_cleanly(self):
        # bool -> true/false; whole-number float -> integer (no ".0")
        self.assertEqual(
            mc.format_label({"ok": True, "n": 200.0}, ["ok", "n"], False, "m"),
            "true | 200",
        )

    def test_multi_metric_disambiguates_with_braces(self):
        doc = {"series": [
            {"metric": "a", "tags": {"x": 1}, "start": 0, "resolution": 60, "data": [1.0]},
            {"metric": "b", "tags": {"x": 2}, "start": 0, "resolution": 60, "data": [2.0]},
        ]}
        _meta, series = mc.parse(doc)
        self.assertTrue(any(s.label.startswith("a{") for s in series))

    def test_inf_tag_value_string_is_kept(self):
        doc = {
            "series": [
                {"metric": "m", "tags": {"le": "+Inf"}, "start": 0,
                 "resolution": 60, "data": [1.0]}
            ]
        }
        _meta, series = mc.parse(doc)
        self.assertEqual(series[0].label, "le=+Inf")


class ValueFormatTests(unittest.TestCase):
    def test_extreme_and_small_magnitudes_use_scientific(self):
        self.assertIn("e", mc._fmt_value(2_500_000.0))
        self.assertIn("e", mc._fmt_value(0.0001))

    def test_mid_magnitudes_are_plain(self):
        self.assertEqual(mc._fmt_value(420.0), "420")
        self.assertEqual(mc._fmt_value(9.0), "9.0")


class FlatLineTests(unittest.TestCase):
    def test_constant_series_renders_without_zero_division(self):
        meta = mc.Metadata()
        s = mc.Series(label="flat", metric="m", tags={}, start=0,
                      resolution=60, values=[5.0, 5.0, 5.0])
        out = mc.render_ascii([s], meta, tz=mc.timezone.utc, width=20,
                              height=6, color=False)
        self.assertIn("flat", out)


class TimestampTests(unittest.TestCase):
    def test_point_timestamps_are_start_plus_index_times_resolution(self):
        _meta, series = mc.parse(V3_DOC)
        ts = mc.point_timestamps(series[0])
        self.assertEqual(ts, [1750753164 + 60 * i for i in range(6)])


class ReductionTests(unittest.TestCase):
    def _series(self, label, values):
        return mc.Series(label=label, metric="m", tags={}, start=0,
                         resolution=60, values=values)

    def test_identical_series_collapse(self):
        a = self._series("a", [1.0, 2.0, 3.0])
        b = self._series("b", [1.0, 2.0, 3.0])
        reps, n_collapsed = mc.collapse_overlapping([a, b], eps=0.02)
        self.assertEqual(len(reps), 1)
        self.assertEqual(n_collapsed, 1)

    def test_distinct_series_do_not_collapse(self):
        a = self._series("a", [1.0, 1.0, 1.0])
        b = self._series("b", [100.0, 100.0, 100.0])
        reps, n_collapsed = mc.collapse_overlapping([a, b], eps=0.02)
        self.assertEqual(len(reps), 2)
        self.assertEqual(n_collapsed, 0)

    def test_flat_disjoint_series_do_not_collapse(self):
        # Both constant at 5.0 (global range == 0) but with NO timestamps in
        # common: their lines never align, so they must stay distinct. A naive
        # rng==0 short-circuit would wrongly merge them and drop one series.
        a = mc.Series(label="a", metric="m", tags={}, start=0,
                      resolution=60, values=[5.0, 5.0, 5.0])    # t=0,60,120
        b = mc.Series(label="b", metric="m", tags={}, start=180,
                      resolution=60, values=[5.0, 5.0, 5.0])    # t=180,240,300
        reps, n_collapsed = mc.collapse_overlapping([a, b], eps=0.02)
        self.assertEqual(sorted(s.label for s in reps), ["a", "b"])
        self.assertEqual(n_collapsed, 0)

    def test_flat_overlapping_identical_series_collapse(self):
        # Same constant value AND same timestamps: the lines coincide exactly,
        # so they should still collapse to a single representative.
        a = mc.Series(label="a", metric="m", tags={}, start=0,
                      resolution=60, values=[5.0, 5.0, 5.0])
        b = mc.Series(label="b", metric="m", tags={}, start=0,
                      resolution=60, values=[5.0, 5.0, 5.0])
        reps, n_collapsed = mc.collapse_overlapping([a, b], eps=0.02)
        self.assertEqual(len(reps), 1)
        self.assertEqual(n_collapsed, 1)

    def test_select_caps_at_top_n_and_counts_dropped(self):
        # 5 clearly-separated series, keep top 2 by peak.
        ss = [self._series(str(i), [float(i * 100)]) for i in range(1, 6)]
        sel = mc.select_series(ss, top_n=2, eps=0.02)
        self.assertEqual(len(sel.kept), 2)
        self.assertEqual(sel.total, 5)
        self.assertEqual(sel.n_collapsed, 0)
        self.assertEqual(sel.n_hidden, 3)
        # highest peaks kept
        self.assertEqual(sorted(s.label for s in sel.kept), ["4", "5"])

    def test_annotation_mentions_overlapping_and_hidden(self):
        ss = ([self._series("dup%d" % i, [5.0, 5.0]) for i in range(4)]
              + [self._series("big", [1000.0, 1000.0])]
              + [self._series("mid%d" % i, [float(100 + i)]) for i in range(3)])
        sel = mc.select_series(ss, top_n=2, eps=0.02)
        note = mc.annotation(sel)
        self.assertIn("of %d series" % sel.total, note)
        self.assertTrue("overlapping" in note or "hidden" in note)


class BrailleTests(unittest.TestCase):
    def test_single_dot_top_left(self):
        c = mc.BrailleCanvas(1, 1)
        c.set(0, 0, 0)
        self.assertEqual(c.char_at(0, 0), chr(0x2801))  # dot 1

    def test_bottom_right_dot(self):
        c = mc.BrailleCanvas(1, 1)
        c.set(1, 3, 0)
        self.assertEqual(c.char_at(0, 0), chr(0x2880))  # dot 8

    def test_two_dots_merge_in_one_cell(self):
        c = mc.BrailleCanvas(1, 1)
        c.set(0, 0, 0)
        c.set(1, 3, 0)
        self.assertEqual(c.char_at(0, 0), chr(0x2881))

    def test_out_of_bounds_is_ignored(self):
        c = mc.BrailleCanvas(1, 1)
        c.set(99, 99, 0)  # must not raise
        self.assertEqual(c.char_at(0, 0), chr(0x2800))

    def test_horizontal_line_sets_pixels(self):
        c = mc.BrailleCanvas(4, 1)
        c.line(0, 0, 7, 0, 0)
        # every cell in the row should have at least one dot
        for col in range(4):
            self.assertNotEqual(c.char_at(col, 0), chr(0x2800))


class RenderSmokeTests(unittest.TestCase):
    def test_render_ascii_contains_labels_and_unit(self):
        meta, series = mc.parse(V3_DOC)
        out = mc.render_ascii(series, meta, tz=None, width=40, height=8,
                              color=False, title="t")
        self.assertIn("200 | GET", out)
        # y axis prefers the human custom_unit ("millisec") over canonical "ms"
        self.assertIn("millisec", out)
        self.assertIn("a warning", out)  # warning caption


class GnuplotScriptTests(unittest.TestCase):
    def test_script_sets_time_axis_missing_and_labels(self):
        meta, series = mc.parse(V3_DOC)
        script = mc._gnuplot_script(series, meta, tz=None, term="pngcairo",
                                    width_px=800, height_px=400, title="t",
                                    output="/tmp/x.png")
        self.assertIn("set xdata time", script)
        self.assertIn("set timefmt '%s'", script)
        self.assertIn('set datafile missing "NaN"', script)
        self.assertIn("200 | GET", script)
        self.assertIn("set output '/tmp/x.png'", script)

    def test_unicode_title_is_not_uXXXX_escaped(self):
        # em dash must reach gnuplot as real UTF-8, not a literal \u2014
        meta, series = mc.parse(V3_DOC)
        script = mc._gnuplot_script(series, meta, tz=None, term="pngcairo",
                                    width_px=800, height_px=400,
                                    title="lat \u2014 p95", output=None)
        self.assertIn("lat \u2014 p95", script)
        self.assertNotIn("\\u2014", script)

    def test_font_size_scales_with_canvas_and_is_readable(self):
        import re
        meta, series = mc.parse(V3_DOC)
        def fontpt(w, h):
            s = mc._gnuplot_script(series, meta, None, "pngcairo", w, h, None, None)
            return int(re.search(r"font 'sans,(\d+)'", s).group(1))
        small, big = fontpt(400, 200), fontpt(1600, 1200)
        self.assertGreaterEqual(small, 12)   # never microscopic
        self.assertGreater(big, small)       # scales up with the canvas

    def test_explicit_font_size_is_respected(self):
        meta, series = mc.parse(V3_DOC)
        s = mc._gnuplot_script(series, meta, None, "pngcairo", 800, 400,
                               None, None, font_size=22)
        self.assertIn("font 'sans,22'", s)

    def test_null_points_emit_NaN(self):
        doc = {"series": [{"metric": "m", "tags": {}, "start": 0,
                           "resolution": 60, "data": [1.0, None, 3.0]}]}
        meta, series = mc.parse(doc)
        script = mc._gnuplot_script(series, meta, tz=mc.timezone.utc,
                                    term="pngcairo", width_px=100,
                                    height_px=100, title=None, output=None)
        self.assertIn("NaN", script)


class GnuplotTimezoneTests(unittest.TestCase):
    # gnuplot's time axis is UTC-only, so epochs are pre-shifted by the tz
    # offset. These pin the offset so PNG/SVG/sixel x-axes match the local
    # wall-clock labels that render_ascii prints.
    TS = 1750753164

    def test_offset_is_zero_for_utc(self):
        self.assertEqual(mc._tz_offset_seconds(mc.timezone.utc, self.TS), 0)

    def test_offset_matches_local_for_naive_tz(self):
        # tz=None means local wall-clock; a naive datetime's utcoffset() is
        # None, so the offset must be recovered from the local zone, not 0.
        expected = int(mc.datetime.fromtimestamp(self.TS)
                       .astimezone().utcoffset().total_seconds())
        self.assertEqual(mc._tz_offset_seconds(None, self.TS), expected)

    def test_shifted_epoch_reads_as_local_wall_clock(self):
        # The epoch emitted to gnuplot, formatted as UTC, must equal the ASCII
        # local label so the two renderers agree on the x-axis.
        off = mc._tz_offset_seconds(None, self.TS)
        shifted = mc.datetime.fromtimestamp(self.TS + off, mc.timezone.utc)
        local = mc.datetime.fromtimestamp(self.TS)  # naive local
        self.assertEqual(shifted.strftime("%H:%M"), local.strftime("%H:%M"))

    def test_offset_is_per_instant_across_dst(self):
        try:
            from zoneinfo import ZoneInfo
        except ImportError:
            self.skipTest("zoneinfo unavailable")
        tz = ZoneInfo("America/New_York")
        # Spring-forward transition is 2021-03-14 07:00 UTC (2am EST -> 3am EDT).
        before = 1615701600  # one hour before, still EST (-5h)
        after = 1615708800   # one hour after, now EDT (-4h)
        self.assertEqual(mc._tz_offset_seconds(tz, before), -5 * 3600)
        self.assertEqual(mc._tz_offset_seconds(tz, after), -4 * 3600)

    def test_gnuplot_data_uses_per_point_offset_across_dst(self):
        try:
            from zoneinfo import ZoneInfo
        except ImportError:
            self.skipTest("zoneinfo unavailable")
        tz = ZoneInfo("America/New_York")
        # Two points straddling spring-forward: each must shift by its own
        # offset, not a single offset taken from the first sample.
        doc = {"series": [{"metric": "m", "tags": {}, "start": 1615701600,
                           "resolution": 7200, "data": [1.0, 2.0]}]}
        meta, series = mc.parse(doc)
        script = mc._gnuplot_script(series, meta, tz=tz, term="pngcairo",
                                    width_px=100, height_px=100,
                                    title=None, output=None)
        self.assertIn(f"{1615701600 - 5 * 3600} 1.0", script)  # EST point
        self.assertIn(f"{1615708800 - 4 * 3600} 2.0", script)  # EDT point


class DisplayInstructionTests(unittest.TestCase):
    def test_instruction_names_the_path_and_tells_agent_to_display(self):
        msg = mc._display_instruction("/tmp/chart.png")
        self.assertIn("/tmp/chart.png", msg)
        self.assertIn("Display this file", msg)
        self.assertIn("do not paste", msg)


class FormatResolutionTests(unittest.TestCase):
    # auto should favour images; ASCII only for plain TTY or when gnuplot absent.
    def test_piped_agent_with_gnuplot_picks_png_file(self):
        # not a TTY (agent harness captures stdout), gnuplot present -> png file
        self.assertEqual(mc._resolve_format("auto", True, None, False), "png")

    def test_image_terminal_picks_png_inline(self):
        self.assertEqual(mc._resolve_format("auto", True, "kitty", True), "png")

    def test_plain_terminal_picks_ascii(self):
        self.assertEqual(mc._resolve_format("auto", True, None, True), "ascii")

    def test_no_gnuplot_picks_ascii(self):
        self.assertEqual(mc._resolve_format("auto", False, None, False), "ascii")
        self.assertEqual(mc._resolve_format("auto", False, "kitty", True), "ascii")

    def test_explicit_format_is_respected(self):
        self.assertEqual(mc._resolve_format("ascii", True, "kitty", True), "ascii")
        self.assertEqual(mc._resolve_format("png", False, None, False), "png")
        self.assertEqual(mc._resolve_format("svg", True, None, False), "svg")


class InlineEscapeTests(unittest.TestCase):
    def _capture(self, fn, *a):
        import io
        buf = io.StringIO()
        old = mc.sys.stdout
        mc.sys.stdout = buf
        try:
            fn(*a)
        finally:
            mc.sys.stdout = old
        return buf.getvalue()

    def test_iterm2_wraps_in_osc1337(self):
        out = self._capture(mc.emit_iterm2, b"abc")
        self.assertTrue(out.startswith("\x1b]1337;File=inline=1;size=3:"))
        self.assertIn("\x07", out)

    def test_kitty_single_chunk_terminates_with_m0(self):
        out = self._capture(mc.emit_kitty, b"abc")
        self.assertIn("\x1b_Ga=T,f=100,q=2,m=0;", out)  # small => one chunk
        self.assertIn("\x1b\\", out)


class TopValidationTests(unittest.TestCase):
    # --top is a peak cap, not a Python slice: it must be a positive integer.
    # Non-positive values previously fed reps[:top_n], so --top 0 selected
    # nothing and negatives dropped a suffix, producing an empty gnuplot plot.
    def test_positive_int_accepts_positive_values(self):
        self.assertEqual(mc._positive_int("1"), 1)
        self.assertEqual(mc._positive_int("8"), 8)

    def test_positive_int_rejects_zero(self):
        with self.assertRaises(argparse.ArgumentTypeError):
            mc._positive_int("0")

    def test_positive_int_rejects_negative(self):
        with self.assertRaises(argparse.ArgumentTypeError):
            mc._positive_int("-3")

    def test_positive_int_rejects_non_integer(self):
        with self.assertRaises(argparse.ArgumentTypeError):
            mc._positive_int("abc")

    def _run_main(self, argv):
        # Feed a valid one-series payload so the only failure mode under test is
        # --top validation, which must happen before any input is consumed.
        old_stdin = mc.sys.stdin
        old_stderr = mc.sys.stderr
        err = io.StringIO()
        mc.sys.stdin = io.TextIOWrapper(io.BytesIO(json.dumps(V3_DOC).encode()))
        mc.sys.stderr = err
        try:
            return mc.main(argv), err.getvalue()
        finally:
            mc.sys.stdin = old_stdin
            mc.sys.stderr = old_stderr

    def test_main_rejects_top_zero(self):
        with self.assertRaises(SystemExit) as ctx:
            self._run_main(["--top", "0", "--format", "ascii"])
        self.assertEqual(ctx.exception.code, 2)

    def test_main_rejects_top_negative(self):
        with self.assertRaises(SystemExit) as ctx:
            self._run_main(["--top", "-2", "--format", "ascii"])
        self.assertEqual(ctx.exception.code, 2)

    def test_main_accepts_top_one(self):
        rc, _ = self._run_main(["--top", "1", "--format", "ascii"])
        self.assertEqual(rc, 0)


if __name__ == "__main__":
    unittest.main()
