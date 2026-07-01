import pandas as pd
from services.r_bridge import run_r_script_fase5

def execute(df: pd.DataFrame, inv_id: int) -> dict:
    df['rtt'] = pd.to_numeric(df['rtt'], errors='coerce')
    clean = df.dropna(subset=['rtt'])
    
    boxplot_data = []
    colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
    
    for i, (prb_id, group) in enumerate(clean.groupby('prb_id')):
        rtts = group['rtt'].sort_values()
        if len(rtts) == 0: continue
        
        q1 = rtts.quantile(0.25)
        med = rtts.quantile(0.5)
        q3 = rtts.quantile(0.75)
        iqr = q3 - q1
        
        lower = max(rtts.min(), q1 - 1.5 * iqr)
        upper = min(rtts.max(), q3 + 1.5 * iqr)
        outliers = rtts[(rtts < lower) | (rtts > upper)].tolist()
        
        boxplot_data.append({
            "isp": f"AS-{prb_id}",
            "min": float(lower),
            "q1": float(q1),
            "median": float(med),
            "q3": float(q3),
            "max": float(upper),
            "outliers": [float(x) for x in outliers],
            "color": colors[i % len(colors)]
        })
        
    return run_r_script_fase5(clean, inv_id, boxplot_data)
