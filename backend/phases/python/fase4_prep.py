import ipaddress
from typing import TYPE_CHECKING, Any

import pandas as pd

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

from services.network_identity import add_identity_columns

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


def _isp_for_row(row: pd.Series) -> str:
    probe = _probe_id(row.get("prb_id"))
    label = row.get("identity_isp") or row.get("identity_label")
    if pd.notna(label) and str(label).strip() and str(label) != "N/D":
        return str(label)
    asn = row.get("identity_asn")
    if pd.notna(asn) and str(asn).strip() and str(asn) != "N/D":
        return str(asn)
    return f"Probe {probe}"


def _category_for_ip(ip: str) -> tuple[str, str, str, str]:
    try:
        parsed = ipaddress.ip_address(ip)
        if parsed.is_private or parsed.is_loopback or parsed.is_link_local:
            return "Red local", "No aplica", "LAN", "local"
    except ValueError:
        pass
    return "No disponible en JSON", "No disponible en JSON", "N/D", "externo"


def _public_targets(measurements: pd.DataFrame) -> list[str]:
    if "dst_addr" not in measurements.columns:
        return []
    public = measurements[measurements["dst_addr"].apply(_is_public_ip)]
    return [str(value) for value in public["dst_addr"].value_counts().index]


def _control_probe_ids(df: pd.DataFrame) -> set[str]:
    """Identify local/control probes from their private RIPE Atlas targets."""
    if not {"prb_id", "dst_addr"}.issubset(df.columns):
        return set()
    controls: set[str] = set()
    for _, group in _measurements(df).groupby("prb_id", dropna=False):
        destinations = group["dst_addr"].dropna()
        if not destinations.empty and destinations.map(_is_public_ip).eq(False).any():
            controls.add(_probe_id(group.iloc[0].get("prb_id")))
    return controls


def _per_measurement_hop_rtt(df: pd.DataFrame, targets: list[str]) -> pd.DataFrame:
    if df.empty or not {"prb_id", "hop", "rtt", "dst_addr"}.issubset(df.columns):
        return pd.DataFrame(columns=["ISP", "hop", "rtt_avg"])
    work = df[df["dst_addr"].astype(str).isin(targets)].copy() if targets else df.copy()
    work["hop"] = pd.to_numeric(work["hop"], errors="coerce")
    work["rtt"] = pd.to_numeric(work["rtt"], errors="coerce")
    work = work.dropna(subset=["hop", "rtt"])
    if work.empty:
        return pd.DataFrame(columns=["ISP", "hop", "rtt_avg"])
    work["ISP"] = work.apply(_isp_for_row, axis=1)
    keys = _trace_keys(work) + ["hop", "ISP"]
    per_measurement = work.groupby(keys, dropna=False)["rtt"].mean().reset_index(name="rtt_medicion")
    avg = per_measurement.groupby(["ISP", "hop"], dropna=False)["rtt_medicion"].mean().reset_index(name="rtt_avg")
    avg["hop"] = avg["hop"].astype(int)
    avg["rtt_avg"] = avg["rtt_avg"].round(2)
    return avg.sort_values(["ISP", "hop"])


def _figure22_rows(rtt_by_hop: pd.DataFrame) -> tuple[list[dict], list[str]]:
    if rtt_by_hop.empty:
        return [], []
    data_keys = sorted(rtt_by_hop["ISP"].dropna().astype(str).unique().tolist())
    rows: list[dict[str, Any]] = []
    for hop, group in rtt_by_hop.groupby("hop"):
        row: dict[str, Any] = {"hop": int(hop)}
        for _, item in group.iterrows():
            row[str(item["ISP"])] = round(float(item["rtt_avg"]), 2)
        rows.append(row)
    return sorted(rows, key=lambda row: row["hop"]), data_keys


def _inflation_points(rtt_by_hop: pd.DataFrame) -> list[dict]:
    rows = []
    if rtt_by_hop.empty:
        return rows
    for isp, group in rtt_by_hop.groupby("ISP"):
        ordered = group.sort_values("hop").reset_index(drop=True)
        for index in range(1, len(ordered)):
            previous = ordered.loc[index - 1]
            current = ordered.loc[index]
            delta = float(current["rtt_avg"]) - float(previous["rtt_avg"])
            if delta > 20:
                rows.append({
                    "ISP": str(isp),
                    "Hop anterior": int(previous["hop"]),
                    "RTT anterior (ms)": round(float(previous["rtt_avg"]), 2),
                    "Hop inflado": int(current["hop"]),
                    "RTT inflado (ms)": round(float(current["rtt_avg"]), 2),
                    "Delta (ms)": round(delta, 1),
                })
    return sorted(rows, key=lambda row: (row["ISP"], row["Hop anterior"]))


def _responded_measurement(group: pd.DataFrame, targets: list[str]) -> bool:
    if "destination_ip_responded" in group.columns:
        values = group["destination_ip_responded"].dropna().astype(str).str.lower()
        if not values.empty:
            return values.isin(["true", "1", "yes", "si"]).any()
    replies = set(group.get("reply_from", pd.Series(dtype="object")).dropna().astype(str))
    if replies.intersection(set(targets)):
        return True
    if "ttr" in group.columns:
        return pd.to_numeric(group["ttr"], errors="coerce").notna().any()
    return False


def _critical_nodes(df: pd.DataFrame, targets: list[str]) -> list[dict]:
    if df.empty or not {"prb_id", "hop", "rtt", "reply_from", "dst_addr"}.issubset(df.columns):
        return []
    work = df[df["dst_addr"].astype(str).isin(targets)].copy() if targets else df.copy()
    work["hop"] = pd.to_numeric(work["hop"], errors="coerce")
    work["rtt"] = pd.to_numeric(work["rtt"], errors="coerce")
    work = work.dropna(subset=["hop", "rtt", "reply_from"])
    if work.empty:
        return []
    work["ISP"] = work.apply(_isp_for_row, axis=1)
    rows: list[dict] = []
    seen_isp: set[str] = set()
    for _, group in work.sort_values(["timestamp", "hop"]).groupby(_trace_keys(work), dropna=False):
        isp = str(group.iloc[0]["ISP"])
        if isp in seen_isp or not _responded_measurement(group, targets):
            continue
        previous_rtt = 0.0
        hop_rows = group.sort_values("hop").groupby("hop", dropna=False).agg({"rtt": "mean", "reply_from": "first"}).reset_index()
        for _, hop_row in hop_rows.iterrows():
            ip = str(hop_row["reply_from"])
            if not ip or ip == "nan" or not _is_public_ip(ip):
                continue
            owner, location, country_code, category = _category_for_ip(ip)
            rtt = float(hop_row["rtt"])
            delta = rtt - previous_rtt
            rows.append({
                "ISP": isp,
                "Hop": int(hop_row["hop"]),
                "IP del nodo": ip,
                "Propietario": owner,
                "Ubicacion": location,
                "Pais": country_code,
                "RTT (ms)": round(rtt, 1),
                "Delta (ms)": round(delta, 1) if delta > 0 else "-",
            })
            previous_rtt = rtt
        seen_isp.add(isp)
    deduped: dict[tuple[str, str], dict] = {}
    for row in rows:
        deduped.setdefault((row["ISP"], row["IP del nodo"]), row)
    return sorted(deduped.values(), key=lambda row: (row["ISP"], row["Hop"]))


def _destination_totals(df: pd.DataFrame, targets: list[str]) -> dict[str, dict[str, float]]:
    if df.empty or not targets or not {"hop", "rtt", "reply_from", "dst_addr"}.issubset(df.columns):
        return {}
    work = df.copy()
    work["hop"] = pd.to_numeric(work["hop"], errors="coerce")
    work["rtt"] = pd.to_numeric(work["rtt"], errors="coerce")
    work = work.dropna(subset=["hop", "rtt", "reply_from"])
    work = work[(work["hop"] < 255) & (work["dst_addr"].astype(str).isin(targets))]
    work = work[work["reply_from"].astype(str) == work["dst_addr"].astype(str)]
    if work.empty:
        return {}
    work["ISP"] = work.apply(_isp_for_row, axis=1)
    totals: dict[str, dict[str, float]] = {}
    for isp, group in work.groupby("ISP"):
        hop_counts = group["hop"].value_counts()
        if hop_counts.empty:
            continue
        totals[str(isp)] = {
            "hop": int(hop_counts.index[0]),
            "rtt": float(group["rtt"].mean()),
        }
    return totals


def _baseline_from_final_packets(df: pd.DataFrame, targets: list[str]) -> float:
    """Median final-hop RTT of the best responding external probe.

    This is the methodology used by the reference Path Inflation analysis:
    choose the external probe with the lowest median destination RTT, then use
    the median of all of its packets that actually reached a public target.
    """
    required = {"prb_id", "dst_addr", "reply_from", "rtt", "hop"}
    if df.empty or not required.issubset(df.columns):
        return 0.0
    work = df.copy()
    work["rtt"] = pd.to_numeric(work["rtt"], errors="coerce")
    work["hop"] = pd.to_numeric(work["hop"], errors="coerce")
    work = work.dropna(subset=["rtt", "hop", "reply_from"])
    work = work[(work["hop"] < 255) & work["dst_addr"].astype(str).isin(targets)]
    work = work[work["reply_from"].astype(str) == work["dst_addr"].astype(str)]
    if work.empty:
        return 0.0
    medians = work.groupby("prb_id")["rtt"].median()
    if medians.empty:
        return 0.0
    best_probe = medians.idxmin()
    return float(work[work["prb_id"] == best_probe]["rtt"].median())


def _summary_rows(rtt_by_hop: pd.DataFrame, df: pd.DataFrame, targets: list[str], baseline: float) -> list[dict]:
    rows = []
    if rtt_by_hop.empty:
        return rows
    valid = rtt_by_hop[pd.to_numeric(rtt_by_hop["hop"], errors="coerce") < 255].copy()
    if valid.empty:
        return rows
    destination_totals = _destination_totals(df, targets)

    candidates: list[dict[str, float | int | str]] = []
    for isp, group in valid.groupby("ISP"):
        ordered = group.sort_values("hop")
        local = ordered[ordered["hop"] <= 3]["rtt_avg"].min()
        if pd.isna(local):
            local = ordered["rtt_avg"].min()
        if str(isp) in destination_totals:
            total = destination_totals[str(isp)]["rtt"]
            hops = destination_totals[str(isp)]["hop"]
        else:
            final = ordered.iloc[-1]
            total = float(final["rtt_avg"])
            hops = int(final["hop"])
        candidates.append({
            "ISP": str(isp),
            "RTT local (ms)": round(float(local), 1),
            "RTT total destino (ms)": round(total, 1),
            "Hops totales": int(hops),
        })
    for row in candidates:
        total = float(row["RTT total destino (ms)"])
        local = float(row["RTT local (ms)"])
        row["Overhead Path Inflation (ms)"] = round(total - local, 1)
        row["Exceso vs linea base (ms)"] = round(max(0.0, total - baseline), 1)
    rows.extend(candidates)
    return sorted(rows, key=lambda row: row["Overhead Path Inflation (ms)"], reverse=True)


def _table(table_id: str, title: str, columns: list[str], rows: list[dict]) -> dict:
    return {"id": table_id, "title": title, "columns": columns, "rows": rows}


def execute(df: pd.DataFrame, inv_id: int, db: "Session") -> dict:
    if df.empty:
        return {"metricas_resumen": {}, "report_figures": []}

    work = add_identity_columns(df.copy())
    control_probes = _control_probe_ids(work)
    if control_probes:
        work = work[~work["prb_id"].map(_probe_id).isin(control_probes)].copy()
    measurements = _measurements(work)
    targets = _public_targets(measurements)
    rtt_by_hop = _per_measurement_hop_rtt(work, targets)
    fig22_rows, fig22_keys = _figure22_rows(rtt_by_hop)
    table1_rows = _inflation_points(rtt_by_hop)
    table2_rows = _critical_nodes(work, targets)
    baseline_rtt = _baseline_from_final_packets(work, targets)
    table3_rows = _summary_rows(rtt_by_hop, work, targets, baseline_rtt)

    return {
        "metricas_resumen": {
            "probes": int(measurements["prb_id"].nunique()) if "prb_id" in measurements else 0,
            "targets": len(targets),
            "anomalias": len(table1_rows),
            "linea_base_rtt": round(baseline_rtt, 2),
        },
        "elements": [
            {
                "id": "22",
                "type": "CHART",
                "title": "RTT promedio por hop por ISP y destinos publicos detectados",
                "caption": "Figura 22. RTT promedio por hop por ISP y destinos publicos detectados en el JSON RIPE Atlas.",
                "kind": "line",
                "categoryKey": "hop",
                "dataKeys": fig22_keys,
                "rows": fig22_rows,
            },
            {
                "id": "1",
                "type": "DATA_TABLE",
                "title": "Puntos de Path Inflation - saltos con incremento de RTT > 20 ms, agrupados por ISP en orden ascendente de hop",
                "caption": "Tabla 1. Puntos de Path Inflation - saltos con incremento de RTT > 20 ms, agrupados por ISP en orden ascendente de hop.",
                "columns": ["ISP", "Hop anterior", "RTT anterior (ms)", "Hop inflado", "RTT inflado (ms)", "Delta (ms)"],
                "rows": table1_rows,
            },
            {
                "id": "2",
                "type": "DATA_TABLE",
                "title": "Nodos criticos observados en las rutas a destinos publicos",
                "caption": "Tabla 2. Nodos criticos observados en las rutas a destinos publicos. La geolocalizacion no se infiere si no existe en el JSON.",
                "columns": ["ISP", "Hop", "IP del nodo", "Propietario", "Ubicacion", "Pais", "RTT (ms)", "Delta (ms)"],
                "rows": table2_rows,
            },
            {
                "id": "3",
                "type": "DATA_TABLE",
                "title": "Resumen de Path Inflation por ISP - ordenado por overhead descendente",
                "caption": "Tabla 3. Resumen de Path Inflation por ISP - ordenado por overhead descendente.",
                "columns": ["ISP", "RTT local (ms)", "RTT total destino (ms)", "Overhead Path Inflation (ms)", "Exceso vs linea base (ms)", "Hops totales"],
                "rows": table3_rows,
            },
            {
                "id": "23",
                "type": "CHART",
                "title": "Overhead de Path Inflation por ISP - barras horizontales ordenadas descendentemente",
                "caption": "Figura 23. Overhead de Path Inflation por ISP - barras horizontales ordenadas descendentemente.",
                "kind": "horizontalBar",
                "categoryKey": "ISP",
                "dataKey": "Overhead Path Inflation (ms)",
                "baseline": round(baseline_rtt, 2),
                "rows": list(reversed(table3_rows)),
            },
        ],
    }
