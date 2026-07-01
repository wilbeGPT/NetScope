import pandas as pd
import requests
from sqlalchemy.orm import Session
from core.models import IPGeolocationCache
from services.r_bridge import run_r_script_fase4

def get_geolocation(ip: str, db: Session) -> dict:
    if not ip or ip.startswith("192.168.") or ip.startswith("10.") or ip.startswith("172."):
        return {"country": "El Salvador", "countryCode": "SV", "owner": "Red Local (LAN)", "category": "local"}
        
    cache = db.query(IPGeolocationCache).filter(IPGeolocationCache.ip == ip).first()
    if cache:
        return {
            "country": cache.country,
            "countryCode": cache.country_code,
            "owner": cache.owner,
            "category": cache.category
        }
        
    try:
        res = requests.get(f"http://ip-api.com/json/{ip}", timeout=5)
        if res.status_code == 200:
            data = res.json()
            if data.get("status") == "success":
                country = data.get("country", "Desconocido")
                country_code = data.get("countryCode", "UN")
                owner = data.get("isp", "Desconocido")
                
                category = "backbone"
                if country_code == "SV":
                    category = "local"
                elif country_code in ["GT", "HN", "NI", "CR", "PA", "BZ"]:
                    category = "regional"
                    
                new_cache = IPGeolocationCache(
                    ip=ip,
                    country=country,
                    country_code=country_code,
                    owner=owner,
                    category=category
                )
                db.add(new_cache)
                db.commit()
                
                return {"country": country, "countryCode": country_code, "owner": owner, "category": category}
    except Exception:
        pass
        
    return {"country": "Desconocido", "countryCode": "UN", "owner": "Desconocido", "category": "backbone"}

def execute(df: pd.DataFrame, inv_id: int, db: Session) -> dict:
    df['rtt'] = pd.to_numeric(df['rtt'], errors='coerce')
    avg_rtt = df.dropna(subset=['rtt']).groupby(['prb_id', 'hop'])['rtt'].mean().reset_index()
    
    rtt_series_dict = {}
    
    nodes_table = []
    anomalias = 0
    
    for prb_id, group in avg_rtt.groupby('prb_id'):
        group = group.sort_values('hop')
        isp_name = f"AS-{prb_id}" # Simulado por ahora hasta mapeo Fase 3
        
        prev_rtt = 0
        for _, row in group.iterrows():
            hop = int(row['hop'])
            rtt = float(row['rtt'])
            
            # Formateo para Recharts
            if hop not in rtt_series_dict:
                rtt_series_dict[hop] = {"hop": hop}
            rtt_series_dict[hop][isp_name] = rtt
            
            # Detectar Path Inflation (>20ms delta)
            delta = rtt - prev_rtt
            if delta > 20:
                anomalias += 1
                ip_row = df[(df['prb_id'] == prb_id) & (df['hop'] == hop)].first_valid_index()
                ip = df.loc[ip_row, 'reply_from'] if ip_row is not None else ""
                
                if ip:
                    geo = get_geolocation(ip, db)
                    nodes_table.append({
                        "isp": isp_name,
                        "hop": hop,
                        "ip": ip,
                        "owner": geo["owner"],
                        "country": geo["country"],
                        "countryCode": geo["countryCode"],
                        "category": geo["category"],
                        "rttAvg": rtt,
                        "delta": delta
                    })
            prev_rtt = rtt
            
    rtt_series = sorted(list(rtt_series_dict.values()), key=lambda x: x["hop"])
    
    return run_r_script_fase4(avg_rtt, inv_id, nodes_table, rtt_series, anomalias)
