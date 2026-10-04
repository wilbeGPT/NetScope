import ipaddress
import math
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import pandas as pd

from services.network_identity import add_identity_columns
from services.r_bridge import run_r_script_fase1

LOCAL_TZ = ZoneInfo("America/El_Salvador")
MEASUREMENT_KEYS = ["msm_id", "prb_id", "timestamp", "dst_addr", "dst_name"]


def _format_timestamp(value: object, local: bool = True) -> str:
    try:
        ts = pd.to_numeric(value, errors="coerce")
        if pd.isna(ts):
            return "N/D"
        tz = LOCAL_TZ if local else timezone.utc
        suffix = "CST" if local else "UTC"
        return datetime.fromtimestamp(float(ts), tz=timezone.utc).astimezone(tz).strftime(f"%Y-%m-%d %H:%M:%S {suffix}")
    except Exception:
        return "N/D"


def _percent(part: int | float, total: int | float) -> float:
    return round((float(part) / float(total)) * 100, 2) if total else 0.0


def _is_public(addr: object) -> bool:
    if pd.isna(addr) or not str(addr).strip():
        return False
    try:
        return not ipaddress.ip_address(str(addr).strip()).is_private
    except ValueError:
        return True


def _safe_measurements(df: pd.DataFrame) -> pd.DataFrame:
    keys = [key for key in MEASUREMENT_KEYS if key in df.columns]
    return df.drop_duplicates(subset=keys).copy() if keys else df.copy()


def _infer_interval_seconds(measurements: pd.DataFrame) -> float | None:
    if measurements.empty or not {"timestamp", "prb_id"}.issubset(measurements.columns):
        return None
    intervals: list[float] = []
    for _, group in measurements.dropna(subset=["timestamp"]).groupby("prb_id"):
        ts = pd.to_numeric(group["timestamp"], errors="coerce").dropna().sort_values()
        diffs = ts.diff().dropna()
        intervals.extend(diffs[diffs > 0].tolist())
    if not intervals:
        return None
    interval = float(pd.Series(intervals).median())
    return interval if interval > 0 else None


def _infer_expected_per_probe(measurements: pd.DataFrame) -> tuple[int, str, float | None]:
    if measurements.empty or "prb_id" not in measurements.columns:
        return 0, "No hay mediciones suficientes para inferir el volumen esperado.", None
    counts = measurements.groupby("prb_id").size()
    fallback = int(counts.max()) if not counts.empty else 0
    interval = _infer_interval_seconds(measurements)
    if interval and "timestamp" in measurements.columns:
        ts = pd.to_numeric(measurements["timestamp"], errors="coerce").dropna()
        if len(ts) >= 2:
            expected = int(math.floor(float(ts.max() - ts.min()) / interval) + 1)
            minutes = round(interval / 60, 2)
            return max(expected, fallback), f"Inferido por ventana temporal global e intervalo mediano observado ({minutes} min).", interval
    return fallback, "Inferido por la sonda con mayor cantidad de mediciones observadas.", interval


def _destination_reached_measurements(work: pd.DataFrame, measurements: pd.DataFrame) -> pd.DataFrame:
    if work.empty or "hop" not in work.columns:
        return pd.DataFrame(columns=measurements.columns)
    last_hops = work.dropna(subset=["hop"]).copy()
    if last_hops.empty:
        return pd.DataFrame(columns=measurements.columns)
    last_hops["hop"] = pd.to_numeric(last_hops["hop"], errors="coerce")
    keys = [key for key in MEASUREMENT_KEYS if key in last_hops.columns]
    max_hop = last_hops.groupby(keys, dropna=False)["hop"].transform("max") if keys else last_hops["hop"].max()
    final_rows = last_hops[last_hops["hop"] == max_hop]
    reached = final_rows[(~final_rows["is_timeout"].fillna(False).astype(bool)) & final_rows["rtt"].notna()]
    return reached.drop_duplicates(subset=keys).copy() if keys else reached.copy()


def _final_hop_packet_rows(work: pd.DataFrame) -> pd.DataFrame:
    if work.empty or "hop" not in work.columns:
        return pd.DataFrame(columns=work.columns)
    public_work = work[work["dst_addr"].apply(_is_public)].copy() if "dst_addr" in work.columns else work.copy()
    public_work = public_work.dropna(subset=["hop"])
    if public_work.empty:
        return pd.DataFrame(columns=work.columns)
    public_work["hop"] = pd.to_numeric(public_work["hop"], errors="coerce")
    keys = [key for key in MEASUREMENT_KEYS if key in public_work.columns]
    max_hop = public_work.groupby(keys, dropna=False)["hop"].transform("max") if keys else public_work["hop"].max()
    return public_work[public_work["hop"] == max_hop].copy()


def _build_availability_blocks(measurements: pd.DataFrame, expected_per_probe: int, interval_seconds: float | None) -> tuple[pd.DataFrame, str | None, list[dict]]:
    if measurements.empty or not {"prb_id", "timestamp"}.issubset(measurements.columns):
        return pd.DataFrame(), None, []
    counts = measurements.groupby("prb_id").size().sort_values()
    if counts.empty:
        return pd.DataFrame(), None, []
    target_probe = str(counts.index[0])
    probe_measurements = measurements[measurements["prb_id"].astype(str) == target_probe].dropna(subset=["timestamp"]).sort_values("timestamp")
    timestamps = pd.to_numeric(probe_measurements["timestamp"], errors="coerce").dropna().tolist()
    if len(timestamps) < 2:
        return pd.DataFrame(), target_probe, []
    threshold = max((interval_seconds or 0) * 2, 30 * 60)
    blocks: list[dict] = []
    gaps: list[dict] = []
    active_start = timestamps[0]
    for previous, current in zip(timestamps, timestamps[1:]):
        gap_seconds = current - previous
        if gap_seconds > threshold:
            blocks.append({"status": "Activa", "start_time": active_start, "end_time": previous, "label": "", "probe_id": target_probe})
            gap_hours = round(gap_seconds / 3600, 2)
            blocks.append({"status": "Apagada", "start_time": previous, "end_time": current, "label": f"Caida:\n{gap_hours:.1f} hrs" if gap_hours > 2 else "", "probe_id": target_probe})
            gaps.append({"Inicio del hueco CST": _format_timestamp(previous), "Fin del hueco CST": _format_timestamp(current), "Duracion": f"{gap_hours:.2f} h"})
            active_start = current
    blocks.append({"status": "Activa", "start_time": active_start, "end_time": timestamps[-1], "label": "", "probe_id": target_probe})
    return pd.DataFrame(blocks), target_probe, gaps


def execute(df: pd.DataFrame, inv_id: int) -> dict:
    if df.empty:
        base = run_r_script_fase1(pd.DataFrame(columns=["prb_id", "dst_addr", "total_packets", "successful_packets", "timeouts"]), pd.DataFrame(), inv_id)
        base.update({"metricas_resumen": {"total_intentos": 0, "mediciones_reales": 0, "dns_exitoso": 0, "ruta_completa": 0, "disponibilidad_pct": 0.0}, "report_tables": [], "report_figures": []})
        return base

    df = add_identity_columns(df)
    work = df.copy()
    work["is_timeout"] = work.get("is_timeout", False).fillna(False).astype(bool)
    work["rtt"] = pd.to_numeric(work.get("rtt"), errors="coerce")

    measurements = _safe_measurements(work)
    successful_measurements = _destination_reached_measurements(work, measurements)
    expected_per_probe, expected_note, interval_seconds = _infer_expected_per_probe(measurements)
    total_probes = int(measurements["prb_id"].nunique()) if "prb_id" in measurements.columns else 0
    total_theoretical = total_probes * expected_per_probe
    total_real = int(len(measurements))
    total_lost = max(0, total_theoretical - total_real)

    fig1_rows: list[dict] = []
    group_cols = [col for col in ["dst_addr", "prb_id"] if col in measurements.columns]
    if group_cols:
        fig1_total = measurements.groupby(group_cols, dropna=False).size().reset_index(name="Total_Measurements")
        fig1_succ = successful_measurements.groupby(group_cols, dropna=False).size().reset_index(name="Successful_Reaches") if not successful_measurements.empty else pd.DataFrame(columns=group_cols + ["Successful_Reaches"])
        fig1_group = pd.merge(fig1_total, fig1_succ, on=group_cols, how="left").fillna(0).sort_values(by=group_cols)
        for i, (_, row) in enumerate(fig1_group.iterrows()):
            total = int(row["Total_Measurements"])
            succ = int(row["Successful_Reaches"])
            fig1_rows.append({"": str(i), "Dest_IP": "Sin destino resuelto" if pd.isna(row.get("dst_addr")) else str(row.get("dst_addr", "N/D")), "Probe_ID": str(row.get("prb_id", "N/D")), "Total_Measurements": total, "Successful_Reaches": succ, "Success_Rate_%": f"{_percent(succ, total)} %"})
    total_meas = sum(int(r["Total_Measurements"]) for r in fig1_rows)
    total_succ = sum(int(r["Successful_Reaches"]) for r in fig1_rows)
    fig1_rows.append({"": str(len(fig1_rows)), "Dest_IP": "TOTAL", "Probe_ID": "-", "Total_Measurements": total_meas, "Successful_Reaches": total_succ, "Success_Rate_%": f"{_percent(total_succ, total_meas)} %"})

    fig2_rows: list[dict] = []
    fig2_ips: list[str] = []
    if {"prb_id", "dst_addr"}.issubset(work.columns):
        chart_source = measurements.copy()
        chart_source["dst_addr"] = chart_source["dst_addr"].fillna("Sin destino resuelto").astype(str)
        fig2_group = chart_source.groupby(["prb_id", "dst_addr"], dropna=False).size().unstack(fill_value=0).reset_index()
        fig2_ips = [str(c) for c in fig2_group.columns if c != "prb_id"]
        for _, row in fig2_group.iterrows():
            item = {"categoria": str(row["prb_id"])}
            for ip in fig2_ips:
                item[ip] = int(row[ip])
            fig2_rows.append(item)

    fig3_rows = [
        {"Estado de Medicion": "Registradas exitosamente en el JSON", "Cantidad": total_real, "Proporcion": f"{_percent(total_real, total_theoretical)} %"},
        {"Estado de Medicion": "No registradas respecto al volumen esperado", "Cantidad": total_lost, "Proporcion": f"{_percent(total_lost, total_theoretical)} %"},
        {"Estado de Medicion": "Total esperado inferido", "Cantidad": total_theoretical, "Proporcion": "100.00 %"},
    ]

    dns_failures = measurements[measurements["dst_addr"].isna() | (measurements["dst_addr"].astype(str).str.strip() == "")].copy() if "dst_addr" in measurements.columns else pd.DataFrame()
    fig4_rows = []
    for i, (_, row) in enumerate(dns_failures.iterrows()):
        fig4_rows.append({"": str(i), "ID de Sonda": str(row.get("prb_id", "N/D")), "Fecha y Hora (CST)": _format_timestamp(row.get("timestamp")), "Dominio Objetivo": str(row.get("dst_name", "N/D")), "IP Resuelta": "None"})

    fig5_rows = []
    if "prb_id" in measurements.columns:
        for i, (prb_id, group) in enumerate(measurements.groupby("prb_id", dropna=False)):
            group = group.sort_values("timestamp") if "timestamp" in group.columns else group
            first_ts = group["timestamp"].min() if "timestamp" in group.columns else None
            last_ts = group["timestamp"].max() if "timestamp" in group.columns else None
            total = int(len(group))
            duration = str(pd.Timedelta(seconds=float(last_ts - first_ts))).split(".")[0] if pd.notna(first_ts) and pd.notna(last_ts) else "N/D"
            fig5_rows.append({"": str(i), "Probe_ID": str(prb_id), "Primera_Conexion": _format_timestamp(first_ts), "Ultima_Conexion": _format_timestamp(last_ts), "Total_Mediciones": total, "Tiempo_Activo": duration, "Mediciones_Perdidas": max(0, expected_per_probe - total), "Disponibilidad (Uptime)": f"{_percent(total, expected_per_probe)} %" if expected_per_probe else "N/D"})
        fig5_rows = sorted(fig5_rows, key=lambda row: int(row["Total_Mediciones"]), reverse=True)

    blocks_df, blackout_probe, gaps_rows = _build_availability_blocks(measurements, expected_per_probe, interval_seconds)

    final_packets = _final_hop_packet_rows(work)
    packet_probe_rows = []
    if not final_packets.empty and "prb_id" in final_packets.columns:
        packet_group = final_packets.groupby("prb_id", dropna=False).agg(Paquetes_Enviados_Al_Destino=("rtt", "size"), Recibidos=("rtt", lambda s: int(s.notna().sum()))).reset_index()
        for _, row in packet_group.sort_values("Paquetes_Enviados_Al_Destino", ascending=False).iterrows():
            sent = int(row["Paquetes_Enviados_Al_Destino"])
            received = int(row["Recibidos"])
            lost = sent - received
            packet_probe_rows.append({"ID Sonda": str(row["prb_id"]), "Paquetes_Enviados_Al_Destino": sent, "Recibidos": received, "Perdidos": lost, "Exito (%)": f"{_percent(received, sent)} %", "Perdida (%)": f"{_percent(lost, sent)} %"})
    sent_total = sum(int(r["Paquetes_Enviados_Al_Destino"]) for r in packet_probe_rows)
    recv_total = sum(int(r["Recibidos"]) for r in packet_probe_rows)
    lost_total = sum(int(r["Perdidos"]) for r in packet_probe_rows)
    if packet_probe_rows:
        packet_probe_rows.append({"ID Sonda": "TOTAL", "Paquetes_Enviados_Al_Destino": sent_total, "Recibidos": recv_total, "Perdidos": lost_total, "Exito (%)": f"{_percent(recv_total, sent_total)} %", "Perdida (%)": f"{_percent(lost_total, sent_total)} %"})

    pattern_counts: dict[str, int] = {"3 de 3 paquetes llegaron": 0, "2 de 3 paquetes llegaron": 0, "1 de 3 paquetes llego": 0, "0 de 3 paquetes llegaron": 0}
    if not final_packets.empty:
        keys = [key for key in MEASUREMENT_KEYS if key in final_packets.columns]
        for _, group in final_packets.groupby(keys, dropna=False):
            ok = int((group["rtt"].notna() & ~group["is_timeout"].fillna(False).astype(bool)).sum())
            total_attempts_group = int(len(group))
            label = f"{ok} de {total_attempts_group} paquetes llegaron"
            pattern_counts[label] = pattern_counts.get(label, 0) + 1
    discarded_control = pattern_counts.get("2 de 3 paquetes llegaron", 0) + (pattern_counts.get("1 de 3 paquetes llego", 0) * 2)
    fig8_text = "\n".join([
        "Auditoria de patrones de descarte en el salto final.",
        f"Mediciones sin descarte: {pattern_counts.get('3 de 3 paquetes llegaron', 0)}.",
        f"Descarte selectivo leve: {pattern_counts.get('2 de 3 paquetes llegaron', 0)}.",
        f"Descarte severo: {pattern_counts.get('1 de 3 paquetes llego', 0)}.",
        f"Perdida total de ruta: {pattern_counts.get('0 de 3 paquetes llegaron', 0)}.",
        f"Total de paquetes descartados por control parcial: {discarded_control}.",
    ])

    df_summary = pd.DataFrame([{"prb_id": row["ID Sonda"], "dst_addr": "publico", "total_packets": row["Paquetes_Enviados_Al_Destino"], "successful_packets": row["Recibidos"], "timeouts": row["Perdidos"]} for row in packet_probe_rows if row["ID Sonda"] != "TOTAL"])
    base = run_r_script_fase1(df_summary, blocks_df, inv_id)
    route_complete = int(len(successful_measurements))
    packet_availability_pct = _percent(recv_total, sent_total)
    route_availability_pct = _percent(route_complete, total_real)
    dns_success = int(total_real - len(dns_failures))

    base.update({
        "metricas_resumen": {
            "total_intentos": sent_total,
            "mediciones_reales": total_real,
            "dns_exitoso": dns_success,
            "ruta_completa": route_complete,
            "paquetes_exitosos": recv_total,
            "volumen_esperado": total_theoretical,
            "mediciones_no_registradas": total_lost,
            "sondas_detectadas": total_probes,
            "intervalo_estimado_seg": round(interval_seconds, 2) if interval_seconds else 0,
            "disponibilidad_paquetes_pct": packet_availability_pct,
            "disponibilidad_ruta_pct": route_availability_pct,
            "disponibilidad_pct": route_availability_pct,
        },
        "report_tables": [],
        "report_figures": [
            {"id": "1", "title": "Distribucion de mediciones por direccion IP de destino resuelta", "kind": "table", "columns": ["", "Dest_IP", "Probe_ID", "Total_Measurements", "Successful_Reaches", "Success_Rate_%"], "rows": fig1_rows},
            {"id": "2", "title": "Detalle de mediciones por categoria de destino", "kind": "bar", "categoryKey": "categoria", "dataKeys": fig2_ips, "rows": fig2_rows},
            {"id": "3", "title": "Calculo de embudo de datos: mediciones esperadas vs reales", "kind": "table", "columns": ["Estado de Medicion", "Cantidad", "Proporcion"], "rows": fig3_rows},
            {"id": "4", "title": "Detalle de fallas de DNS en sondas con destino no resuelto", "kind": "table", "columns": ["", "ID de Sonda", "Fecha y Hora (CST)", "Dominio Objetivo", "IP Resuelta"], "rows": fig4_rows},
            {"id": "5", "title": "Tabla analitica de desconexiones por sonda durante la semana de medicion", "kind": "table", "columns": ["", "Probe_ID", "Primera_Conexion", "Ultima_Conexion", "Total_Mediciones", "Tiempo_Activo", "Mediciones_Perdidas", "Disponibilidad (Uptime)"], "rows": fig5_rows},
            {"id": "6", "title": "Distribucion temporal de mediciones de las sondas que han tenido apagones", "type": "PNG", "url": base.get("grafica_png_url"), "caption": f"Distribucion temporal de mediciones de la sonda con menor disponibilidad ({blackout_probe or 'N/D'})."},
            {"id": "7", "title": "Distribucion de paquetes recibidos por medicion", "kind": "table", "columns": ["ID Sonda", "Paquetes_Enviados_Al_Destino", "Recibidos", "Perdidos", "Exito (%)", "Perdida (%)"], "rows": packet_probe_rows},
            {"id": "8", "title": "Resumen estadistico de perdida de paquetes a nivel granular", "kind": "text", "type": "INTERPRETATION_BLOCK", "description": fig8_text},
            {"id": "9", "title": "Sintesis de metricas de disponibilidad de la Fase 1", "kind": "text", "type": "INTERPRETATION_BLOCK", "description": "Omitida en el documento de referencia: corresponde a una grafica de la plataforma RIPE, por lo que no se genera como figura de la app."},
        ],
    })
    return base
