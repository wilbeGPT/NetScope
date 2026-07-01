import pandas as pd
from services.r_bridge import run_r_script_fase1

def execute(df: pd.DataFrame, inv_id: int) -> dict:
    """
    Prepares the data funnel for Phase 1 (Data Integrity & Availability)
    """
    summary = []
    
    for (prb_id, dst_addr), group in df.groupby(['prb_id', 'dst_addr']):
        total_packets = len(group)
        timeouts = group['is_timeout'].sum()
        successful = total_packets - timeouts
        
        summary.append({
            "prb_id": prb_id,
            "dst_addr": dst_addr,
            "total_packets": total_packets,
            "successful_packets": successful,
            "timeouts": timeouts
        })
        
    df_summary = pd.DataFrame(summary)
    
    return run_r_script_fase1(df_summary, inv_id)
