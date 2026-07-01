import pandas as pd
from services.r_bridge import run_r_script_fase2

def execute(df: pd.DataFrame, inv_id: int) -> dict:
    df['rtt'] = pd.to_numeric(df['rtt'], errors='coerce')
    return run_r_script_fase2(df.dropna(subset=['rtt']), inv_id)
