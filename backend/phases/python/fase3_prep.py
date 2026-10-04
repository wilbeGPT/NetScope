import ipaddress
from datetime import datetime, timezone
from typing import Any

import pandas as pd

from services.network_identity import resolve_probe_identities

TRACE_KEYS = ["msm_id", "prb_id", "timestamp", "dst_addr", "dst_name"]

def _probe_id(value: Any) -> str:
    if pd.isna(value):
        return "N/D"
    try:
        return str(int(float(str(value))))
    except (TypeError, ValueError):
        return str(value)


def _is_public_ip(value: object) -> bool:
    try:
        if pd.isna(value) or not str(value).strip():
            return False
        ip = ipaddress.ip_address(str(value).strip())
        return not (ip.is_private or ip.is_loopback or ip.is_link_local)
    except ValueError:
        return False


def _trace_keys(df: pd.DataFrame) -> list[str]:
    return [key for key in TRACE_KEYS if key in df.columns]


def _measurements(df: pd.DataFrame) -> pd.DataFrame:
    keys = _trace_keys(df)
    return df.drop_duplicates(subset=keys).copy() if keys else df.copy()


def _metadata_for_probe(probe: str, identities: dict[Any, dict[str, Any]]) -> dict[str, str]:
    identity = identities.get(int(probe), identities.get(probe, {})) if probe.isdigit() else {}
    isp = str(identity.get("isp") or identity.get("label") or f"Sonda {probe}")
    return {
        "ISP": isp,
        "Organizacion oficial RDAP": str(identity.get("as_name") or isp),
        "ASN": str(identity.get("asn") or "N/D"),
        "Pais Registro": str(identity.get("country") or identity.get("country_code") or "N/D"),
    }


def _probe_inventory(measurements: pd.DataFrame, identities: dict[Any, dict[str, Any]]) -> list[dict]:
    if measurements.empty or "prb_id" not in measurements.columns:
        return []
    rows = []
    for probe_raw, group in measurements.groupby("prb_id", dropna=False):
        probe = _probe_id(probe_raw)
        meta = _metadata_for_probe(probe, identities)
        ips = []
        for field in ("probe_ip", "from"):
            if field in group.columns:
                ips.extend(str(value) for value in group[field].dropna().unique() if str(value).strip())
        rows.append({
            "ID Sonda": probe,
            "IP Publica": ", ".join(dict.fromkeys(ips)) if ips else "N/D",
            "ISP / Proveedor": meta["ISP"],
            "Organizacion oficial RDAP": meta["Organizacion oficial RDAP"],
            "ASN": meta["ASN"],
            "Pais Registro": meta["Pais Registro"],
            "Mediciones": int(len(group)),
        })
    rows.sort(key=lambda row: (row["ISP / Proveedor"], row["ID Sonda"]))
    for index, row in enumerate(rows, start=1):
        row["N"] = index
    return rows


def _asn_distribution(inventory_rows: list[dict]) -> list[dict]:
    grouped: dict[tuple[str, str, str, str], dict] = {}
    for row in inventory_rows:
        key = (row["ISP / Proveedor"], row["ASN"], row["Organizacion oficial RDAP"], row["Pais Registro"])
        item = grouped.setdefault(key, {
            "ISP / Proveedor": row["ISP / Proveedor"],
            "ASN": row["ASN"],
            "Organizacion": row["Organizacion oficial RDAP"],
            "Pais Registro": row["Pais Registro"],
            "Sondas": 0,
            "Mediciones": 0,
        })
        item["Sondas"] += 1
        item["Mediciones"] += int(row["Mediciones"])
    return sorted(grouped.values(), key=lambda row: (-row["Mediciones"], row["ASN"]))


def _to_utc(value: object) -> str:
    try:
        seconds = float(value)
        if seconds > 100_000_000_000:
            seconds /= 1000
        return datetime.fromtimestamp(seconds, tz=timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    except (TypeError, ValueError, OSError):
        return "N/D"


def _source_ip(row: pd.Series) -> str:
    for field in ("probe_ip", "from"):
        value = row.get(field)
        if pd.notna(value) and str(value).strip():
            return str(value)
    return "N/D"


def _outage_events(measurements: pd.DataFrame) -> list[dict]:
    """Find inactivity gaps and include the source IP on both sides."""
    if not {"prb_id", "timestamp"}.issubset(measurements.columns):
        return []
    candidates: list[list[dict]] = []
    for _, group in measurements.dropna(subset=["timestamp"]).groupby("prb_id", dropna=False):
        ordered = group.sort_values("timestamp").drop_duplicates(subset=["timestamp"], keep="last")
        if len(ordered) < 3:
            continue
        records = [(float(row["timestamp"]), _source_ip(row)) for _, row in ordered.iterrows()]
        gaps = [later[0] - earlier[0] for earlier, later in zip(records, records[1:])]
        expected = float(pd.Series(gaps).median()) if gaps else 0.0
        if expected <= 0:
            continue
        threshold = max(expected * 2.5, 30 * 60)
        events = []
        for before, after in zip(records, records[1:]):
            gap = after[0] - before[0]
            if gap <= threshold:
                continue
            minutes = round(gap / 60)
            events.append({
                "Episodio": len(events) + 1,
                "Inicio (UTC)": _to_utc(before[0]),
                "Fin (UTC)": _to_utc(after[0]),
                "Duracion": f"{gap / 3600:.1f}h ({minutes} min)",
                "IP antes": before[1],
                "IP despues": after[1],
                "Cambio de IP": "Si" if before[1] != after[1] else "No",
                "_duracion_horas": gap / 3600,
            })
        if events:
            candidates.append(events)
    if not candidates:
        return []
    selected = max(candidates, key=lambda rows: (len(rows), sum(row["_duracion_horas"] for row in rows)))
    return [{key: value for key, value in row.items() if key != "_duracion_horas"} for row in selected]

def _public_targets(measurements: pd.DataFrame) -> list[str]:
    if "dst_addr" not in measurements.columns:
        return []
    public = measurements[measurements["dst_addr"].apply(_is_public_ip)]
    return [str(value) for value in public["dst_addr"].value_counts().index]


def _final_hops(df: pd.DataFrame) -> pd.DataFrame:
    keys = _trace_keys(df)
    if not keys or "hop" not in df.columns:
        return pd.DataFrame()
    work = df.copy()
    work["hop"] = pd.to_numeric(work["hop"], errors="coerce")
    work["rtt"] = pd.to_numeric(work["rtt"], errors="coerce") if "rtt" in work.columns else pd.NA
    work = work.dropna(subset=["hop"])
    if work.empty:
        return work
    maximum = work.groupby(keys, dropna=False)["hop"].transform("max")
    return work[work["hop"] == maximum].copy()


def _target_distribution(measurements: pd.DataFrame, targets: list[str]) -> list[dict]:
    if not targets or not {"dst_addr", "prb_id"}.issubset(measurements.columns):
        return []
    subset = measurements[measurements["dst_addr"].astype(str).isin(targets)]
    rows = []
    for target, group in subset.groupby("dst_addr"):
        rows.append({"IP destino": str(target), "Mediciones": int(len(group)), "Sondas": int(group["prb_id"].nunique())})
    return sorted(rows, key=lambda row: -row["Mediciones"])


def _route_chart_rows(final: pd.DataFrame, targets: list[str], identities: dict[Any, dict[str, Any]]) -> tuple[list[dict], list[str]]:
    if final.empty or not targets or not {"prb_id", "dst_addr", "rtt"}.issubset(final.columns):
        return [], []
    subset = final[final["dst_addr"].astype(str).isin(targets)].dropna(subset=["rtt"])
    values: dict[str, dict[str, float]] = {}
    labels: dict[str, str] = {}
    for (probe_raw, target), group in subset.groupby(["prb_id", "dst_addr"], dropna=False):
        probe = _probe_id(probe_raw)
        target_label = str(target)
        values.setdefault(probe, {"Sonda": probe})[target_label] = round(float(group["rtt"].median()), 2)
        labels[probe] = _metadata_for_probe(probe, identities)["ISP"]
    rows = list(values.values())
    rows.sort(key=lambda row: str(row["Sonda"]))
    for row in rows:
        row["Sonda"] = f"{row['Sonda']} ({labels.get(str(row['Sonda']), 'N/D')})"
    return rows, targets


def _notebook_median(values: pd.Series) -> float:
    ordered = sorted(float(value) for value in values.dropna())
    if not ordered:
        return 0.0
    return ordered[len(ordered) // 2]


def _route_table_rows(measurements: pd.DataFrame, targets: list[str], identities: dict[Any, dict[str, Any]]) -> list[dict]:
    """Build the Figure 18 table using one row per valid measurement, as in the notebook."""
    if measurements.empty or not targets or not {"prb_id", "dst_addr"}.issubset(measurements.columns):
        return []
    metric_col = "ttr" if "ttr" in measurements.columns else "rtt"
    hop_col = "hop_count" if "hop_count" in measurements.columns else "hop"
    if metric_col not in measurements.columns or hop_col not in measurements.columns:
        return []
    subset = measurements[measurements["dst_addr"].astype(str).isin(targets)].copy()
    subset[metric_col] = pd.to_numeric(subset[metric_col], errors="coerce")
    subset[hop_col] = pd.to_numeric(subset[hop_col], errors="coerce")
    subset = subset.dropna(subset=[metric_col])
    grouped: dict[str, list[dict]] = {}
    for (probe_raw, target), group in subset.groupby(["prb_id", "dst_addr"], dropna=False):
        probe = _probe_id(probe_raw)
        grouped.setdefault(probe, []).append({
            "Probe": probe,
            "ISP": _metadata_for_probe(probe, identities)["ISP"],
            "IP Destino": str(target),
            "Mediciones": int(len(group)),
            "TTR mediana (ms)": round(_notebook_median(group[metric_col]), 2),
            "TTR promedio (ms)": round(float(group[metric_col].mean()), 2),
            "Hops promedio": round(float(group[hop_col].mean()), 1),
        })
    complete = list(grouped.values())
    complete.sort(key=lambda rows: (int(rows[0]["Probe"]) if rows[0]["Probe"].isdigit() else rows[0]["Probe"]))
    target_order = list(reversed(targets))
    return [row for rows in complete for row in sorted(rows, key=lambda item: target_order.index(item["IP Destino"]))]


def _secondary_activity(measurements: pd.DataFrame, secondary_ip: str | None) -> list[dict]:
    if not secondary_ip or not {"timestamp", "dst_addr", "prb_id"}.issubset(measurements.columns):
        return []
    subset = measurements[measurements["dst_addr"].astype(str) == secondary_ip].copy()
    if subset.empty:
        return []
    times = pd.to_numeric(subset["timestamp"], errors="coerce")
    if times.dropna().median() > 100_000_000_000:
        times = times / 1000
    subset["Fecha"] = pd.to_datetime(times, unit="s", utc=True, errors="coerce").dt.strftime("%Y-%m-%d")
    grouped = subset.groupby(["Fecha", "prb_id"]).size().reset_index(name="Mediciones")
    rows = []
    for date, group in grouped.groupby("Fecha"):
        row: dict[str, Any] = {"Fecha": date, "TOTAL": int(group["Mediciones"].sum())}
        for _, item in group.iterrows():
            row[_probe_id(item["prb_id"])] = int(item["Mediciones"])
        rows.append(row)
    columns = sorted({key for row in rows for key in row if key not in {"Fecha", "TOTAL"}}, key=str)
    for row in rows:
        for column in columns:
            row.setdefault(column, 0)
    return sorted(rows, key=lambda row: row["Fecha"])


def _daily_activity_rows(activity_rows: list[dict]) -> list[dict]:
    rows = []
    for row in activity_rows:
        value = str(row.get("Fecha", "N/D"))
        try:
            label = datetime.strptime(value, "%Y-%m-%d").strftime("%d-%b")
        except ValueError:
            label = value
        rows.append({"Fecha": label, "Mediciones": int(row.get("TOTAL", 0))})
    return rows


def _latency_rows(final: pd.DataFrame, targets: list[str]) -> list[dict]:
    if final.empty or not targets or not {"dst_addr", "rtt"}.issubset(final.columns):
        return []
    subset = final[final["dst_addr"].astype(str).isin(targets)].dropna(subset=["rtt"])
    rows = []
    for target, group in subset.groupby("dst_addr"):
        rows.append({
            "IP destino": str(target),
            "RTT mediano": round(float(group["rtt"].median()), 2),
            "RTT promedio": round(float(group["rtt"].mean()), 2),
        })
    return sorted(rows, key=lambda row: row["IP destino"])


def _table_figure(figure_id: str, title: str, columns: list[str], rows: list[dict]) -> dict:
    return {"id": figure_id, "title": title, "type": "CHART", "kind": "table", "columns": columns, "rows": rows}


def execute(df: pd.DataFrame, inv_id: int) -> dict:
    if df.empty:
        return {"metricas_resumen": {}, "report_figures": []}

    work = df.copy()
    measurements = _measurements(work)
    identities = resolve_probe_identities(work)
    inventory_rows = _probe_inventory(measurements, identities)
    asn_rows = _asn_distribution(inventory_rows)
    targets = _public_targets(measurements)
    final = _final_hops(work)
    secondary_ip = targets[1] if len(targets) > 1 else None
    route_rows, route_keys = _route_chart_rows(final, targets, identities)
    latency_rows = _latency_rows(final, targets)
    activity_rows = _secondary_activity(measurements, secondary_ip)
    activity_columns = list(activity_rows[0].keys()) if activity_rows else ["Fecha", "TOTAL"]
    foreign_asns = {row["ASN"] for row in inventory_rows if row["Pais Registro"] not in {"SV", "N/D", ""}}

    return {
        "metricas_resumen": {
            "total_asns": len({row["ASN"] for row in inventory_rows if row["ASN"] != "N/D"}),
            "asns_extranjeros": len(foreign_asns),
            "sondas": len(inventory_rows),
            "ips_destino_publicas": len(targets),
        },
        "report_figures": [
            _table_figure("14", "Mapa de distribucion de sondas por ISP", ["ISP / Proveedor", "ASN", "Pais Registro", "Sondas", "Mediciones"], asn_rows),
            _table_figure("15", "Distribucion de mediciones validas por sistema autonomo (ASN)", ["N", "ID Sonda", "IP Publica", "ISP / Proveedor", "Organizacion oficial RDAP", "ASN", "Pais Registro", "Mediciones"], inventory_rows),
            _table_figure("16", "Tabla de sondas, ASNs, paises de registro e ISPs verificados", ["ISP / Proveedor", "ASN", "Organizacion", "Pais Registro", "Sondas", "Mediciones"], asn_rows),
            _table_figure("17", "Cronologia y duracion de episodios de desconexion de la sonda seleccionada", ["Episodio", "Inicio (UTC)", "Fin (UTC)", "Duracion", "IP antes", "IP despues", "Cambio de IP"], _outage_events(measurements)),
            _table_figure("18", "Distribucion de mediciones entre destinos publicos detectados", ["Probe", "ISP", "IP Destino", "Mediciones", "TTR mediana (ms)", "TTR promedio (ms)", "Hops promedio"], _route_table_rows(measurements, targets, identities)),
            {"id": "19", "title": "Comparativa de rutas de backbone hacia destinos publicos", "type": "CHART", "kind": "bar", "categoryKey": "Sonda", "dataKeys": route_keys, "rows": route_rows},
            _table_figure("20", f"Cronologia de actividad de la IP {secondary_ip or 'secundaria'} durante el estudio", activity_columns, activity_rows),
            {"id": "21", "title": "Actividad diaria del destino publico secundario", "type": "CHART", "kind": "bar", "categoryKey": "Fecha", "dataKey": "Mediciones", "rows": _daily_activity_rows(activity_rows)},
        ],
    }
