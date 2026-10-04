"""Verify that an investigation follows the structural academic report template."""

from __future__ import annotations

import argparse
import os
import sys
import json
import urllib.error
import urllib.request
from typing import Any

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.report_template import REPORT_TEMPLATE, figure_caption, table_caption

EXPECTED = {}
for chapter_number, chapter in REPORT_TEMPLATE.items():
    tables = {}
    figures = {}
    for el in chapter.get("elements", []):
        if el.element_type.value == "DATA_TABLE":
            tables[el.id] = el.title
        elif el.element_type.value == "CHART":
            figures[el.id] = el.title
    EXPECTED[chapter_number] = {"tables": tables, "figures": figures}

BAD_TEXT = ("Ãƒ", "Ã‚", "ÃŽ", "ï¿½", "aectura", "aa tabla", "aos ", "aas ")
REQUIRED_TABLE_META = ("caption", "source", "method", "unit", "sample_size")
REQUIRED_FIGURE_META = ("caption", "source", "method", "kind")


def request_json(url: str, *, method: str = "GET", timeout: int = 60) -> dict[str, Any]:
    request = urllib.request.Request(url, method=method)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def walk_strings(value: Any):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for item in value.values():
            yield from walk_strings(item)
    elif isinstance(value, list):
        for item in value:
            yield from walk_strings(item)


def run_phase(base_url: str, investigation_id: int, phase: int) -> None:
    request_json(
        f"{base_url}/api/investigations/{investigation_id}/fases/{phase}",
        method="POST",
        timeout=300,
    )


def expected_caption(kind: str, item_id: str, title: str) -> str:
    item = {"id": item_id, "title": title}
    return table_caption(item) if kind == "tabla" else figure_caption(item)


def verify_titles(phase: int, kind: str, items: list[dict[str, Any]], expected_titles: dict[str, str]) -> list[str]:
    errors: list[str] = []
    for item in items:
        item_id = item.get("id")
        expected_title = expected_titles.get(item_id)
        if not expected_title:
            continue
        if item.get("title") != expected_title:
            errors.append(f"Fase {phase}: {kind} {item_id} titulo {item.get('title')!r} != {expected_title!r}")
        caption = expected_caption(kind, item_id, expected_title)
        if item.get("caption") != caption:
            errors.append(f"Fase {phase}: {kind} {item_id} caption {item.get('caption')!r} != {caption!r}")
    return errors

def verify_template_endpoint(base_url: str) -> list[str]:
    errors: list[str] = []
    payload = request_json(f"{base_url}/api/report-template")

    data_policy = payload.get("data_policy", "")
    if "valores se calculan exclusivamente desde el JSON RIPE Atlas cargado" not in data_policy:
        errors.append("Plantilla: data_policy no deja claro que los valores salen solo del JSON cargado")

    chapters = payload.get("chapters")
    if not isinstance(chapters, list):
        return ["Plantilla: chapters no es una lista valida"]
    if len(chapters) != len(REPORT_TEMPLATE):
        errors.append(f"Plantilla: cantidad de capitulos {len(chapters)} != {len(REPORT_TEMPLATE)}")

    chapters_by_number = {ch.get("chapter"): ch for ch in chapters if isinstance(ch, dict)}
    for chapter_number, expected_chapter in REPORT_TEMPLATE.items():
        public_chapter = chapters_by_number.get(chapter_number)
        if not public_chapter:
            errors.append(f"Plantilla: falta capitulo {chapter_number}")
            continue

        for key in ("title", "description"):
            if public_chapter.get(key) != expected_chapter.get(key):
                errors.append(
                    f"Plantilla capitulo {chapter_number}: {key} {public_chapter.get(key)!r} != {expected_chapter.get(key)!r}"
                )

        expected_elements = expected_chapter.get("elements", [])
        public_elements = public_chapter.get("elements", [])
        if len(public_elements) != len(expected_elements):
            errors.append(f"Plantilla capitulo {chapter_number}: elementos {len(public_elements)} != {len(expected_elements)}")
        
        for expected_el, public_el in zip(expected_elements, public_elements):
            for key in ("id", "title", "method"):
                if getattr(expected_el, key, "") != public_el.get(key, ""):
                    errors.append(f"Plantilla capitulo {chapter_number}: elemento {expected_el.id} {key} incorrecto")

    for text_value in walk_strings(payload):
        if any(marker in text_value for marker in BAD_TEXT):
            errors.append(f"Plantilla: texto con posible mojibake: {text_value[:120]}")
            break

    return errors

def verify_phase(base_url: str, investigation_id: int, phase: int, payload: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    expected = EXPECTED[phase]

    tables = payload.get("report_tables") or []
    figures = payload.get("report_figures") or []
    expected_table_ids = set(expected["tables"].keys())
    expected_figure_ids = set(expected["figures"].keys())
    table_ids = {table.get("id") for table in tables}
    figure_ids = {figure.get("id") for figure in figures}

    missing_tables = expected_table_ids - table_ids
    if missing_tables:
        errors.append(f"Fase {phase}: faltan tablas esperadas {missing_tables}")

    missing_figures = expected_figure_ids - figure_ids
    if missing_figures:
        errors.append(f"Fase {phase}: faltan figuras esperadas {missing_figures}")

    errors.extend(verify_titles(phase, "tabla", tables, expected["tables"]))
    errors.extend(verify_titles(phase, "figura", figures, expected["figures"]))

    if not payload.get("ejecutado_en"):
        errors.append(f"Fase {phase}: resultado sin ejecutado_en")

    for table in tables:
        table_id = table.get("id")
        for key in REQUIRED_TABLE_META:
            if table.get(key) in (None, "", []):
                errors.append(f"Fase {phase}: tabla {table_id} sin {key}")
        columns = table.get("columns")
        rows = table.get("rows")
        if not columns or not isinstance(columns, list) or not isinstance(rows, list):
            errors.append(f"Fase {phase}: tabla {table_id} sin columns/rows validos")
            continue
        if any(not isinstance(row, dict) for row in rows):
            errors.append(f"Fase {phase}: tabla {table_id} contiene filas no estructuradas")
            continue
        
        # Check for empty columns
        if rows:
            for col in columns:
                if all(row.get(col) in (None, "") for row in rows):
                    errors.append(f"Fase {phase}: tabla {table_id} tiene columna '{col}' completamente vacia")

        for row_index, row in enumerate(rows, start=1):
            missing_columns = [column for column in columns if column not in row]
            if missing_columns:
                errors.append(f"Fase {phase}: tabla {table_id} fila {row_index} sin columnas {missing_columns}")
                break

    for figure in figures:
        figure_id = figure.get("id")
        for key in REQUIRED_FIGURE_META:
            if figure.get(key) in (None, "", []):
                errors.append(f"Fase {phase}: figura {figure_id} sin {key}")
        if figure.get("kind") == "png" and not figure.get("url"):
            errors.append(f"Fase {phase}: figura PNG {figure_id} sin url")

    for text in walk_strings(payload):
        if any(marker in text for marker in BAD_TEXT):
            errors.append(f"Fase {phase}: texto con posible mojibake: {text[:120]}")
            break

    return errors


def verify_cross_consistency(payloads: dict[int, dict[str, Any]]) -> list[str]:
    errors = []
    
    # Baseline probe ID in phase 2 = reference in phase 4
    # Wait, Phase 4 table 4.4.2 uses "Linea base" which should map to Phase 2 median
    phase2 = payloads.get(2, {})
    phase4 = payloads.get(4, {})
    if phase2 and phase4:
        p2_probe = phase2.get("metricas_resumen", {}).get("sonda_optima")
        p4_baseline = phase4.get("metricas_resumen", {}).get("linea_base_rtt")
        
        if p2_probe is None or p4_baseline is None:
            errors.append("Inconsistencia cruzada: Falta referencia de linea base entre Fase 2 y Fase 4")
        
        # ensure Overhead vs Baseline are two distinct columns
        p4_table = next((t for t in phase4.get("report_tables", []) if t.get("id") == "4.4.2"), None)
        if p4_table:
            cols = p4_table.get("columns", [])
            has_overhead = any("overhead" in c.lower() for c in cols)
            has_baseline = any("linea base" in c.lower() for c in cols)
            if not (has_overhead and has_baseline):
                errors.append("Fase 4: Overhead y Linea base deben ser columnas distintas en tabla 4.4.2")
                
    # verify 3 sources for foreign ASN in phase 3
    phase3 = payloads.get(3, {})
    if phase3:
        p3_table = next((t for t in phase3.get("report_tables", []) if t.get("id") == "4.3.1"), None)
        if p3_table:
            for row in p3_table.get("rows", []):
                pais = row.get("Pais registro", "SV")
                if pais not in ("SV", "N/D"):
                    sources = row.get("IPs origen", 0)
                    if sources < 3:
                        errors.append(f"Fase 3: ASN extranjero {row.get('ASN')} tiene solo {sources} sources (se esperaban >= 3)")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument("--investigation-id", type=int, required=True)
    parser.add_argument(
        "--run-phases",
        action="store_true",
        help="Ejecuta POST de las fases 1-5 antes de verificar el contrato.",
    )
    args = parser.parse_args()
    base_url = args.base_url.rstrip("/")

    all_errors: list[str] = []
    try:
        all_errors.extend(verify_template_endpoint(base_url))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        all_errors.append(f"Plantilla: no se pudo consultar/verificar: {exc}")

    payloads = {}
    for phase in EXPECTED:
        try:
            if args.run_phases:
                print(f"Ejecutando fase {phase}...")
                run_phase(base_url, args.investigation_id, phase)
            payload = request_json(f"{base_url}/api/investigations/{args.investigation_id}/fases/{phase}")
            payloads[phase] = payload
            all_errors.extend(verify_phase(base_url, args.investigation_id, phase, payload))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            all_errors.append(f"Fase {phase}: no se pudo consultar/verificar: {exc}")

    all_errors.extend(verify_cross_consistency(payloads))

    if all_errors:
        print("REPORT CONTRACT FAILED")
        for error in all_errors:
            print(f"- {error}")
        return 1

    print("REPORT CONTRACT OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
