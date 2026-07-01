import json
import pandas as pd

def parse_ripe_json(filepath: str) -> pd.DataFrame:
    """
    Parses a raw RIPE Atlas Traceroute JSON export and flattens it into a Pandas DataFrame.
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    records = []
    
    for m in data:
        msm_id = m.get("msm_id")
        prb_id = m.get("prb_id")
        timestamp = m.get("timestamp")
        from_ip = m.get("from")
        dst_addr = m.get("dst_addr")
        dst_name = m.get("dst_name")
        
        results = m.get("result", [])
        if not isinstance(results, list):
            continue
            
        for hop_res in results:
            hop = hop_res.get("hop")
            hop_results = hop_res.get("result", [])
            
            if not isinstance(hop_results, list):
                continue
                
            for h in hop_results:
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
                    "hop": hop,
                    "rtt": rtt,
                    "reply_from": reply_from,
                    "is_timeout": is_timeout
                })
                
    return pd.DataFrame(records)
