import ipaddress

import pandas as pd

from services.network_identity import add_identity_columns

TRACE_KEYS = ["msm_id", "prb_id", "timestamp", "dst_addr", "dst_name"]


def _is_private_ip(value: object) -> bool:
    try:
        if pd.isna(value) or not str(value).strip():
            return False
        ip = ipaddress.ip_address(str(value).strip())
        return ip.is_private or ip.is_loopback or ip.is_link_local
    except ValueError:
        return False


def _is_public_target(value: object) -> bool:
    if pd.isna(value) or not str(value).strip():
        return False
    return not _is_private_ip(value)


def _trace_keys_for(df: pd.DataFrame) -> list[str]:
    return [key for key in TRACE_KEYS if key in df.columns]


def _measurement_summary(df: pd.DataFrame) -> pd.DataFrame:
    work = df.copy()
    work["rtt"] = pd.to_numeric(work.get("rtt"), errors="coerce")
    work["hop"] = pd.to_numeric(work.get("hop"), errors="coerce")
    work["is_timeout"] = work.get("is_timeout", False).fillna(False).astype(bool)
    work = work[work["dst_addr"].apply(_is_public_target)] if "dst_addr" in work.columns else work
    keys = _trace_keys_for(work)
    rows: list[dict] = []

    if not keys or work.empty:
        return pd.DataFrame(rows)

    for trace_key, trace in work.groupby(keys, dropna=False):
        key_map = dict(zip(keys, trace_key if isinstance(trace_key, tuple) else (trace_key,)))
        hop_rows = trace.dropna(subset=["hop"])
        if hop_rows.empty:
            continue
        max_hop = hop_rows["hop"].max()
        final_rows = hop_rows[hop_rows["hop"] == max_hop]
        rtts = final_rows["rtt"].dropna()
        sent = int(len(final_rows))
        lost = int(final_rows["is_timeout"].sum() + final_rows["rtt"].isna().sum())
        if rtts.empty:
            continue
        rows.append({
            "prb_id": key_map.get("prb_id"),
            "dst_addr": key_map.get("dst_addr"),
            "timestamp": key_map.get("timestamp"),
            "avg_rtt": float(rtts.mean()),
            "min_rtt": float(rtts.min()),
            "max_rtt": float(rtts.max()),
            "hop_count": float(max_hop),
            "sent": sent,
            "lost": lost,
        })
    return pd.DataFrame(rows)


def _format_ms(value: object) -> str:
    try:
        if pd.isna(value):
            return "N/A"
        return f"{float(value):.2f} ms"
    except Exception:
        return "N/A"


def _format_pct(value: object) -> str:
    try:
        if pd.isna(value):
            return "N/A"
        return f"{float(value):.2f} %"
    except Exception:
        return "N/A"


def _build_probe_metrics(measurements: pd.DataFrame, identities: pd.DataFrame) -> pd.DataFrame:
    if measurements.empty:
        return pd.DataFrame()

    summary = measurements.groupby("prb_id", dropna=False).agg(
        Saltos_Promedio=("hop_count", "mean"),
        Min_RTT=("min_rtt", "min"),
        Mediana_RTT=("avg_rtt", "median"),
        Promedio_RTT=("avg_rtt", "mean"),
        Max_RTT=("max_rtt", "max"),
        Jitter_StdDev=("avg_rtt", "std"),
        Total_Paq=("sent", "sum"),
        Total_Perdidos=("lost", "sum"),
        Muestras=("avg_rtt", "count"),
    ).reset_index()
    summary["Jitter_StdDev"] = summary["Jitter_StdDev"].fillna(0.0)
    summary["Packet_Loss_%"] = summary.apply(lambda r: (float(r["Total_Perdidos"]) / float(r["Total_Paq"]) * 100) if r["Total_Paq"] else 0.0, axis=1)

    id_cols = ["prb_id", "identity_label", "identity_isp", "identity_asn"]
    available_id_cols = [c for c in id_cols if c in identities.columns]
    if available_id_cols:
        id_frame = identities[available_id_cols].drop_duplicates(subset=["prb_id"])
        summary = summary.merge(id_frame, on="prb_id", how="left")

    summary["Proveedor / ASN"] = summary.get("identity_label", summary["prb_id"].astype(str)).fillna(summary["prb_id"].astype(str))
    return summary


def _is_lan_probe(row: pd.Series, raw_df: pd.DataFrame) -> bool:
    label = str(row.get("Proveedor / ASN", ""))
    if "Red local" in label or "LAN" in label:
        return True
    probe_rows = raw_df[raw_df["prb_id"].astype(str) == str(row.get("prb_id"))]
    if probe_rows.empty or "dst_addr" not in probe_rows.columns:
        return False
    public_count = probe_rows["dst_addr"].apply(_is_public_target).sum()
    private_count = probe_rows["dst_addr"].apply(_is_private_ip).sum()
    return private_count > 0


def _rows_for_figure10(metrics: pd.DataFrame, raw_df: pd.DataFrame) -> tuple[list[dict], pd.DataFrame]:
    if metrics.empty:
        return [], metrics

    work = metrics.copy()
    work["es_lan"] = work.apply(lambda row: _is_lan_probe(row, raw_df), axis=1)
    lan = work[work["es_lan"]].sort_values("Mediana_RTT")
    wan = work[~work["es_lan"]].sort_values("Mediana_RTT")
    ordered = pd.concat([lan, wan], ignore_index=True)

    rows = []
    for _, row in ordered.iterrows():
        rows.append({
            "ID Sonda": str(row["prb_id"]),
            "Rol": "Control LAN" if bool(row.get("es_lan")) else "WAN externa",
            "Proveedor / ASN": str(row.get("Proveedor / ASN", "N/D")),
            "Saltos_Promedio": f"{float(row['Saltos_Promedio']):.1f}",
            "Min_RTT": _format_ms(row["Min_RTT"]),
            "Mediana_RTT": _format_ms(row["Mediana_RTT"]),
            "Promedio_RTT": _format_ms(row["Promedio_RTT"]),
            "Max_RTT": _format_ms(row["Max_RTT"]),
            "Jitter_StdDev": _format_ms(row["Jitter_StdDev"]),
            "Packet_Loss_%": _format_pct(row["Packet_Loss_%"]),
        })
    return rows, work


def _select_baseline(metrics: pd.DataFrame) -> pd.Series | None:
    if metrics.empty:
        return None
    external = metrics[~metrics["es_lan"]] if "es_lan" in metrics.columns else metrics
    if external.empty:
        external = metrics
    eligible = external[external["Packet_Loss_%"] < 1.0]
    ranked = eligible if not eligible.empty else external
    ranked = ranked.sort_values(["Mediana_RTT", "Jitter_StdDev", "Packet_Loss_%"], ascending=[True, True, True])
    return ranked.iloc[0] if not ranked.empty else None


def _baseline_diagnostics(raw_df: pd.DataFrame, baseline_probe: str) -> tuple[str, dict]:
    work = raw_df.copy()
    work["rtt"] = pd.to_numeric(work.get("rtt"), errors="coerce")
    work["hop"] = pd.to_numeric(work.get("hop"), errors="coerce")
    work = work[(work["prb_id"].astype(str) == baseline_probe) & work["dst_addr"].apply(_is_public_target)]
    keys = _trace_keys_for(work)

    saltos = []
    penultimate_ips: set[str] = set()
    hop1_rtts = []
    final_rtts = []

    if keys and not work.empty:
        for _, trace in work.groupby(keys, dropna=False):
            trace = trace.dropna(subset=["hop"])
            if trace.empty:
                continue
            max_hop = trace["hop"].max()
            saltos.append(float(max_hop))
            penultimate = trace[trace["hop"] == max_hop - 1]
            if "reply_from" in penultimate.columns:
                penultimate_ips.update(str(v) for v in penultimate["reply_from"].dropna().unique())
            hop1 = trace[trace["hop"] == trace["hop"].min()]["rtt"].dropna()
            final = trace[trace["hop"] == max_hop]["rtt"].dropna()
            if not hop1.empty:
                hop1_rtts.append(float(hop1.mean()))
            if not final.empty:
                final_rtts.append(float(final.mean()))

    min_hops = int(min(saltos)) if saltos else 0
    max_hops = int(max(saltos)) if saltos else 0
    local = float(pd.Series(hop1_rtts).median()) if hop1_rtts else 0.0
    total = float(pd.Series(final_rtts).median()) if final_rtts else 0.0
    transit = max(total - local, 0.0)
    conclusion = "Ruta estatica en el borde, no se detecta flapping." if len(penultimate_ips) <= 1 else "Balanceo de carga detectado en el borde."

    text = "\n".join([
        f"Rayos X de la linea base (sonda {baseline_probe}).",
        "Metricas topologicas:",
        f"- Minimo de saltos detectados: {min_hops}",
        f"- Maximo de saltos detectados: {max_hops}",
        f"- Routers perimetrales vistos: {len(penultimate_ips)} IP(s) distintas.",
        f"- Conclusion: {conclusion}",
        "",
        "Analisis micro-delta:",
        f"- Latencia local hacia el ISP (salto 1): {local:.2f} ms",
        f"- Latencia total hacia el destino final: {total:.2f} ms",
        f"- Tiempo estimado en transito externo: {transit:.2f} ms",
    ])
    return text, {"rtt_lan_mediano": round(local, 2), "rtt_total_mediano": round(total, 2), "micro_delta_mediano": round(transit, 2)}


def _latency_rows(metrics: pd.DataFrame, baseline_probe: str | None) -> list[dict]:
    if metrics.empty:
        return []
    rows = []
    ordered = metrics.sort_values("Mediana_RTT")
    for _, row in ordered.iterrows():
        probe = str(row["prb_id"])
        if bool(row.get("es_lan")):
            rol = "Control LAN"
        elif baseline_probe and probe == baseline_probe:
            rol = "Linea base WAN"
        else:
            rol = "WAN"
        rows.append({"ID Sonda": probe, "Mediana RTT": round(float(row["Mediana_RTT"]), 2), "Rol": rol})
    return rows


def _micro_delta_rows(raw_df: pd.DataFrame, baseline_probe: str | None) -> list[dict]:
    if not baseline_probe:
        return []
    text, metrics = _baseline_diagnostics(raw_df, baseline_probe)
    total = metrics.get("rtt_total_mediano", 0.0)
    local = metrics.get("rtt_lan_mediano", 0.0)
    transit = metrics.get("micro_delta_mediano", 0.0)
    return [
        {"Segmento": "Acceso local / salto 1", "RTT mediano": local},
        {"Segmento": "Transito externo estimado", "RTT mediano": transit},
        {"Segmento": "RTT total al destino", "RTT mediano": total},
    ]


def _packet_loss_rows(metrics: pd.DataFrame) -> list[dict]:
    if metrics.empty:
        return []
    ordered = metrics.sort_values("Mediana_RTT")
    rows = []
    for _, row in ordered.iterrows():
        rows.append({
            "ID Sonda": str(row["prb_id"]),
            "Perdida %": round(float(row["Packet_Loss_%"]), 2),
        })
    return rows


def execute(df: pd.DataFrame, inv_id: int) -> dict:
    if df.empty:
        return {"metricas_resumen": {}, "report_tables": [], "report_figures": []}

    raw = add_identity_columns(df.copy())
    raw["rtt"] = pd.to_numeric(raw.get("rtt"), errors="coerce")
    raw["hop"] = pd.to_numeric(raw.get("hop"), errors="coerce")
    measurements = _measurement_summary(raw)
    metrics = _build_probe_metrics(measurements, raw)
    fig10_rows, metrics_with_roles = _rows_for_figure10(metrics, raw)
    baseline = _select_baseline(metrics_with_roles)
    baseline_probe = str(baseline["prb_id"]) if baseline is not None else None
    fig11_text, diag_metrics = _baseline_diagnostics(raw, baseline_probe) if baseline_probe else ("No fue posible seleccionar una sonda base con los datos disponibles.", {})
    fig12_rows = _latency_rows(metrics_with_roles, baseline_probe)
    fig13_rows = _packet_loss_rows(metrics_with_roles)

    metricas = {
        "sonda_optima": baseline_probe or "N/D",
        "score_sonda_optima": round(float(baseline["Mediana_RTT"]), 2) if baseline is not None else 0.0,
        "rtt_minimo": round(float(metrics_with_roles["Min_RTT"].min()), 2) if not metrics_with_roles.empty else 0.0,
        "rtt_promedio": round(float(metrics_with_roles["Promedio_RTT"].mean()), 2) if not metrics_with_roles.empty else 0.0,
        **diag_metrics,
    }

    return {
        "metricas_resumen": metricas,
        "report_tables": [],
        "report_figures": [
            {
                "id": "10",
                "title": "Comparativa de metricas integrales por sonda para la seleccion de la linea base",
                "kind": "table",
                "columns": ["ID Sonda", "Rol", "Proveedor / ASN", "Saltos_Promedio", "Min_RTT", "Mediana_RTT", "Promedio_RTT", "Max_RTT", "Jitter_StdDev", "Packet_Loss_%"],
                "rows": fig10_rows,
            },
            {
                "id": "11",
                "title": f"Sonda {baseline_probe or 'N/D'} seleccionada como linea base de eficiencia",
                "kind": "text",
                "type": "INTERPRETATION_BLOCK",
                "description": fig11_text,
            },
            {
                "id": "12",
                "title": f"Distribucion de latencia de la sonda {baseline_probe or 'linea base'} y comparativa RTT",
                "kind": "bar",
                "dataKey": "Mediana RTT",
                "categoryKey": "ID Sonda",
                "rows": fig12_rows,
            },
            {
                "id": "13",
                "title": "Porcentaje de perdida de paquetes por sonda",
                "kind": "bar",
                "dataKey": "Perdida %",
                "categoryKey": "ID Sonda",
                "rows": fig13_rows,
            },
        ],
    }
