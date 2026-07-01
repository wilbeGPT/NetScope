import pandas as pd
from services.r_bridge import run_r_script_fase3

def execute(df: pd.DataFrame, inv_id: int) -> dict:
    return run_r_script_fase3(df, inv_id)
