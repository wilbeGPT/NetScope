import json
from typing import Any

import pandas as pd


def load_ripe_measurements(filepath: str) -> list[dict[str, Any]]:
    """Load RIPE Atlas exports stored as JSON arrays, single objects, or JSON Lines."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read().strip()

    if not content:
        return []

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        measurements = []
        for line_number, line in enumerate(content.splitlines(), start=1):
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"Invalid JSON on line {line_number} of {filepath}: {exc}") from exc
            if isinstance(item, dict):
                measurements.append(item)
        return measurements

    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    if isinstance(data, dict):
        return [data]
    return []


def validate_ripe_traceroute_measurements(measurements: list[dict[str, Any]]) -> None:
    """Reject JSON files that are not RIPE Atlas traceroute result exports."""
    if not measurements:
        raise ValueError("El archivo no contiene mediciones RIPE Atlas.")

    required = {"prb_id", "timestamp", "result"}
    valid = [item for item in measurements if required.issubset(item)]
    if not valid:
        fields = ", ".join(sorted(required))
        raise ValueError(
            "El JSON no tiene el esquema de resultados traceroute de RIPE Atlas. "
            f"Se requieren los campos: {fields}."
        )


def parse_ripe_json(filepath: str) -> pd.DataFrame:
    """
    Parses a raw RIPE Atlas Traceroute JSON export and flattens it into a Pandas DataFrame.
    """
    data = load_ripe_measurements(filepath)
    validate_ripe_traceroute_measurements(data)

    records = []

    for m in data:
        msm_id = m.get("msm_id")
        prb_id = m.get("prb_id")
        timestamp = m.get("timestamp")
        from_ip = m.get("from")
        dst_addr = m.get("dst_addr")
        dst_name = m.get("dst_name")
        ttr = m.get("ttr")
        destination_ip_responded = m.get("destination_ip_responded")

        results = m.get("result", [])
        hop_count = len(results) if isinstance(results, list) else 0
        if not isinstance(results, list) or len(results) == 0:
            # If no results, we still record the measurement attempt
            records.append({
                "msm_id": msm_id,
                "prb_id": prb_id,
                "timestamp": timestamp,
                "probe_ip": from_ip,
                "dst_addr": dst_addr,
                "dst_name": dst_name,
                "ttr": ttr,
                "hop_count": hop_count,
                "destination_ip_responded": destination_ip_responded,
                "hop": None,
                "rtt": None,
                "reply_from": None,
                "is_timeout": True
            })
            continue

        added_any_hop = False
        for hop_res in results:
            if not isinstance(hop_res, dict):
                continue

            hop = hop_res.get("hop")
            hop_results = hop_res.get("result", [])

            if not isinstance(hop_results, list) or len(hop_results) == 0:
                if "error" in hop_res or "x" in hop_res:
                    # Still record the hop error/timeout
                    records.append({
                        "msm_id": msm_id,
                        "prb_id": prb_id,
                        "timestamp": timestamp,
                        "probe_ip": from_ip,
                        "dst_addr": dst_addr,
                        "dst_name": dst_name,
                        "ttr": ttr,
                        "hop_count": hop_count,
                        "destination_ip_responded": destination_ip_responded,
                        "hop": hop,
                        "rtt": None,
                        "reply_from": None,
                        "is_timeout": True
                    })
                    added_any_hop = True
                continue

            for h in hop_results:
                if not isinstance(h, dict):
                    continue

                rtt = h.get("rtt")
                reply_from = h.get("from")
                is_timeout = h.get("x") == "*"

                records.append({
                    "msm_id": msm_id,
                    "prb_id": prb_id,
                    "timestamp": timestamp,
                    "probe_ip": from_ip,
                    "dst_addr": dst_addr,
                    "dst_name": dst_name,
                    "ttr": ttr,
                    "hop_count": hop_count,
                    "destination_ip_responded": destination_ip_responded,
                    "hop": hop,
                    "rtt": rtt,
                    "reply_from": reply_from,
                    "is_timeout": is_timeout
                })
                added_any_hop = True
                
        if not added_any_hop:
            records.append({
                "msm_id": msm_id,
                "prb_id": prb_id,
                "timestamp": timestamp,
                "probe_ip": from_ip,
                "dst_addr": dst_addr,
                "dst_name": dst_name,
                "ttr": ttr,
                "hop_count": hop_count,
                "destination_ip_responded": destination_ip_responded,
                "hop": None,
                "rtt": None,
                "reply_from": None,
                "is_timeout": True
            })

    return pd.DataFrame(records)
