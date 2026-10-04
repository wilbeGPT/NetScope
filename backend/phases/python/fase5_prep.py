import statistics
import os
from datetime import datetime, timezone
from typing import Any
from zoneinfo import ZoneInfo

import pandas as pd

from services.network_identity import add_identity_columns
from phases.python.fase4_prep import _is_public_ip, _probe_id, _public_targets

TRACE_KEYS = ["msm_id", "prb_id", "timestamp", "dst_addr", "dst_name"]
DOW_ES = {
    0: "Lunes",
    1: "Martes",
    2: "Miercoles",
    3: "Jueves",
    4: "Viernes",
    5: "Sabado",
    6: "Domingo",
}
DOW_SHORT = {0: "Lun", 1: "Mar", 2: "Mie", 3: "Jue", 4: "Vie", 5: "Sab", 6: "Dom"}
PICO_MANANA = list(range(7, 13))
PICO_TARDE = list(range(13, 18))
PICO_NOCHE = list(range(18, 22))
HORAS_PICO = PICO_MANANA + PICO_TARDE + PICO_NOCHE
HORAS_VALLE = [h for h in range(24) if h not in HORAS_PICO]


def _trace_keys(df: pd.DataFrame) -> list[str]:
    return [key for key in TRACE_KEYS if key in df.columns]


def _measurements(df: pd.DataFrame) -> pd.DataFrame:
    keys = _trace_keys(df)
    return df.drop_duplicates(subset=keys).copy() if keys else df.copy()


def _control_probe_ids(df: pd.DataFrame) -> set[str]:
    if not {"prb_id", "dst_addr"}.issubset(df.columns):
        return set()
    controls: set[str] = set()
    for probe, group in _measurements(df).groupby("prb_id", dropna=False):
        destinations = group["dst_addr"].dropna()
        if not destinations.empty and destinations.map(_is_public_ip).eq(False).any():
            controls.add(_probe_id(probe))
    return controls


def _isp_for_row(row: pd.Series) -> str:
    probe = _probe_id(row.get("prb_id"))
    label = row.get("identity_isp") or row.get("identity_label")
    if pd.notna(label) and str(label).strip() and str(label) != "N/D":
        return str(label)
    asn = row.get("identity_asn")
    if pd.notna(asn) and str(asn).strip() and str(asn) != "N/D":
        return str(asn)
    return f"Probe {probe}"


def _analysis_timezone() -> ZoneInfo:
    try:
        return ZoneInfo(os.getenv("ANALYSIS_TIMEZONE", "America/El_Salvador"))
    except Exception:
        return ZoneInfo("UTC")


def _analysis_datetime(value: Any) -> datetime | None:
    try:
        seconds = float(value)
        if seconds > 100_000_000_000:
            seconds /= 1000
        return datetime.fromtimestamp(seconds, tz=timezone.utc).astimezone(_analysis_timezone())
    except (TypeError, ValueError, OSError):
        return None


def _destination_packets(df: pd.DataFrame, targets: list[str]) -> pd.DataFrame:
    needed = {"timestamp", "prb_id", "dst_addr", "reply_from", "rtt", "hop"}
    if df.empty or not needed.issubset(df.columns):
        return pd.DataFrame()
    work = df.copy()
    control_probes = _control_probe_ids(work)
    work["hop"] = pd.to_numeric(work["hop"], errors="coerce")
    work["rtt"] = pd.to_numeric(work["rtt"], errors="coerce")
    work = work.dropna(subset=["timestamp", "hop", "rtt", "reply_from"])
    work = work[~work["prb_id"].map(_probe_id).isin(control_probes)]
    if targets:
        work = work[work["dst_addr"].astype(str).isin(targets)]
        work = work[work["reply_from"].astype(str).isin(targets)]
    else:
        work = work[work["reply_from"].astype(str) == work["dst_addr"].astype(str)]
    work = work[work["hop"] < 255]
    if work.empty:
        return work
    work["ISP"] = work.apply(_isp_for_row, axis=1)
    work["dt_local"] = work["timestamp"].map(_analysis_datetime)
    work = work.dropna(subset=["dt_local"])
    work["hour_num"] = work["dt_local"].map(lambda dt: int(dt.hour))
    work["hour"] = work["hour_num"].map(lambda h: f"{h:02d}h")
    work["date"] = work["dt_local"].map(lambda dt: dt.strftime("%Y-%m-%d"))
    work["date_label"] = work["dt_local"].map(lambda dt: f"{dt.strftime('%d %b')}\n{DOW_SHORT[dt.weekday()]}")
    work["weekday_num"] = work["dt_local"].map(lambda dt: int(dt.weekday()))
    work["weekday"] = work["weekday_num"].map(DOW_ES)
    return work


def _ordered_isps(values: list[str]) -> list[str]:
    return sorted(values)


def _hourly_rows(dest: pd.DataFrame) -> tuple[list[dict], list[str]]:
    if dest.empty:
        return [], []
    isps = _ordered_isps(dest["ISP"].dropna().astype(str).unique().tolist())
    grouped = dest.groupby(["hour_num", "ISP"])["rtt"].median().reset_index()
    rows = []
    for hour in range(24):
        row: dict[str, Any] = {"hour": f"{hour:02d}h"}
        subset = grouped[grouped["hour_num"] == hour]
        for _, item in subset.iterrows():
            row[str(item["ISP"])] = round(float(item["rtt"]), 2)
        rows.append(row)
    return rows, isps


def _daily_rows(dest: pd.DataFrame) -> list[dict]:
    if dest.empty:
        return []
    rows = []
    for date, group in dest.groupby("date"):
        label = str(group.iloc[0]["date_label"])
        std = float(group["rtt"].std()) if len(group) > 1 else 0.0
        rows.append({
            "date": date,
            "Fecha": label,
            "RTT mediano diario": round(float(group["rtt"].median()), 2),
            "Promedio RTT": round(float(group["rtt"].mean()), 2),
            "StdDev": round(std, 2),
        })
    return sorted(rows, key=lambda row: row["date"])


def _jitter_values(dest: pd.DataFrame) -> dict[str, list[float]]:
    values: dict[str, list[float]] = {}
    if dest.empty:
        return values
    keys = _trace_keys(dest)
    for group_keys, group in dest.groupby(keys, dropna=False):
        if len(group) < 2:
            continue
        isp = str(group.iloc[0]["ISP"])
        jitter = float(group["rtt"].std())
        values.setdefault(isp, []).append(jitter)
    return values


def _box_stats(jitter: dict[str, list[float]]) -> list[dict]:
    rows = []
    for isp in _ordered_isps(list(jitter.keys())):
        values = pd.Series(jitter.get(isp, []), dtype="float64").dropna().sort_values()
        if values.empty:
            continue
        q1 = float(values.quantile(0.25))
        med = float(values.quantile(0.5))
        q3 = float(values.quantile(0.75))
        iqr = q3 - q1
        lower = max(float(values.min()), q1 - 1.5 * iqr)
        upper = min(float(values.max()), q3 + 1.5 * iqr)
        outliers = values[(values < lower) | (values > upper)]
        rows.append({
            "isp": isp,
            "min": round(lower, 2),
            "q1": round(q1, 2),
            "median": round(med, 2),
            "q3": round(q3, 2),
            "max": round(upper, 2),
            "outliers": [round(float(v), 2) for v in outliers.head(80).tolist()],
            "outlierCount": int(len(outliers)),
            "color": "#38bdf8",
        })
    return rows


def _period_stats(values: pd.DataFrame, hours: list[int]) -> dict[str, float] | None:
    subset = values[values["hour_num"].isin(hours)]["rtt"]
    if subset.empty:
        return None
    return {"med": float(subset.median()), "n": int(len(subset))}


def _period_rows(dest: pd.DataFrame) -> list[dict]:
    rows = []
    if dest.empty:
        return rows
    for isp in _ordered_isps(dest["ISP"].dropna().astype(str).unique().tolist()):
        group = dest[dest["ISP"] == isp]
        stats = {
            "Manana 7-12h": _period_stats(group, PICO_MANANA),
            "Tarde 13-17h": _period_stats(group, PICO_TARDE),
            "Noche 18-21h": _period_stats(group, PICO_NOCHE),
            "Valle 0-6h/22-23h": _period_stats(group, HORAS_VALLE),
        }
        if not stats["Manana 7-12h"]:
            continue
        medians = [item["med"] for item in stats.values() if item]
        valle = stats["Valle 0-6h/22-23h"]["med"] if stats["Valle 0-6h/22-23h"] else min(medians)
        rows.append({
            "ISP": isp,
            "Manana 7-12h": round(stats["Manana 7-12h"]["med"], 1) if stats["Manana 7-12h"] else "N/D",
            "Tarde 13-17h": round(stats["Tarde 13-17h"]["med"], 1) if stats["Tarde 13-17h"] else "N/D",
            "Noche 18-21h": round(stats["Noche 18-21h"]["med"], 1) if stats["Noche 18-21h"] else "N/D",
            "Valle 0-6h/22-23h": round(valle, 1),
            "Delta pico vs valle": round(max(medians) - valle, 1),
        })
    global_rows = []
    for label, hours in [("Manana 7-12h", PICO_MANANA), ("Tarde 13-17h", PICO_TARDE), ("Noche 18-21h", PICO_NOCHE), ("Valle 0-6h/22-23h", HORAS_VALLE)]:
        stat = _period_stats(dest, hours)
        global_rows.append((label, stat["med"] if stat else None))
    medians = [value for _, value in global_rows if value is not None]
    valle = dict(global_rows).get("Valle 0-6h/22-23h") or (min(medians) if medians else 0.0)
    if medians:
        rows.append({
            "ISP": "Global (todos)",
            "Manana 7-12h": round(dict(global_rows).get("Manana 7-12h") or 0.0, 1),
            "Tarde 13-17h": round(dict(global_rows).get("Tarde 13-17h") or 0.0, 1),
            "Noche 18-21h": round(dict(global_rows).get("Noche 18-21h") or 0.0, 1),
            "Valle 0-6h/22-23h": round(valle, 1),
            "Delta pico vs valle": round(max(medians) - valle, 1),
        })
    return rows


def _jitter_rows(jitter: dict[str, list[float]]) -> list[dict]:
    rows = []
    for isp in _ordered_isps(list(jitter.keys())):
        vals = sorted(float(v) for v in jitter.get(isp, []) if pd.notna(v))
        if not vals:
            continue
        series = pd.Series(vals)
        rows.append({
            "ISP": isp,
            "Jitter mediano": round(float(series.median()), 2),
            "Jitter promedio": round(float(series.mean()), 2),
            "Jitter p95": round(float(series.quantile(0.95, interpolation="nearest")), 2),
            "Jitter maximo": round(float(series.max()), 2),
            "n traceroutes": int(len(vals)),
        })
    return rows


def _weekday_rows(dest: pd.DataFrame) -> list[dict]:
    rows = []
    if dest.empty:
        return rows
    medians = dest.groupby("weekday_num")["rtt"].median().to_dict()
    min_med = min(medians.values()) if medians else None
    max_med = max(medians.values()) if medians else None
    for weekday_num in range(7):
        group = dest[dest["weekday_num"] == weekday_num]
        if group.empty:
            continue
        series = group["rtt"]
        med = float(series.median())
        rows.append({
            "Dia": DOW_ES[weekday_num],
            "Tipo": "Laborable" if weekday_num < 5 else "Fin de semana",
            "Mediana RTT": round(med, 2),
            "Promedio RTT": round(float(series.mean()), 2),
            "StdDev": round(float(series.std()) if len(series) > 1 else 0.0, 2),
            "p95": round(float(series.quantile(0.95, interpolation="nearest")), 2),
            "n paquetes": int(len(series)),
            "Marca": "Mayor mediana" if med == max_med else ("Menor mediana" if med == min_med else ""),
        })
    return rows


def execute(df: pd.DataFrame, inv_id: int) -> dict:
    if df.empty:
        return {"metricas_resumen": {}, "elements": []}
    work = add_identity_columns(df.copy())
    measurements = _measurements(work)
    targets = _public_targets(measurements)
    dest = _destination_packets(work, targets)
    hourly_rows, hourly_keys = _hourly_rows(dest)
    daily_rows = _daily_rows(dest)
    jitter = _jitter_values(dest)
    box_rows = _box_stats(jitter)
    period_rows = _period_rows(dest)
    jitter_table = _jitter_rows(jitter)
    weekday_rows = _weekday_rows(dest)
    jitter_median = statistics.median([row["Jitter mediano"] for row in jitter_table]) if jitter_table else 0.0
    timezone_label = os.getenv("ANALYSIS_TIMEZONE", "America/El_Salvador")

    return {
        "metricas_resumen": {
            "probes": int(dest["prb_id"].nunique()) if not dest.empty else 0,
            "muestras_rtt_destino": int(len(dest)),
            "jitter_estimado": round(float(jitter_median), 2),
            "targets": len(targets),
        },
        "elements": [
            {
                "id": "24",
                "type": "CHART",
                "title": f"RTT mediano por hora del dia por ISP ({timezone_label})",
                "caption": f"Figura 24. RTT mediano por hora del dia por ISP, calculado a partir de los timestamps de RIPE Atlas en {timezone_label}.",
                "kind": "line",
                "categoryKey": "hour",
                "dataKeys": hourly_keys,
                "rows": hourly_rows,
            },
            {
                "id": "25",
                "type": "CHART",
                "title": "Evolucion diaria del RTT al destino (todos los ISPs)",
                "caption": "Figura 25. Evolucion diaria del RTT al destino (todos los ISPs). Barras azules = RTT mediano diario; puntos rojos = promedio +/- desviacion estandar.",
                "kind": "dailyBarLine",
                "categoryKey": "Fecha",
                "dataKey": "RTT mediano diario",
                "rows": daily_rows,
            },
            {
                "id": "4",
                "type": "DATA_TABLE",
                "title": f"RTT mediano por franja horaria por ISP ({timezone_label})",
                "caption": f"Tabla 4. RTT mediano por franja horaria por ISP ({timezone_label}). Delta = diferencia entre el pico maximo y el valle.",
                "columns": ["ISP", "Manana 7-12h", "Tarde 13-17h", "Noche 18-21h", "Valle 0-6h/22-23h", "Delta pico vs valle"],
                "rows": period_rows,
            },
            {
                "id": "26",
                "type": "CHART",
                "title": "Box plot de distribucion de jitter por ISP",
                "caption": "Figura 26. Box plot de distribucion de jitter por ISP. Eje Y limitado a 20 ms para legibilidad.",
                "kind": "boxplot",
                "categoryKey": "isp",
                "dataKey": "value",
                "rows": box_rows,
            },
            {
                "id": "5",
                "type": "DATA_TABLE",
                "title": "Jitter por ISP - mediana, promedio, p95 y maximo",
                "caption": "Tabla 5. Jitter por ISP - mediana, promedio, p95 y maximo (StdDev de paquetes en hop destino por traceroute).",
                "columns": ["ISP", "Jitter mediano", "Jitter promedio", "Jitter p95", "Jitter maximo", "n traceroutes"],
                "rows": jitter_table,
            },
            {
                "id": "6",
                "type": "DATA_TABLE",
                "title": "RTT al destino por dia de la semana (todos los ISPs)",
                "caption": "Tabla 6. RTT al destino por dia de la semana (todos los ISPs). Mayor y menor mediana destacados por marca.",
                "columns": ["Dia", "Tipo", "Mediana RTT", "Promedio RTT", "StdDev", "p95", "n paquetes", "Marca"],
                "rows": weekday_rows,
            },
        ],
    }
