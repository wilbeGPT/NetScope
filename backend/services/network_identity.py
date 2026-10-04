import ipaddress
import re
from collections import Counter
from functools import lru_cache
from typing import Any

import pandas as pd

try:
    import requests
except ImportError:  # Optional enrichment dependency; core analysis must still run without it.
    requests = None

UNKNOWN_COUNTRY = "N/D"


def _safe_ip(value: Any) -> str | None:
    if pd.isna(value):
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        ipaddress.ip_address(text)
        return text
    except ValueError:
        return None


def _safe_probe_label(prb_id: Any) -> str:
    if pd.isna(prb_id):
        return "Probe N/D"
    text = str(prb_id).strip()
    return f"Probe {text or 'N/D'}"


def _safe_probe_int(prb_id: Any) -> int | None:
    try:
        if pd.isna(prb_id):
            return None
        return int(float(str(prb_id).strip()))
    except (TypeError, ValueError):
        return None


def _parse_asn(as_value: str | None) -> tuple[str, str]:
    if not as_value:
        return "N/D", "N/D"
    text = str(as_value).strip()
    match = re.match(r"^(AS\d+)\s*(.*)$", text)
    if not match:
        return "N/D", text or "N/D"
    return match.group(1), match.group(2).strip() or "N/D"


def extract_rdap_country(data: dict) -> str:
    if "country" in data:
        return str(data["country"])
    for entity in data.get("entities", []):
        if "vcardArray" in entity:
            vcard_array = entity["vcardArray"]
            if len(vcard_array) > 1:
                for item in vcard_array[1]:
                    if item[0] == "adr":
                        try:
                            country = item[3][6]
                            if country:
                                return str(country)
                        except (IndexError, TypeError):
                            pass
    return "N/D"


@lru_cache(maxsize=512)
def lookup_rdap_asn(asn: str) -> tuple[str, str]:
    if requests is None:
        return "N/D", "N/D"
    asn_num = str(asn).replace("AS", "").strip()
    if not asn_num.isdigit():
        return "N/D", "N/D"
    # IANA RDAP does not delegate every ASN registry consistently. RIPEstat
    # exposes the current holder for all of them and is a better source for
    # a stable, data-driven ISP grouping.
    try:
        response = requests.get(
            f"https://stat.ripe.net/data/as-overview/data.json?resource=AS{asn_num}",
            timeout=5,
        )
        if response.status_code == 200:
            data = response.json().get("data", {})
            holder = str(data.get("holder") or "").strip()
            holder = re.sub(rf"^AS{re.escape(asn_num)}\s*-\s*", "", holder, flags=re.IGNORECASE)
            if holder:
                return holder, str(data.get("country") or "N/D")
    except Exception:
        pass
    try:
        url = f"https://rdap.org/autnum/{asn_num}"
        resp = requests.get(url, timeout=5, allow_redirects=True)
        if resp.status_code == 200:
            data = resp.json()
            as_name = data.get("name", "N/D")
            country = extract_rdap_country(data)
            return as_name, country
    except Exception:
        pass
    return "N/D", "N/D"


@lru_cache(maxsize=512)
def lookup_probe_metadata(prb_id: int) -> dict[str, Any]:
    if requests is None:
        return {"asn": "N/D", "country_code": "N/D"}
    try:
        url = f"https://atlas.ripe.net/api/v2/probes/{prb_id}/"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            asn_v4 = data.get("asn_v4")
            asn_v4_str = f"AS{asn_v4}" if asn_v4 else "N/D"
            country_code = data.get("country_code", "N/D")
            return {"asn": asn_v4_str, "country_code": country_code or "N/D"}
    except Exception:
        pass
    return {"asn": "N/D", "country_code": "N/D"}



def resolve_probe_identities(df: pd.DataFrame) -> dict[Any, dict[str, Any]]:
    identities: dict[Any, dict[str, Any]] = {}
    if df.empty or "prb_id" not in df:
        return identities

    for prb_id, group in df.groupby("prb_id", dropna=False):
        ips = [_safe_ip(ip) for ip in group.get("probe_ip", pd.Series(dtype="object")).dropna().unique()]
        ips = [ip for ip in ips if ip]
        is_all_local = False
        if ips:
            parsed_ips = [ipaddress.ip_address(ip) for ip in ips]
            is_all_local = all((p.is_private or p.is_loopback or p.is_link_local) for p in parsed_ips)

        probe_int = _safe_probe_int(prb_id)
        if is_all_local:
            isp = "Red local/LAN"
            asn = "N/D"
            as_name = "Red local/LAN"
            country_code = "SV"
            rdap_country = "SV"
        elif probe_int is not None:
            meta = lookup_probe_metadata(probe_int)
            asn = meta["asn"]
            country_code = meta["country_code"]
            as_name, rdap_country = lookup_rdap_asn(asn)
            isp = as_name
        else:
            isp = "N/D"
            asn = "N/D"
            as_name = "N/D"
            country_code = "N/D"
            rdap_country = "N/D"

        asn_extranjero = False
        if country_code != "N/D" and rdap_country != "N/D":
            if country_code.upper() != rdap_country.upper():
                asn_extranjero = True

        if isp != "N/D" and asn != "N/D":
            label = f"{isp} ({asn})"
        elif isp != "N/D":
            label = isp
        else:
            label = _safe_probe_label(prb_id)

        identities[prb_id] = {
            "probe": _safe_probe_label(prb_id),
            "label": label,
            "isp": isp,
            "asn": asn,
            "as_name": as_name,
            "country": rdap_country if rdap_country != "N/D" else country_code,
            "country_code": country_code,
            "rdap_country": rdap_country,
            "asn_extranjero": asn_extranjero,
            "ips": ips,
            "ip_count": len(set(ips)),
            "dynamic_ip": len(set(ips)) > 1,
            "country_codes": country_code,
        }
    return identities


def add_identity_columns(df: pd.DataFrame) -> pd.DataFrame:
    work = df.copy()
    if "prb_id" not in work.columns:
        return work

    identities = resolve_probe_identities(work)

    def value_for(prb_id: Any, key: str, fallback: str = "N/D") -> Any:
        identity = identities.get(prb_id, {})
        return identity.get(key, fallback)

    work["identity_label"] = work["prb_id"].map(lambda p: value_for(p, "label", _safe_probe_label(p)))
    work["identity_isp"] = work["prb_id"].map(lambda p: value_for(p, "isp"))
    work["identity_asn"] = work["prb_id"].map(lambda p: value_for(p, "asn"))
    work["identity_country"] = work["prb_id"].map(lambda p: value_for(p, "country"))
    work["identity_country_code"] = work["prb_id"].map(lambda p: value_for(p, "country_code"))
    return work
