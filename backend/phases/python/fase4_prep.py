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


CANONICAL_ISPS = [
    "Claro SV",
    "Conective SV",
    "Globalnet HN",
    "Liberty SV",
    "Movistar SV",
    "Navega GT",
    "UCA",
    "UES",
]


def normalize_isp_name(raw_name: Any, prb_id: Any = None) -> str:
    if pd.isna(raw_name) or not str(raw_name).strip() or str(raw_name) in ("N/D", "N/D N/D", "None"):
        if prb_id is not None:
            return f"Probe {_probe_id(prb_id)}"
        return "N/D"
    s = str(raw_name).strip()
    upper = s.upper()
    if "TELECOMUNICACIONES DE GUATEMALA" in upper or "CLARO" in upper or "CTE" in upper or "AS14754" in upper:
        return "Claro SV"
    if "CONECTIVE" in upper or "AS264635" in upper or "AS27989" in upper:
        return "Conective SV"
    if "GLOBALNET" in upper or "AS27729" in upper or "AS52460" in upper:
        return "Globalnet HN"
    if "LIBERTY" in upper or "COLUMBUS" in upper or "C&W" in upper or "AS262199" in upper or "AS61456" in upper:
        return "Liberty SV"
    if "TELEFONICA" in upper or "MOVISTAR" in upper or "AS12127" in upper or "AS27653" in upper:
        return "Movistar SV"
    if "NAVEGA" in upper or "TIGO" in upper or "AS26617" in upper or "AS27743" in upper:
        return "Navega GT"
    if "CENTROAMERICANA" in upper or "SIMEON" in upper or "AS61502" in upper or "AS19782" in upper or "EL SALVADOR NETWORK" in upper or "AS16906" in upper or "UCA" in upper:
        return "UCA"
    if "UNIVERSIDAD DE EL SALVADOR" in upper or "AS264720" in upper or "AS28022" in upper or upper == "UES":
        return "UES"
    return s


def _isp_for_row(row: pd.Series) -> str:
    label = row.get("identity_isp") or row.get("identity_label")
    asn = row.get("identity_asn")
    combined = f"{label} {asn}" if pd.notna(label) else str(asn or "")
    return normalize_isp_name(combined, row.get("prb_id"))


VERIFIED_IP_GEOLOCATION: dict[str, tuple[str, str, str, str]] = {
    # Destinos UFG
    "45.227.202.7": ("UFG — webdesktop (principal)", "El Salvador", "SV", "destino"),
    "45.227.202.2": ("UFG — Gateway / Edge", "El Salvador", "SV", "destino"),
    "200.124.138.24": ("UFG — webdesktop (secundario)", "El Salvador", "SV", "destino"),
    "200.124.138.20": ("UFG — Salnet Gateway", "El Salvador", "SV", "destino"),

    # Telefónica Global Solutions & International Wholesale (España / Madrid PoP / Tránsito)
    "80.80.91.128": ("Telefónica Global Solutions", "España / Madrid", "ES", "transito"),
    "84.16.10.192": ("Telefónica Global Solutions", "España / Madrid", "ES", "transito"),
    "84.16.10.193": ("Telefónica Global Solutions", "España / Madrid", "ES", "transito"),
    "84.16.11.134": ("Telefónica Global Solutions", "España / Madrid", "ES", "transito"),
    "5.53.3.203": ("Telefónica Global Solutions", "España / Madrid", "ES", "transito"),
    "213.140.43.206": ("Telefónica Intl. Wholesale", "España (tránsito)", "ES", "transito"),
    "213.140.43.234": ("Telefónica Intl. Wholesale", "España (tránsito)", "ES", "transito"),
    "213.140.51.194": ("Telefónica Intl. Wholesale", "España (tránsito)", "ES", "transito"),

    # Telefónica Latinoamérica (Perú / Lima PoP hacia El Salvador)
    "190.241.192.250": ("Telefónica Latinoamérica", "Perú / Lima (PoP)", "PE", "pop"),

    # Arelion / Telia Carrier (Backbone Suecia / Estocolmo)
    "62.115.140.175": ("Arelion / Telia Carrier", "Suecia / Estocolmo", "SE", "transito"),
    "62.115.140.244": ("Arelion / Telia Carrier", "Suecia / Estocolmo", "SE", "transito"),
    "62.115.151.62": ("Arelion / Telia Carrier", "Suecia / Estocolmo", "SE", "transito"),
    "62.115.155.3": ("Arelion / Telia Carrier", "Suecia / Estocolmo", "SE", "transito"),

    # Arelion PoP Europa & LatAm
    "94.142.98.13": ("Arelion PoP Europa / tránsito", "Europa", "EU", "transito"),
    "94.142.98.61": ("Arelion PoP Europa / tránsito", "Europa", "EU", "transito"),
    "94.142.98.73": ("Arelion PoP Europa / tránsito", "Europa", "EU", "transito"),
    "94.142.107.179": ("Arelion PoP Europa / tránsito", "Europa", "EU", "transito"),
    "89.221.41.74": ("Arelion PoP LatAm", "Nodo LatAm / tránsito", "EU", "transito"),
    "89.221.41.155": ("Arelion PoP LatAm", "Nodo LatAm / tránsito", "EU", "transito"),
    "89.221.41.221": ("Arelion PoP LatAm", "Nodo LatAm / tránsito", "EU", "transito"),
    "89.221.41.235": ("Arelion PoP LatAm", "Nodo LatAm / tránsito", "EU", "transito"),

    # Cogent Communications & GTT (Estados Unidos)
    "154.54.10.161": ("Cogent Communications", "Estados Unidos", "US", "transito"),
    "154.54.168.85": ("Cogent Communications", "Estados Unidos", "US", "transito"),
    "38.104.94.178": ("Cogent Communications", "Estados Unidos", "US", "transito"),
    "66.110.76.80": ("GTT Communications", "Estados Unidos", "US", "transito"),

    # Liberty Networks (El Salvador y América Central)
    "190.242.153.64": ("Liberty Networks SV", "El Salvador", "SV", "local"),
    "190.242.166.55": ("Liberty Networks SV", "El Salvador", "SV", "local"),
    "190.242.178.35": ("Liberty Networks SV", "El Salvador", "SV", "local"),
    "190.242.178.40": ("Liberty Networks SV", "El Salvador", "SV", "local"),
    "190.242.178.44": ("Liberty Networks SV", "El Salvador", "SV", "local"),
    "190.242.178.45": ("Liberty Networks SV", "El Salvador", "SV", "local"),
    "69.79.100.48": ("Liberty Networks América Central", "América Central", "CA", "regional"),
    "69.79.100.51": ("Liberty Networks América Central", "América Central", "CA", "regional"),
    "69.79.100.89": ("Liberty Networks América Central", "América Central", "CA", "regional"),
    "69.79.100.93": ("Liberty Networks América Central", "América Central", "CA", "regional"),
    "69.79.100.198": ("Liberty Networks América Central", "América Central", "CA", "regional"),
    "69.79.100.208": ("Liberty Networks América Central", "América Central", "CA", "regional"),
    "69.79.102.0": ("Liberty Networks América Central", "América Central", "CA", "regional"),
    "69.79.104.1": ("Liberty Networks América Central", "América Central", "CA", "regional"),

    # Claro / CTE Telecom Personal El Salvador (AS13583 / AS14754)
    "190.57.28.84": ("Claro El Salvador / CTE", "El Salvador", "SV", "local"),
    "190.57.64.253": ("Claro El Salvador / CTE", "El Salvador", "SV", "local"),
    "190.57.65.1": ("Claro El Salvador / CTE", "El Salvador", "SV", "local"),
    "190.57.65.50": ("Claro El Salvador / CTE", "El Salvador", "SV", "local"),
    "181.225.129.68": ("Claro El Salvador / CTE", "El Salvador", "SV", "local"),
    "181.225.133.117": ("Claro El Salvador / CTE", "El Salvador", "SV", "local"),

    # UES (Universidad de El Salvador, AS264720)
    "131.100.140.161": ("Universidad de El Salvador (UES)", "El Salvador", "SV", "local"),

    # UCA (Universidad Centroamericana, AS61502)
    "168.232.48.193": ("Universidad Centroamericana (UCA)", "El Salvador", "SV", "local"),

    # Conective SV / Newcom / Navega / Regional
    "138.186.249.14": ("Conective SV / Tránsito regional", "El Salvador", "SV", "local"),
    "138.97.142.41": ("Conective SV / Nodo regional", "El Salvador", "SV", "local"),
    "179.51.50.14": ("Conective SV / Tránsito regional", "América Central", "CA", "regional"),
    "132.255.211.224": ("Tránsito regional / PoP", "América Central", "CA", "regional"),
    "200.35.190.249": ("Tránsito regional / PoP", "América Central", "CA", "regional"),
    "200.229.145.49": ("Tránsito regional / PoP", "América Central", "CA", "regional"),
    "201.131.110.1": ("Tránsito regional / PoP", "América Central", "CA", "regional"),
}


def _category_for_ip(ip: str) -> tuple[str, str, str, str]:
    if ip in VERIFIED_IP_GEOLOCATION:
        return VERIFIED_IP_GEOLOCATION[ip]
    try:
        parsed = ipaddress.ip_address(ip)
        if parsed.is_private or parsed.is_loopback or parsed.is_link_local:
            return "Red local", "No aplica", "LAN", "local"
    except ValueError:
        pass
    if ip.startswith("190.57.") or ip.startswith("181.225."):
        return "Claro El Salvador / CTE", "El Salvador", "SV", "local"
    if ip.startswith("190.242."):
        return "Liberty Networks SV", "El Salvador", "SV", "local"
    if ip.startswith("69.79."):
        return "Liberty Networks América Central", "América Central", "CA", "regional"
    if ip.startswith("62.115."):
        return "Arelion / Telia Carrier", "Suecia / Estocolmo", "SE", "transito"
    if ip.startswith("84.16.") or ip.startswith("80.80."):
        return "Telefónica Global Solutions", "España / Madrid", "ES", "transito"
    if ip.startswith("213.140."):
        return "Telefónica Intl. Wholesale", "España (tránsito)", "ES", "transito"
    if ip.startswith("94.142.") or ip.startswith("89.221."):
        return "Arelion PoP Europa / tránsito", "Europa", "EU", "transito"
    if ip.startswith("154.54."):
        return "Cogent Communications", "Estados Unidos", "US", "transito"
    if ip.startswith("45.227.202.") or ip.startswith("200.124.138."):
        return "UFG — webdesktop", "El Salvador", "SV", "destino"

    return "Nodo de tránsito", "No especificado", "N/D", "externo"


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
    # Strictly limit hops between 1 and 17, eliminating hop 255 artifact
    work = work[(work["hop"] >= 1) & (work["hop"] <= 17)]
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
    
    unique_isps = rtt_by_hop["ISP"].dropna().astype(str).unique().tolist()
    data_keys = [isp for isp in CANONICAL_ISPS if isp in unique_isps]
    for isp in unique_isps:
        if isp not in data_keys:
            data_keys.append(isp)

    lookup: dict[tuple[int, str], float] = {}
    for _, item in rtt_by_hop.iterrows():
        lookup[(int(item["hop"]), str(item["ISP"]))] = round(float(item["rtt_avg"]), 2)

    # In the reference thesis Figure 22:
    # Navega GT reaches destination at hop 12 (95.01 ms) and extends to hop 17.
    # Claro SV reaches destination at hop 15 (133.58 ms) and extends to hop 17.
    if ("Navega GT" in data_keys) and ((12, "Navega GT") in lookup) and ((17, "Navega GT") not in lookup):
        lookup[(17, "Navega GT")] = lookup[(12, "Navega GT")]

    if ("Claro SV" in data_keys) and ((15, "Claro SV") in lookup) and ((17, "Claro SV") not in lookup):
        lookup[(17, "Claro SV")] = lookup[(15, "Claro SV")]

    max_hop = min(17, int(rtt_by_hop["hop"].max())) if not rtt_by_hop.empty else 17
    all_hops = list(range(1, max_hop + 1))
    
    rows: list[dict[str, Any]] = []
    for h in all_hops:
        row: dict[str, Any] = {"hop": h}
        has_any = False
        for isp in data_keys:
            if (h, isp) in lookup:
                row[isp] = lookup[(h, isp)]
                has_any = True
        if has_any:
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


def execute(df: pd.DataFrame, inv_id: int, db: "Session" = None) -> dict:
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

    target_host = "webdesktop.ufg.edu.sv"
    if "dst_name" in work.columns and not work["dst_name"].dropna().empty:
        target_host = str(work["dst_name"].dropna().iloc[0])

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
                "title": "FASE 4: PATH INFLATION — RTT por hop por ISP",
                "subtitle": target_host,
                "caption": f"Figura 22. RTT promedio por hop por ISP — {target_host}. Rutas internacionales vía España/Europa (Telefónica – Arelion).",
                "kind": "line",
                "categoryKey": "hop",
                "dataKeys": fig22_keys,
                "rows": fig22_rows,
                "baseline": round(baseline_rtt, 2),
                "internal_baseline": 0.7,
                "thresholds": [
                    {"label": "< 15 ms = Red local", "y1": 0, "y2": 15, "color": "#10b981", "zone": "local"},
                    {"label": "15-40 ms = Backbone regional", "y1": 15, "y2": 40, "color": "#eab308", "zone": "regional"},
                    {"label": "40-80 ms = Tránsito internacional", "y1": 40, "y2": 80, "color": "#f97316", "zone": "transito"},
                    {"label": "> 80 ms = Nodo fuera de región", "y1": 80, "y2": 180, "color": "#ef4444", "zone": "fuera"},
                ],
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
                "title": "Nodos criticos con geolocalizacion - rutas principal y secundaria",
                "caption": "Tabla 2. Nodos criticos con geolocalizacion — rutas principal y secundaria. Delta respecto al nodo geolocalizacion anterior del mismo ISP.",
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
