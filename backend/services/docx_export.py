import io
import os
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
from docx.shared import Inches, Pt, RGBColor


def set_cell_background(cell, hex_color: str) -> None:
    """Sets background fill color of a table cell."""
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)


def make_row_header(row) -> None:
    """Marks a table row as a repeating header across page splits."""
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))


def make_row_cant_split(row) -> None:
    """Prevents a table row from awkwardly breaking across pages."""
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))


def set_table_borders(table) -> None:
    """Sets formal academic borders (APA / IEEE format: top/bottom rules, header rule)."""
    tblPr = table._tbl.tblPr
    borders_xml = f"""
    <w:tblBorders {nsdecls("w")}>
        <w:top w:val="single" w:sz="12" w:space="0" w:color="000000"/>
        <w:bottom w:val="single" w:sz="12" w:space="0" w:color="000000"/>
        <w:left w:val="none"/>
        <w:right w:val="none"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
        <w:insideV w:val="none"/>
    </w:tblBorders>
    """
    tblPr.append(parse_xml(borders_xml))


def is_numeric_value(val: Any) -> bool:
    if isinstance(val, (int, float)):
        return True
    if isinstance(val, str):
        cleaned = val.replace(",", ".").replace("%", "").replace("ms", "").strip()
        try:
            float(cleaned)
            return True
        except ValueError:
            return False
    return False


def format_cell_value(val: Any) -> str:
    if val is None or val == "":
        return "-"
    if isinstance(val, float):
        return f"{val:.2f}"
    return str(val)


def resolve_image_path(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    clean = url.split("?")[0]
    filename = os.path.basename(clean)

    candidates = [
        os.path.join("./data/exports", filename),
        os.path.join("./data", clean.lstrip("/")),
        os.path.join(os.path.dirname(__file__), "../data/exports", filename),
        clean,
    ]
    for c in candidates:
        if os.path.exists(c) and os.path.isfile(c):
            return c
    return None


def add_justified_paragraph(doc: Document, text: str, space_after: int = 4) -> None:
    """Adds a justified body paragraph with formal academic typography."""
    for line in text.split("\n"):
        stripped = line.strip()
        if not stripped:
            continue
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(stripped)
        run.font.name = "Calibri"
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(17, 24, 39)


def add_caption_paragraph(doc: Document, caption_text: str) -> None:
    """Adds a formal figure or table caption below the element."""
    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_cap.paragraph_format.space_before = Pt(3)
    p_cap.paragraph_format.space_after = Pt(12)
    run_cap = p_cap.add_run(caption_text)
    run_cap.italic = True
    run_cap.font.name = "Calibri"
    run_cap.font.size = Pt(8.5)
    run_cap.font.color.rgb = RGBColor(100, 116, 139)


def build_academic_table(doc: Document, columns: List[str], rows: List[Dict[str, Any]], caption: str) -> None:
    """Builds a formal Microsoft Word table with headers, alignment and shading."""
    if not columns and rows:
        columns = list(rows[0].keys())

    if not columns:
        return

    # Cap table to avoid docx explosion if table has thousands of rows
    display_rows = rows[:100]

    table = doc.add_table(rows=len(display_rows) + 1, cols=len(columns))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table)

    # 1. Header row
    hdr_cells = table.rows[0].cells
    make_row_header(table.rows[0])
    for idx, col_name in enumerate(columns):
        cell = hdr_cells[idx]
        set_cell_background(cell, "F1F5F9")
        p = cell.paragraphs[0]
        is_num_col = bool(re.search(r"RTT|ms|Delta|Loss|%|Pérdida|Paquetes|Total|Hops|Exceso|Jitter|StdDev|p95|Mediana|Promedio", str(col_name), re.I))
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT if is_num_col else WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(str(col_name))
        run.bold = True
        run.font.name = "Calibri"
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(0, 0, 0)

    # 2. Data rows
    for r_idx, row_data in enumerate(display_rows):
        row = table.rows[r_idx + 1]
        make_row_cant_split(row)
        for c_idx, col_name in enumerate(columns):
            cell = row.cells[c_idx]
            val = row_data.get(col_name, "")
            formatted = format_cell_value(val)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT if is_numeric_value(val) and not re.search(r"ASN|IP|ID|Probe|Sonda", col_name, re.I) else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(formatted)
            run.font.name = "Calibri"
            run.font.size = Pt(8.5)
            run.font.color.rgb = RGBColor(31, 41, 55)

    # 3. Caption below table
    add_caption_paragraph(doc, caption)


def generate_chart_image(el: Dict[str, Any]) -> Optional[io.BytesIO]:
    """
    Renders high-resolution scientific charts using matplotlib for visual
    figure elements in Chapter 4 (Figures 2, 6, 12, 13, 19, 21, 22, 23, 24, 25, 26).
    """
    kind = el.get("kind")
    eid = str(el.get("id"))
    rows = el.get("rows") or []
    if not rows:
        return None

    ISP_COLORS = {
        "Claro SV": "#ef4444",
        "Movistar SV": "#3b82f6",
        "Conective SV": "#10b981",
        "UCA": "#f59e0b",
        "UES": "#8b5cf6",
        "Liberty SV": "#06b6d4",
        "Navega GT": "#a855f7",
        "Globalnet HN": "#64748b",
    }
    FALLBACK_COLORS = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#64748b"]

    fig = None
    try:
        # Figura 2: Volumen de Mediciones por Categoría de Destino
        if eid == "2" or (kind == "bar" and "categoria" in rows[0]):
            fig, ax = plt.subplots(figsize=(7.5, 4.0), dpi=180)
            cats = [str(r.get("categoria", "")) for r in rows]
            ips = [k for k in rows[0].keys() if k != "categoria"]
            bottom = [0.0] * len(cats)
            colors = ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b"]
            for idx, ip in enumerate(ips):
                vals = [float(r.get(ip, 0)) for r in rows]
                color = colors[idx % len(colors)]
                ax.bar(cats, vals, bottom=bottom, label=ip, color=color, width=0.6, edgecolor="#000000", linewidth=0.3)
                bottom = [b + v for b, v in zip(bottom, vals)]
            ax.set_title("Figura 2: Detalle de Mediciones por Categoría de Destino", fontsize=11, fontweight="bold", pad=10)
            ax.set_xlabel("ID de Sonda", fontsize=9.5)
            ax.set_ylabel("Volumen de Mediciones", fontsize=9.5)
            ax.set_xticks(range(len(cats)))
            ax.set_xticklabels(cats, rotation=45, ha="right", fontsize=8)
            ax.set_ylim(0, (max(bottom) * 1.15) if bottom else 1000)
            ax.grid(True, linestyle="--", alpha=0.45, axis="y")
            ax.legend(title="IP Destino", bbox_to_anchor=(1.02, 1), loc="upper left", fontsize=8)
            plt.tight_layout()

        # Figura 6: Distribución temporal de mediciones de la sonda 1013115 (Gantt)
        elif eid == "6" or kind == "gantt":
            fig, ax = plt.subplots(figsize=(7.5, 3.2), dpi=180)
            probe_label = el.get("probe_id") or rows[0].get("probe_id", "1013115")
            min_t = min(r["start_time"] for r in rows)
            max_t = max(r["end_time"] for r in rows)

            ax.axhspan(1.68, 2.32, facecolor="#f8fafc", edgecolor="#e2e8f0", linewidth=0.5)
            ax.axhspan(0.68, 1.32, facecolor="#f8fafc", edgecolor="#e2e8f0", linewidth=0.5)

            for r in rows:
                st = r["start_time"]
                et = r["end_time"]
                status = r.get("status", "Activa")
                y_center = 2.0 if status == "Activa" else 1.0
                color = "#10b981" if status == "Activa" else "#ef4444"
                start_h = (st - min_t) / 3600.0
                dur_h = max((et - st) / 3600.0, 0.4)
                ax.barh(y_center, dur_h, left=start_h, height=0.52, color=color, edgecolor="#334155", linewidth=0.4)
                label = r.get("label", "").strip()
                if status == "Apagada" and label:
                    clean_lbl = label.replace("\n", " ")
                    mid_h = start_h + dur_h / 2.0
                    ax.text(mid_h, 1.0, clean_lbl, ha="center", va="center", fontsize=7.2, fontweight="bold",
                            color="#1e293b", bbox=dict(boxstyle="round,pad=0.2", facecolor="#ffffff", edgecolor="#ef4444", linewidth=0.8, alpha=0.95))

            ax.set_yticks([1.0, 2.0])
            ax.set_yticklabels(["Apagada", "Activa"], fontsize=9, fontweight="bold")
            ax.set_ylim(0.35, 2.65)

            total_hours = (max_t - min_t) / 3600.0
            tick_positions = list(range(0, int(total_hours) + 24, 24))
            tick_labels = [(datetime.fromtimestamp(min_t) + timedelta(hours=h)).strftime("%d %b") for h in tick_positions]
            ax.set_xticks(tick_positions)
            ax.set_xticklabels(tick_labels, fontsize=8.5)
            ax.set_xlabel("Línea Temporal (Fecha)", fontsize=9.5)
            ax.set_title(f"Figura 6: Disponibilidad Temporal de la Sonda {probe_label} (Tiempos de Caída)", fontsize=11, fontweight="bold", pad=10)
            ax.grid(True, linestyle="--", alpha=0.45, axis="x")
            plt.tight_layout()

        # Figura 12: Mediana de Latencia por Sonda
        elif eid == "12" or (kind == "bar" and "Latencia Mediana (ms)" in rows[0]):
            fig, ax = plt.subplots(figsize=(7.5, 3.8), dpi=180)
            probes = [str(r.get("ID de Sonda", "")) for r in rows]
            latencies = [float(r.get("Latencia Mediana (ms)", 0)) for r in rows]
            bar_colors = [r.get("fill", "#3b82f6") for r in rows]
            bars = ax.bar(probes, latencies, color=bar_colors, edgecolor="#000000", linewidth=0.4, width=0.6)
            ax.set_title("Figura 12: Mediana de Latencia (RTT) por Sonda Hacia la UFG", fontsize=11, fontweight="bold", pad=10)
            ax.set_xlabel("ID de Sonda RIPE Atlas", fontsize=9.5)
            ax.set_ylabel("RTT Mediano (ms)", fontsize=9.5)
            ax.set_xticks(range(len(probes)))
            ax.set_xticklabels(probes, rotation=45, ha="right", fontsize=8)
            ax.set_ylim(0, (max(latencies) * 1.18) if latencies else 120)
            ax.grid(True, linestyle="--", alpha=0.45, axis="y")
            for b in bars:
                h = b.get_height()
                if h > 0:
                    ax.text(b.get_x() + b.get_width() / 2, h + 1, f"{h:.1f}", ha="center", fontsize=7.5)
            plt.tight_layout()

        # Figura 13: Pérdida de Paquetes por Sonda
        elif eid == "13" or (kind == "bar" and "Porcentaje de Perdida (%)" in rows[0]):
            fig, ax = plt.subplots(figsize=(7.5, 3.8), dpi=180)
            probes = [str(r.get("ID de Sonda", "")) for r in rows]
            loss_pcts = [float(r.get("Porcentaje de Perdida (%)", 0)) for r in rows]
            bar_colors = ["#ef4444" if v > 1.0 else "#3b82f6" for v in loss_pcts]
            bars = ax.bar(probes, loss_pcts, color=bar_colors, edgecolor="#000000", linewidth=0.4, width=0.6)
            ax.set_title("Figura 13: Pérdida de Paquetes (Packet Loss %) por Sonda", fontsize=11, fontweight="bold", pad=10)
            ax.set_xlabel("ID de Sonda RIPE Atlas", fontsize=9.5)
            ax.set_ylabel("Pérdida de Paquetes (%)", fontsize=9.5)
            ax.set_xticks(range(len(probes)))
            ax.set_xticklabels(probes, rotation=45, ha="right", fontsize=8)
            ax.set_ylim(0, (max(loss_pcts) * 1.20) if loss_pcts else 30)
            ax.grid(True, linestyle="--", alpha=0.45, axis="y")
            for b in bars:
                h = b.get_height()
                ax.text(b.get_x() + b.get_width() / 2, h + 0.3, f"{h:.1f}%", ha="center", fontsize=7.5)
            plt.tight_layout()

        # Figura 19: Rutas de Backbone hacia IPs del Servidor (Grouped Side-by-Side)
        elif eid == "19" or (kind == "bar" and "Sonda" in rows[0]):
            fig, ax = plt.subplots(figsize=(7.5, 4.0), dpi=180)
            sondas = [str(r.get("Sonda", "")) for r in rows]
            cols = [k for k in ["45.227.202.7", "200.124.138.24"] if any(k in r for r in rows)]
            if not cols:
                cols = [k for k in rows[0].keys() if k != "Sonda"]
            x = np.arange(len(sondas))
            width = 0.38 if len(cols) == 2 else 0.55
            colors = {"45.227.202.7": "#3b82f6", "200.124.138.24": "#f59e0b"}
            for idx, c in enumerate(cols):
                vals = [float(r.get(c, 0) or 0) for r in rows]
                offset = (idx - 0.5) * width if len(cols) == 2 else 0
                ax.bar(x + offset, vals, width=width, label=c, color=colors.get(c, "#64748b"), edgecolor="#000000", linewidth=0.3)
            ax.set_title("Figura 19: Comparativa de Latencia de Backbone hacia cada IP del Servidor", fontsize=11, fontweight="bold", pad=10)
            ax.set_xticks(x)
            ax.set_xticklabels(sondas, rotation=45, ha="right", fontsize=7.5)
            ax.set_ylabel("Latencia RTT Mediana (ms)", fontsize=9.5)
            max_y = max(max(float(r.get(c, 0) or 0) for c in cols) for r in rows) if rows else 120
            ax.set_ylim(0, max_y * 1.20)
            ax.grid(True, linestyle="--", alpha=0.45, axis="y")
            ax.legend(title="IP Destino", fontsize=8, loc="upper right")
            plt.tight_layout()

        # Figura 21: Comparativa de Latencias entre IPs
        elif eid == "21" or (kind == "bar" and "IP destino" in rows[0]):
            fig, ax = plt.subplots(figsize=(6.0, 3.5), dpi=180)
            ips = [str(r.get("IP destino", "")) for r in rows]
            meds = [float(r.get("RTT mediano", 0)) for r in rows]
            avgs = [float(r.get("RTT promedio", 0)) for r in rows]
            indices = np.arange(len(ips))
            width = 0.35
            b1 = ax.bar(indices - width / 2, meds, width, label="RTT Mediano (ms)", color="#3b82f6")
            b2 = ax.bar(indices + width / 2, avgs, width, label="RTT Promedio (ms)", color="#f59e0b")
            ax.set_title("Figura 21: Comparativa de Latencias entre Ambas IPs del Servidor", fontsize=10.5, fontweight="bold", pad=10)
            ax.set_xticks(indices)
            ax.set_xticklabels(ips, fontsize=9)
            ax.set_ylabel("Latencia RTT (ms)", fontsize=9.5)
            max_v = max(meds + avgs) if (meds + avgs) else 100
            ax.set_ylim(0, max_v * 1.20)
            ax.grid(True, linestyle="--", alpha=0.45, axis="y")
            ax.legend(fontsize=8.5)
            for b in list(b1) + list(b2):
                h = b.get_height()
                ax.text(b.get_x() + b.get_width() / 2, h + 0.5, f"{h:.1f}", ha="center", fontsize=8)
            plt.tight_layout()

        # Figura 22: RTT por Hop por Proveedor (Path Inflation)
        elif eid == "22" or (kind == "line" and "hop" in rows[0]):
            fig, ax = plt.subplots(figsize=(7.5, 4.2), dpi=180)
            hops = [r["hop"] for r in rows]
            cols = [c for c in rows[0].keys() if c != "hop"]
            for idx, col in enumerate(cols):
                color = ISP_COLORS.get(col, FALLBACK_COLORS[idx % len(FALLBACK_COLORS)])
                vals = [r.get(col) for r in rows]
                ax.plot(hops, vals, marker="o", markersize=3.5, label=col, color=color, linewidth=1.8)
            ax.axhline(20, color="#64748b", linestyle="--", linewidth=1.2, alpha=0.7, label="Umbral 20 ms")
            ax.set_title("Figura 22: RTT por Hop por Proveedor (Path Inflation)", fontsize=11, fontweight="bold", pad=10)
            ax.set_xlabel("Número de Salto (Hop)", fontsize=9.5)
            ax.set_ylabel("RTT Acumulado (ms)", fontsize=9.5)
            ax.grid(True, linestyle="--", alpha=0.45)
            ax.legend(bbox_to_anchor=(1.02, 1), loc="upper left", fontsize=8, framealpha=0.9)
            plt.tight_layout()

        # Figura 23: Overhead de Path Inflation por Proveedor
        elif eid == "23" or kind == "horizontalBar":
            sorted_rows = sorted(rows, key=lambda r: float(r.get("Overhead Path Inflation (ms)", 0)))
            fig, ax = plt.subplots(figsize=(7.5, 3.8), dpi=180)
            isps = [r.get("ISP", "") for r in sorted_rows]
            overheads = [float(r.get("Overhead Path Inflation (ms)", 0)) for r in sorted_rows]
            bar_colors = ["#10b981" if v < 20 else "#f59e0b" if v < 40 else "#ef4444" for v in overheads]
            bars = ax.barh(isps, overheads, color=bar_colors, height=0.55, edgecolor="#000000", linewidth=0.5)
            ax.set_title("Figura 23: Overhead de Path Inflation por Proveedor (ms)", fontsize=11, fontweight="bold", pad=10)
            ax.set_xlabel("Overhead Adicional respecto a Línea Base (ms)", fontsize=9.5)
            ax.grid(True, linestyle="--", alpha=0.45, axis="x")
            max_v = max(overheads) if overheads else 60
            ax.set_xlim(0, max_v * 1.20)
            for b in bars:
                w = b.get_width()
                ax.text(w + 1.0, b.get_y() + b.get_height() / 2, f"+{w:.1f} ms", va="center", fontsize=8.5, fontweight="bold")
            plt.tight_layout()

        # Figura 24: RTT Mediano por Hora del Día por Proveedor
        elif eid == "24" or (kind == "line" and "hour" in rows[0]):
            fig, ax = plt.subplots(figsize=(7.5, 4.2), dpi=180)
            hours = [r.get("hour", "") for r in rows]
            cols = [c for c in rows[0].keys() if c != "hour"]
            for idx, col in enumerate(cols):
                color = ISP_COLORS.get(col, FALLBACK_COLORS[idx % len(FALLBACK_COLORS)])
                vals = [r.get(col) for r in rows]
                ax.plot(hours, vals, marker=".", markersize=4, label=col, color=color, linewidth=1.6)
            ax.set_title("Figura 24: RTT Mediano por Hora del Día por Proveedor", fontsize=11, fontweight="bold", pad=10)
            ax.set_xlabel("Hora del Día (América/El Salvador)", fontsize=9.5)
            ax.set_ylabel("RTT Mediano (ms)", fontsize=9.5)
            ax.set_xticks(range(0, len(hours), 2))
            ax.set_xticklabels([hours[i] for i in range(0, len(hours), 2)], rotation=30, ha="right", fontsize=8)
            ax.grid(True, linestyle="--", alpha=0.45)
            ax.legend(bbox_to_anchor=(1.02, 1), loc="upper left", fontsize=8, framealpha=0.9)
            plt.tight_layout()

        # Figura 25: Evolución Diaria del RTT al Destino
        elif eid == "25" or kind == "dailyBarLine":
            fig, ax = plt.subplots(figsize=(7.5, 3.8), dpi=180)
            dates = [r.get("Fecha", r.get("date", "")).replace("\n", " ") for r in rows]
            rtt_median = [float(r.get("RTT mediano diario", 0)) for r in rows]
            rtt_avg = [float(r.get("Promedio RTT", 0)) for r in rows]
            x_pos = list(range(len(dates)))
            bars = ax.bar(x_pos, rtt_median, color="#3b82f6", width=0.45, alpha=0.85, label="Mediana Diaria", edgecolor="#1d4ed8")
            ax.plot(x_pos, rtt_avg, color="#f59e0b", marker="o", linewidth=2.2, label="Promedio RTT")
            ax.set_title("Figura 25: Evolución Diaria del RTT al Destino (Todos los ISPs)", fontsize=11, fontweight="bold", pad=10)
            ax.set_xticks(x_pos)
            ax.set_xticklabels(dates, rotation=20, ha="right", fontsize=8.5)
            ax.set_ylabel("RTT (ms)", fontsize=9.5)
            max_v = max(rtt_median + rtt_avg) if (rtt_median + rtt_avg) else 100
            ax.set_ylim(0, max_v * 1.22)
            ax.grid(True, linestyle="--", alpha=0.45, axis="y")
            ax.legend(loc="upper right", fontsize=8.5)
            for b in bars:
                h = b.get_height()
                ax.text(b.get_x() + b.get_width() / 2, h + 1.5, f"{h:.1f}", ha="center", fontsize=8, fontweight="bold")
            plt.tight_layout()

        # Figura 26: Boxplot de Jitter por Proveedor
        elif eid == "26" or kind == "boxplot":
            fig, ax = plt.subplots(figsize=(7.5, 4.2), dpi=180)
            bp_data = []
            labels = []
            for r in rows:
                labels.append(r.get("isp", ""))
                bp_data.append({
                    "med": float(r.get("median", 0)),
                    "q1": float(r.get("q1", 0)),
                    "q3": float(r.get("q3", 0)),
                    "whislo": float(r.get("min", 0)),
                    "whishi": float(r.get("max", 0)),
                    "fliers": [float(x) for x in r.get("outliers", [])[:30]]
                })
            ax.bxp(bp_data, showfliers=True)
            ax.set_title("Figura 26: Distribución de Jitter por Proveedor (Boxplot)", fontsize=11, fontweight="bold", pad=10)
            ax.set_xticks(range(1, len(labels) + 1))
            ax.set_xticklabels(labels, rotation=25, ha="right", fontsize=8.5)
            ax.set_ylabel("Jitter (ms)", fontsize=9.5)
            ax.grid(True, linestyle="--", alpha=0.45, axis="y")
            plt.tight_layout()

        if fig:
            buf = io.BytesIO()
            fig.savefig(buf, format="png", dpi=180, bbox_inches="tight")
            plt.close(fig)
            buf.seek(0)
            return buf
    except Exception as e:
        print(f"Error generating chart for element {eid}: {e}")
        if fig:
            plt.close(fig)

    return None


def generate_thesis_docx(inv: Any, template: Dict[str, Any], phase_data: Dict[int, Dict[str, Any]]) -> io.BytesIO:
    """
    Generates a formal, publication-ready Microsoft Word (.docx) document
    representing the complete academic research investigation with all 26 figures
    and 6 tables.
    """
    doc = Document()

    # 1. Page Setup: Letter, 1-inch margins
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11.0)
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)

    # 2. PORTADA INSTITUCIONAL FORMAL (PÁGINA 1)
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(36)
    p_inst.paragraph_format.space_after = Pt(4)
    run = p_inst.add_run("UNIVERSIDAD FRANCISCO GAVIDIA\n")
    run.bold = True
    run.font.name = "Calibri"
    run.font.size = Pt(14)
    run.font.color.rgb = RGBColor(0, 0, 0)

    run = p_inst.add_run("FACULTAD DE INGENIERÍA Y SISTEMAS\n")
    run.bold = True
    run.font.name = "Calibri"
    run.font.size = Pt(11)
    run.font.color.rgb = RGBColor(51, 65, 85)

    run = p_inst.add_run("ESCUELA DE CIENCIAS DE LA COMPUTACIÓN")
    run.font.name = "Calibri"
    run.font.size = Pt(10)
    run.font.color.rgb = RGBColor(71, 85, 105)

    # Separador
    p_sep = doc.add_paragraph()
    p_sep.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sep.paragraph_format.space_before = Pt(12)
    p_sep.paragraph_format.space_after = Pt(36)
    run = p_sep.add_run("—" * 28)
    run.font.color.rgb = RGBColor(148, 163, 184)

    # Título Principal
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(18)
    p_title.paragraph_format.space_after = Pt(12)
    p_title.paragraph_format.line_spacing = 1.2
    run = p_title.add_run("ANÁLISIS DE PATH INFLATION EN LA INFRAESTRUCTURA DE CONECTIVIDAD HACIA EL AULA VIRTUAL DE LA UFG")
    run.bold = True
    run.font.name = "Calibri"
    run.font.size = Pt(18)
    run.font.color.rgb = RGBColor(0, 0, 0)

    # Subtítulo
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(4)
    p_sub.paragraph_format.space_after = Pt(48)
    run = p_sub.add_run("Evaluación empírica y correlación de latencia mediante mediciones distribuidas sobre la plataforma RIPE Atlas hacia webdesktop.ufg.edu.sv")
    run.italic = True
    run.font.name = "Calibri"
    run.font.size = Pt(11)
    run.font.color.rgb = RGBColor(71, 85, 105)

    # Bloque de Autores y Metadatos
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_before = Pt(36)
    p_meta.paragraph_format.space_after = Pt(2)
    run = p_meta.add_run("INVESTIGADORES:\n")
    run.bold = True
    run.font.name = "Calibri"
    run.font.size = Pt(10)
    run.font.color.rgb = RGBColor(0, 0, 0)

    run = p_meta.add_run("Edwin Herrera  ·  Heber Landaverde  ·  Wilbert Vásquez\n\n")
    run.font.name = "Calibri"
    run.font.size = Pt(11)
    run.font.color.rgb = RGBColor(30, 41, 59)

    created_str = (
        inv.created_at.strftime("%d de %B de %Y")
        if isinstance(getattr(inv, "created_at", None), datetime)
        else "2026"
    )
    inv_name = getattr(inv, "name", "Investigación Académica")
    inv_id = getattr(inv, "id", "")

    run = p_meta.add_run(f"Plataforma de procesamiento: NetScope / RIPE Atlas\n")
    run.font.size = Pt(9.5)
    run.font.color.rgb = RGBColor(100, 116, 139)
    run = p_meta.add_run(f"Registro de Investigación: {inv_name} (ID: {inv_id})\n")
    run.font.size = Pt(9.5)
    run.font.color.rgb = RGBColor(100, 116, 139)
    run = p_meta.add_run(f"Fecha: {created_str}\n\n")
    run.font.size = Pt(9.5)
    run.font.color.rgb = RGBColor(100, 116, 139)
    run = p_meta.add_run("San Salvador, El Salvador, Centroamérica")
    run.bold = True
    run.font.size = Pt(10)
    run.font.color.rgb = RGBColor(15, 23, 42)

    doc.add_page_break()

    # Helper para encabezados de capítulo
    def add_chapter_header(chap_num: int, chap_title: str, chap_desc: str = "") -> None:
        p_ch = doc.add_paragraph()
        p_ch.paragraph_format.space_before = Pt(16)
        p_ch.paragraph_format.space_after = Pt(4)
        p_ch.paragraph_format.keep_with_next = True
        run = p_ch.add_run(f"{chap_num}. {chap_title}")
        run.bold = True
        run.font.name = "Calibri"
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor(0, 0, 0)

        # Regla horizontal de separación
        p_rule = doc.add_paragraph()
        p_rule.paragraph_format.space_before = Pt(0)
        p_rule.paragraph_format.space_after = Pt(8)
        p_rule.paragraph_format.keep_with_next = True
        run_rule = p_rule.add_run("—" * 46)
        run_rule.font.color.rgb = RGBColor(15, 23, 42)

        if chap_desc:
            p_desc = doc.add_paragraph()
            p_desc.paragraph_format.space_before = Pt(0)
            p_desc.paragraph_format.space_after = Pt(10)
            run_desc = p_desc.add_run(chap_desc)
            run_desc.italic = True
            run_desc.font.name = "Calibri"
            run_desc.font.size = Pt(10)
            run_desc.font.color.rgb = RGBColor(71, 85, 105)

    chapters_dict = {c.get("chapter"): c for c in template.get("chapters", [])}

    # 3. CAPÍTULOS TEÓRICOS (1, 2, 3)
    for chap_num in [1, 2, 3]:
        chap = chapters_dict.get(chap_num)
        if not chap:
            continue
        add_chapter_header(chap_num, chap.get("title", ""), chap.get("description", ""))
        for el in chap.get("elements", []):
            title = el.get("title", "")
            desc = el.get("description") or el.get("content") or ""
            if title:
                p_sec = doc.add_paragraph()
                p_sec.paragraph_format.space_before = Pt(10)
                p_sec.paragraph_format.space_after = Pt(3)
                p_sec.paragraph_format.keep_with_next = True
                run_sec = p_sec.add_run(title)
                run_sec.bold = True
                run_sec.font.name = "Calibri"
                run_sec.font.size = Pt(12)
                run_sec.font.color.rgb = RGBColor(30, 41, 59)
            if desc:
                add_justified_paragraph(doc, desc)

        doc.add_page_break()

    # 4. CAPÍTULO 4. RESULTADOS (FASES 1 A 5)
    add_chapter_header(
        4,
        "Resultados",
        "Hallazgos obtenidos a lo largo de las 5 fases de investigación empírica sobre la infraestructura evaluada hacia webdesktop.ufg.edu.sv.",
    )

    phase_titles = {
        1: "4.1 Fase 1 — Integridad de la Red y Análisis de Disponibilidad",
        2: "4.2 Fase 2 — Establecimiento de la Línea Base de Eficiencia",
        3: "4.3 Fase 3 — Mapeo de Proveedores e Identificación de ASNs",
        4: "4.4 Fase 4 — Demostración del Path Inflation",
        5: "4.5 Fase 5 — Estabilidad Temporal: Horas Pico y Jitter",
    }

    for phase_num in [1, 2, 3, 4, 5]:
        p_phase = doc.add_paragraph()
        p_phase.paragraph_format.space_before = Pt(14)
        p_phase.paragraph_format.space_after = Pt(4)
        p_phase.paragraph_format.keep_with_next = True
        run_ph = p_phase.add_run(phase_titles[phase_num])
        run_ph.bold = True
        run_ph.font.name = "Calibri"
        run_ph.font.size = Pt(13)
        run_ph.font.color.rgb = RGBColor(30, 41, 59)

        p_line = doc.add_paragraph()
        p_line.paragraph_format.space_before = Pt(0)
        p_line.paragraph_format.space_after = Pt(8)
        p_line.paragraph_format.keep_with_next = True
        run_l = p_line.add_run("—" * 38)
        run_l.font.color.rgb = RGBColor(148, 163, 184)

        p_data = phase_data.get(phase_num, {})
        elements = p_data.get("elements", [])

        if not elements:
            p_empty = doc.add_paragraph()
            p_empty.paragraph_format.space_before = Pt(4)
            p_empty.paragraph_format.space_after = Pt(12)
            run_e = p_empty.add_run("Esta subsección aún no cuenta con resultados ejecutados en esta investigación.")
            run_e.italic = True
            run_e.font.size = Pt(10)
            run_e.font.color.rgb = RGBColor(100, 116, 139)
            continue

        for el in elements:
            el_type = el.get("type")
            el_id = str(el.get("id", ""))
            el_title = el.get("title", "")
            caption = el.get("caption") or f"{el_title}."
            source = el.get("source") or "elaboración propia con datos procesados por NetScope desde RIPE Atlas"
            full_caption = f"{caption} Fuente: {source}."

            # Encabezado formal numerado para cada elemento (Figura X o Tabla X)
            if el_type == "DATA_TABLE":
                prefix = f"Tabla {el_id}."
            else:
                prefix = f"Figura {el_id}."

            p_item = doc.add_paragraph()
            p_item.paragraph_format.space_before = Pt(12)
            p_item.paragraph_format.space_after = Pt(3)
            p_item.paragraph_format.keep_with_next = True
            run_item = p_item.add_run(f"{prefix} {el_title}.")
            run_item.bold = True
            run_item.font.name = "Calibri"
            run_item.font.size = Pt(11)
            run_item.font.color.rgb = RGBColor(0, 0, 0)

            # Caso A: Bloque de interpretación (ej. Figura 9 y Figura 11)
            if el_type == "INTERPRETATION_BLOCK":
                desc = el.get("description") or el.get("content") or ""
                if desc:
                    add_justified_paragraph(doc, desc)
                add_caption_paragraph(doc, full_caption)

            # Caso B: Tabla formal de datos (Tablas 1 a 6)
            elif el_type == "DATA_TABLE":
                columns = el.get("columns", [])
                rows = el.get("rows", [])
                build_academic_table(doc, columns, rows, full_caption)

            # Caso C: Figura / Gráfico (Figuras 1 a 26)
            else:
                # 1. Intentar renderizar gráfico científico académico de alta resolución
                img_buf = generate_chart_image(el)

                # 2. Si no es un gráfico generado en memoria, verificar si existe imagen en disco
                if not img_buf:
                    img_path = resolve_image_path(el.get("url"))
                    if img_path:
                        try:
                            with open(img_path, "rb") as f:
                                img_buf = io.BytesIO(f.read())
                        except Exception as e:
                            print(f"Error reading picture {img_path}: {e}")

                # Si se obtuvo una imagen (dibujada o en disco), incrustarla centrada en el documento
                if img_buf:
                    try:
                        p_img = doc.add_paragraph()
                        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
                        p_img.paragraph_format.space_before = Pt(4)
                        p_img.paragraph_format.space_after = Pt(4)
                        p_img.add_run().add_picture(img_buf, width=Inches(5.8))
                    except Exception as e:
                        print(f"Error adding picture to docx: {e}")
                    add_caption_paragraph(doc, full_caption)
                else:
                    # Si es una figura presentada en forma de tabla analítica (ej. Figuras 1, 3, 4, 5, 7, 8, 10, 14, 15, 16, 17, 18, 20)
                    columns = el.get("columns", [])
                    rows = el.get("rows", [])
                    if rows:
                        build_academic_table(doc, columns, rows, full_caption)
                    else:
                        add_caption_paragraph(doc, full_caption)

    doc.add_page_break()

    # 5. CAPÍTULOS CONCLUSIVOS (5, 6, 7)
    for chap_num in [5, 6, 7]:
        chap = chapters_dict.get(chap_num)
        if not chap:
            continue
        add_chapter_header(chap_num, chap.get("title", ""), chap.get("description", ""))
        for el in chap.get("elements", []):
            title = el.get("title", "")
            desc = el.get("description") or el.get("content") or ""
            if title:
                p_sec = doc.add_paragraph()
                p_sec.paragraph_format.space_before = Pt(10)
                p_sec.paragraph_format.space_after = Pt(3)
                p_sec.paragraph_format.keep_with_next = True
                run_sec = p_sec.add_run(title)
                run_sec.bold = True
                run_sec.font.name = "Calibri"
                run_sec.font.size = Pt(12)
                run_sec.font.color.rgb = RGBColor(30, 41, 59)
            if desc:
                add_justified_paragraph(doc, desc)

        if chap_num != 7:
            doc.add_page_break()

    # Guardar en memoria BytesIO
    target_stream = io.BytesIO()
    doc.save(target_stream)
    target_stream.seek(0)
    return target_stream
