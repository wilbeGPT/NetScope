import os
import time
from pathlib import Path

import pandas as pd

try:
    import rpy2.robjects as robjects
    from rpy2.robjects import pandas2ri
    from rpy2.rinterface_lib.sexp import NULLType
    pandas2ri.activate()
except ImportError:
    robjects = None
    pandas2ri = None

    class NULLType:  # type: ignore[no-redef]
        pass


def _r_available() -> bool:
    return robjects is not None and pandas2ri is not None


def _run_r_script(script_name: str, function_name: str, df: pd.DataFrame, output_path: str) -> dict:
    if not _r_available():
        return {}

    script_path = os.path.join(os.path.dirname(__file__), f"../phases/r/{script_name}")
    robjects.r.source(script_path)
    r_func = robjects.globalenv[function_name]
    r_df = pandas2ri.py2rpy(df)

    if output_path:
        res = r_func(r_df, output_path)
    else:
        res = r_func(r_df)

    names = getattr(res, "names", None)
    if res is None or isinstance(res, NULLType) or names is None or isinstance(names, NULLType):
        return {}

    try:
        values = list(res)
    except TypeError:
        return {}

    return dict(zip(names, values))



def _generate_fase1_gantt_with_pil(blocks_df: pd.DataFrame, output_path: str) -> bool:
    if blocks_df.empty:
        return False
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        return False

    try:
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        df = blocks_df.copy()
        df["start_time"] = pd.to_numeric(df["start_time"], errors="coerce")
        df["end_time"] = pd.to_numeric(df["end_time"], errors="coerce")
        df = df.dropna(subset=["start_time", "end_time"]).sort_values("start_time")
        if df.empty:
            return False

        min_ts = float(df["start_time"].min())
        max_ts = float(df["end_time"].max())
        span = max(max_ts - min_ts, 1.0)

        width, height = 1380, 454
        margin_l, margin_r = 145, 42
        plot_top, plot_bottom = 78, 320
        plot_left, plot_right = margin_l, width - margin_r
        plot_w = plot_right - plot_left
        plot_h = plot_bottom - plot_top
        y_active = plot_top + 44
        y_off = plot_bottom - 36

        img = Image.new("RGB", (width, height), "white")
        draw = ImageDraw.Draw(img)

        try:
            title_font = ImageFont.truetype("arialbd.ttf", 18)
            axis_font = ImageFont.truetype("arialbd.ttf", 15)
            tick_font = ImageFont.truetype("arial.ttf", 13)
            label_font = ImageFont.truetype("arialbd.ttf", 12)
        except Exception:
            title_font = axis_font = tick_font = label_font = ImageFont.load_default()

        def x_for(ts: float) -> int:
            return plot_left + int((ts - min_ts) / span * plot_w)

        probe = str(df.get("probe_id", pd.Series(["N/D"])).iloc[0])
        title = f"Disponibilidad de la Sonda {probe} con Tiempos de Caida"
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        draw.text(((width - (title_bbox[2] - title_bbox[0])) // 2, 18), title, fill="#111827", font=title_font)

        # Plot frame and grid, matching the notebook/reference style.
        draw.rectangle((plot_left, plot_top, plot_right, plot_bottom), outline="#9ca3af", width=2)
        for i in range(1, 7):
            x = plot_left + int(plot_w * i / 7)
            draw.line((x, plot_top, x, plot_bottom), fill="#e5e7eb", width=1)
        mid_y = plot_top + plot_h // 2
        draw.line((plot_left, mid_y, plot_right, mid_y), fill="#e5e7eb", width=1)

        draw.text((28, y_active - 9), "Activa", fill="#111827", font=axis_font)
        draw.text((20, y_off - 9), "Apagada", fill="#111827", font=axis_font)
        draw.line((plot_left - 8, y_active, plot_left, y_active), fill="#111827", width=2)
        draw.line((plot_left - 8, y_off, plot_left, y_off), fill="#111827", width=2)

        # Colored state bands fill the whole state area, not a rounded timeline bar.
        for _, row in df.iterrows():
            x1 = x_for(float(row["start_time"]))
            x2 = max(x_for(float(row["end_time"])), x1 + 2)
            status = str(row.get("status"))
            fill = "#7fc77f" if status == "Activa" else "#ef9a9a"
            draw.rectangle((x1, y_active, x2, y_off), fill=fill)

        # Step line, like matplotlib step(where='post').
        previous_x = None
        previous_y = None
        for _, row in df.iterrows():
            x1 = x_for(float(row["start_time"]))
            x2 = x_for(float(row["end_time"]))
            y = y_active if str(row.get("status")) == "Activa" else y_off
            if previous_x is not None and previous_y is not None:
                draw.line((previous_x, previous_y, x1, previous_y), fill="#111827", width=2)
                draw.line((x1, previous_y, x1, y), fill="#111827", width=2)
            draw.line((x1, y, x2, y), fill="#111827", width=2)
            previous_x, previous_y = x2, y

        # Labels for meaningful outages only (> 2 hours), centered in red blocks.
        for _, row in df[df["status"].astype(str) == "Apagada"].iterrows():
            start = float(row["start_time"])
            end = float(row["end_time"])
            gap_hours = (end - start) / 3600
            if gap_hours <= 2:
                continue
            x1 = x_for(start)
            x2 = max(x_for(end), x1 + 2)
            cx = (x1 + x2) // 2
            label = f"Caida:\n{gap_hours:.1f} hrs"
            box_w, box_h = 62, 42
            box_l = max(plot_left + 3, min(cx - box_w // 2, plot_right - box_w - 3))
            box_t = int((y_active + y_off) / 2 - box_h / 2)
            draw.rounded_rectangle((box_l, box_t, box_l + box_w, box_t + box_h), radius=4, fill="white", outline="#dc2626", width=2)
            lines = label.split("\n")
            for j, line in enumerate(lines):
                bbox = draw.textbbox((0, 0), line, font=label_font)
                draw.text((box_l + (box_w - (bbox[2] - bbox[0])) // 2, box_t + 7 + j * 16), line, fill="#111827", font=label_font)

        # X ticks at daily intervals, aligned to the reference style.
        tick_count = 7
        for i in range(tick_count + 1):
            ts = min_ts + span * i / tick_count
            x = x_for(ts)
            draw.line((x, plot_bottom, x, plot_bottom + 8), fill="#111827", width=1)
            label = time.strftime("%d %b\n%I:%M %p", time.gmtime(ts - 6 * 3600))
            bbox = draw.multiline_textbbox((0, 0), label, font=tick_font, spacing=2)
            draw.multiline_text((x - (bbox[2] - bbox[0]) // 2, plot_bottom + 14), label, fill="#111827", font=tick_font, align="center", spacing=2)

        img.save(out)
        return True
    except Exception:
        return False

def _first_number(values, default=0):
    try:
        return values[0]
    except Exception:
        return default


def run_r_script_fase1(df_summary: pd.DataFrame, blocks_df: pd.DataFrame, inv_id: int) -> dict:
    total_packets = int(df_summary["total_packets"].sum()) if "total_packets" in df_summary else 0
    successful_packets = int(df_summary["successful_packets"].sum()) if "successful_packets" in df_summary else 0
    dns_exitoso = int(df_summary["dst_addr"].notna().sum()) if "dst_addr" in df_summary else 0
    disponibilidad_pct = (successful_packets / total_packets * 100) if total_packets else 0.0

    res_dict = _run_r_script("fase1_disponibilidad.R", "generate_fase1_report", df_summary, "")

    output = f"./data/exports/fase1_plot_{inv_id}.png"
    png_url = None
    if not blocks_df.empty:
        generated = False
        if _r_available():
            _run_r_script("fase1_gantt.R", "generate_gantt", blocks_df, output)
            generated = os.path.exists(output)
        if not generated:
            generated = _generate_fase1_gantt_with_pil(blocks_df, output)
        if generated:
            png_url = f"/exports/fase1_plot_{inv_id}.png?t={int(time.time())}"

    return {
        "metricas_resumen": {
            "total_intentos": int(_first_number(res_dict.get("total_intentos"), total_packets)) if res_dict else total_packets,
            "mediciones_reales": int(_first_number(res_dict.get("mediciones_reales"), successful_packets)) if res_dict else successful_packets,
            "dns_exitoso": int(_first_number(res_dict.get("dns_exitoso"), dns_exitoso)) if res_dict else dns_exitoso,
            "disponibilidad_pct": float(_first_number(res_dict.get("disponibilidad_pct"), disponibilidad_pct)) if res_dict else disponibilidad_pct,
        },
        "series_chart": [],
        "tabla": [],
        "boxplot": None,
        "grafica_png_url": png_url,
    }


def run_r_script_fase2(df: pd.DataFrame, inv_id: int) -> dict:
    output = f"./data/exports/fase2_plot_{inv_id}.png"
    res_dict = _run_r_script("fase2_linea_base.R", "generate_fase2_report", df, output)
    return {
        "metricas_resumen": {
            "sonda_optima": str(_first_number(res_dict.get("sonda_optima"), "")),
            "rtt_minimo": float(_first_number(res_dict.get("rtt_minimo"), 0.0)),
            "rtt_promedio": float(_first_number(res_dict.get("rtt_promedio"), 0.0)),
        },
        "series_chart": [],
        "tabla": [],
        "boxplot": None,
        "grafica_png_url": f"/exports/fase2_plot_{inv_id}.png" if _r_available() else None,
    }


def run_r_script_fase3(df: pd.DataFrame, inv_id: int) -> dict:
    output = f"./data/exports/fase3_plot_{inv_id}.png"
    res_dict = _run_r_script("fase3_mapeo_asn.R", "generate_fase3_report", df, output)
    return {
        "metricas_resumen": {
            "total_asns": int(_first_number(res_dict.get("total_asns"), 0)),
            "asns_extranjeros": int(_first_number(res_dict.get("asns_extranjeros"), 0)),
        },
        "series_chart": [],
        "tabla": [],
        "boxplot": None,
        "grafica_png_url": f"/exports/fase3_plot_{inv_id}.png" if _r_available() else None,
    }


def run_r_script_fase4(df: pd.DataFrame, inv_id: int, nodes_table: list, rtt_series: list, anomalias: int) -> dict:
    output = f"./data/exports/fase4_plot_{inv_id}.png"
    res_dict = _run_r_script("fase4_path_inflation.R", "generate_fase4_report", df, output)
    return {
        "metricas_resumen": {
            "probes": int(_first_number(res_dict.get("probes"), 0)),
            "targets": int(_first_number(res_dict.get("targets"), 0)),
            "anomalias": anomalias,
        },
        "series_chart": rtt_series,
        "tabla": nodes_table,
        "boxplot": None,
        "grafica_png_url": f"/exports/fase4_plot_{inv_id}.png" if _r_available() else None,
    }


def run_r_script_fase5(df: pd.DataFrame, inv_id: int, boxplot_data: list) -> dict:
    output = f"./data/exports/fase5_plot_{inv_id}.png"
    _run_r_script("fase5_jitter.R", "generate_fase5_report", df, output)
    return {
        "metricas_resumen": {
            "probes": int(df["prb_id"].nunique()) if "prb_id" in df.columns else 0,
            "muestras_rtt": int(len(df)),
            "rtt_promedio": float(df["rtt"].mean()) if "rtt" in df.columns and len(df) else 0.0,
            "jitter_estimado": float(df["rtt"].std()) if "rtt" in df.columns and len(df) > 1 else 0.0,
        },
        "series_chart": [],
        "tabla": [],
        "boxplot": boxplot_data,
        "grafica_png_url": f"/exports/fase5_plot_{inv_id}.png" if _r_available() else None,
    }

