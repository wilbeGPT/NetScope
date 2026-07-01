import rpy2.robjects as robjects
from rpy2.robjects import pandas2ri
import pandas as pd
import os

pandas2ri.activate()

def _run_r_script(script_name: str, function_name: str, df: pd.DataFrame, output_path: str) -> dict:
    script_path = os.path.join(os.path.dirname(__file__), f"../phases/r/{script_name}")
    robjects.r.source(script_path)
    r_func = robjects.globalenv[function_name]
    r_df = pandas2ri.py2rpy(df)
    
    if output_path:
        res = r_func(r_df, output_path)
    else:
        res = r_func(r_df)
        
    return dict(zip(res.names, list(res)))

def run_r_script_fase1(df_summary: pd.DataFrame, inv_id: int) -> dict:
    output = f"./data/exports/fase1_plot_{inv_id}.png"
    res_dict = _run_r_script("fase1_disponibilidad.R", "generate_fase1_report", df_summary, output)
    return {
        "metricas_resumen": {
            "total_intentos": int(res_dict.get("total_intentos", [0])[0]),
            "mediciones_reales": int(res_dict.get("mediciones_reales", [0])[0]),
            "dns_exitoso": int(res_dict.get("dns_exitoso", [0])[0]),
            "disponibilidad_pct": float(res_dict.get("disponibilidad_pct", [0.0])[0])
        },
        "series_chart": [], "tabla": [], "boxplot": None,
        "grafica_png_url": f"/exports/fase1_plot_{inv_id}.png"
    }

def run_r_script_fase2(df: pd.DataFrame, inv_id: int) -> dict:
    output = f"./data/exports/fase2_plot_{inv_id}.png"
    res_dict = _run_r_script("fase2_linea_base.R", "generate_fase2_report", df, output)
    return {
        "metricas_resumen": {
            "sonda_optima": str(res_dict.get("sonda_optima", [""])[0]),
            "rtt_minimo": float(res_dict.get("rtt_minimo", [0.0])[0]),
            "rtt_promedio": float(res_dict.get("rtt_promedio", [0.0])[0])
        },
        "series_chart": [], "tabla": [], "boxplot": None,
        "grafica_png_url": f"/exports/fase2_plot_{inv_id}.png"
    }

def run_r_script_fase3(df: pd.DataFrame, inv_id: int) -> dict:
    output = f"./data/exports/fase3_plot_{inv_id}.png"
    res_dict = _run_r_script("fase3_mapeo_asn.R", "generate_fase3_report", df, output)
    return {
        "metricas_resumen": {
            "total_asns": int(res_dict.get("total_asns", [0])[0]),
            "asns_extranjeros": int(res_dict.get("asns_extranjeros", [0])[0])
        },
        "series_chart": [], "tabla": [], "boxplot": None,
        "grafica_png_url": f"/exports/fase3_plot_{inv_id}.png"
    }

def run_r_script_fase4(df: pd.DataFrame, inv_id: int, nodes_table: list, rtt_series: list, anomalias: int) -> dict:
    output = f"./data/exports/fase4_plot_{inv_id}.png"
    res_dict = _run_r_script("fase4_path_inflation.R", "generate_fase4_report", df, output)
    return {
        "metricas_resumen": {
            "probes": int(res_dict.get("probes", [0])[0]),
            "targets": int(res_dict.get("targets", [0])[0]),
            "anomalias": anomalias
        },
        "series_chart": rtt_series,
        "tabla": nodes_table,
        "boxplot": None,
        "grafica_png_url": f"/exports/fase4_plot_{inv_id}.png"
    }

def run_r_script_fase5(df: pd.DataFrame, inv_id: int, boxplot_data: list) -> dict:
    output = f"./data/exports/fase5_plot_{inv_id}.png"
    res_dict = _run_r_script("fase5_jitter.R", "generate_fase5_report", df, output)
    return {
        "metricas_resumen": {},
        "series_chart": [],
        "tabla": [],
        "boxplot": boxplot_data,
        "grafica_png_url": f"/exports/fase5_plot_{inv_id}.png"
    }
