"""Structural academic-report template for NetScope.

This module intentionally contains no measured values. It is the reusable
skeleton derived from the investigation format: sections, expected tables,
figures, titles, captions, and methodology metadata.
"""

from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, List, Optional

class ElementType(Enum):
    CHART = "CHART"
    DATA_TABLE = "DATA_TABLE"
    INTERPRETATION_BLOCK = "INTERPRETATION_BLOCK"

@dataclass
class ReportElement:
    element_type: ElementType
    id: str
    title: str
    description: str = ""
    method: str = ""
    unit: str = ""
    notes: List[str] = field(default_factory=list)
    source: str = ""

DEFAULT_SOURCE = "elaboracion propia con datos procesados por NetScope desde RIPE Atlas"
R_SOURCE = "grafico generado desde R/ggplot2 con datos RIPE Atlas"

REPORT_TEMPLATE: dict[int, dict[str, Any]] = {
    1: {
        "title": "Introduccion",
        "description": "Contexto, objetivos y estructura de la investigacion.",
        "elements": [
            ReportElement(ElementType.INTERPRETATION_BLOCK, "int-1", "Contexto y justificacion"),
            ReportElement(ElementType.INTERPRETATION_BLOCK, "int-2", "Objetivos de la investigacion"),
        ]
    },
    2: {
        "title": "Marco Teorico",
        "description": "Conceptos fundamentales sobre mediciones de red y path inflation.",
        "elements": [
            ReportElement(ElementType.INTERPRETATION_BLOCK, "mt-1", "Fundamentos de medicion en Internet"),
            ReportElement(ElementType.INTERPRETATION_BLOCK, "mt-2", "El fenomeno de Path Inflation"),
        ]
    },
    3: {
        "title": "Metodologia",
        "description": "Diseño de la investigacion, recoleccion de datos y fases de analisis.",
        "elements": [
            ReportElement(ElementType.INTERPRETATION_BLOCK, "met-1", "Diseño metodologico"),
            ReportElement(ElementType.INTERPRETATION_BLOCK, "met-2", "Herramientas y metricas"),
        ]
    },
    4: {
        "title": "Resultados",
        "description": "Hallazgos de las 5 fases de analisis sobre la infraestructura evaluada.",
        "elements": [
            # Fase 1
            ReportElement(ElementType.CHART, "1", "Distribucion de mediciones por direccion IP de destino resuelta"),
            ReportElement(ElementType.CHART, "2", "Detalle de mediciones por categoria de destino"),
            ReportElement(ElementType.CHART, "3", "Detalle de fallas de DNS por sonda"),
            ReportElement(ElementType.CHART, "4", "Registro de periodos de inactividad por sonda"),
            ReportElement(ElementType.CHART, "5", "Tabla analitica de desconexiones por sonda durante la semana de medicion"),
            ReportElement(ElementType.CHART, "6", "Distribucion temporal de mediciones de sondas inestables"),
            ReportElement(ElementType.CHART, "7", "Distribucion de paquetes recibidos por medicion (0, 1, 2 o 3 paquetes respondidos)"),
            ReportElement(ElementType.CHART, "8", "Resumen estadistico de perdida de paquetes a nivel granular"),
            ReportElement(ElementType.CHART, "9", "Sintesis de metricas de disponibilidad de la Fase 1"),
            
            # Fase 2
            ReportElement(ElementType.CHART, "10", "Comparativa de metricas integrales por sonda para la seleccion de la linea base"),
            ReportElement(ElementType.CHART, "11", "Sonda seleccionada como linea base de eficiencia"),
            ReportElement(ElementType.CHART, "12", "Distribucion de latencia de la sonda linea base (histograma de RTT)"),
            ReportElement(ElementType.CHART, "13", "Analisis micro-delta: desglose de latencia por segmento de red"),
            
            # Fase 3
            ReportElement(ElementType.CHART, "14", "Mapa de distribucion de sondas por ISP"),
            ReportElement(ElementType.CHART, "15", "Distribucion de mediciones validas por sistema autonomo (ASN)"),
            ReportElement(ElementType.CHART, "16", "Tabla de sondas, ASNs, paises de registro e ISPs verificados"),
            ReportElement(ElementType.CHART, "17", "Cronologia y duracion de episodios de desconexion por sonda"),
            ReportElement(ElementType.CHART, "18", "Distribucion de mediciones entre las IPs activas del servidor destino"),
            ReportElement(ElementType.CHART, "19", "Comparativa de rutas de backbone hacia cada IP del servidor"),
            ReportElement(ElementType.CHART, "20", "Cronologia de actividad de IPs secundarias durante el estudio"),
            ReportElement(ElementType.CHART, "21", "Comparativa de latencias entre IPs del servidor"),
            
            # Fase 4
            ReportElement(ElementType.CHART, "22", "RTT promedio por hop por ISP hacia el destino. Rutas internacionales"),
            ReportElement(ElementType.DATA_TABLE, "1", "Puntos de Path Inflation — saltos con incremento de RTT > 20 ms, agrupados por ISP en orden ascendente de hop"),
            ReportElement(ElementType.DATA_TABLE, "2", "Nodos criticos con geolocalizacion — rutas principal y secundaria. Δ respecto al nodo geolocalizacion anterior del mismo ISP"),
            ReportElement(ElementType.DATA_TABLE, "3", "Resumen de Path Inflation por ISP — ordenado por overhead descendente"),
            ReportElement(ElementType.CHART, "23", "Overhead de Path Inflation por ISP — barras horizontales ordenadas descendentemente"),
            
            # Fase 5
            ReportElement(ElementType.CHART, "24", "RTT mediano por hora del dia por ISP. Las franjas de color indican periodos de mayor actividad"),
            ReportElement(ElementType.CHART, "25", "Evolucion diaria del RTT al destino (todos los ISPs) — 7 dias de medicion. Barras azules = RTT mediano diario; puntos rojos = promedio ± desviacion estandar"),
            ReportElement(ElementType.DATA_TABLE, "4", "RTT mediano por franja horaria por ISP. Δ = diferencia entre el pico maximo y el valle"),
            ReportElement(ElementType.CHART, "26", "Box plot de distribucion de jitter por ISP"),
            ReportElement(ElementType.DATA_TABLE, "5", "Jitter por ISP — mediana, promedio, p95 y maximo (StdDev de 3 paquetes en hop destino por traceroute)"),
            ReportElement(ElementType.DATA_TABLE, "6", "RTT al destino por dia de la semana (todos los ISPs)"),
        ]
    },
    5: {
        "title": "Discusion",
        "description": "Interpretacion de los resultados y su impacto.",
        "elements": [
            ReportElement(ElementType.INTERPRETATION_BLOCK, "disc-1", "Analisis de hallazgos"),
            ReportElement(ElementType.INTERPRETATION_BLOCK, "disc-2", "Impacto en el servicio"),
        ]
    },
    6: {
        "title": "Conclusiones",
        "description": "Sintesis de la investigacion y recomendaciones.",
        "elements": [
            ReportElement(ElementType.INTERPRETATION_BLOCK, "conc-1", "Conclusiones principales"),
            ReportElement(ElementType.INTERPRETATION_BLOCK, "conc-2", "Trabajo futuro"),
        ]
    },
    7: {
        "title": "Referencias",
        "description": "Fuentes bibliograficas y documentacion de apoyo.",
        "elements": [
            ReportElement(ElementType.INTERPRETATION_BLOCK, "ref-1", "Bibliografia"),
        ]
    },
}


def table_caption(item: ReportElement | dict[str, Any]) -> str:
    if isinstance(item, ReportElement):
        return f"Tabla {item.id}. {item.title}."
    return f"Tabla {item['id']}. {item['title']}."


def figure_caption(item: ReportElement | dict[str, Any]) -> str:
    if isinstance(item, ReportElement):
        return f"Figura {item.id}. {item.title}."
    return f"Figura {item['id']}. {item['title']}."


def iter_elements():
    for chapter in REPORT_TEMPLATE.values():
        yield from chapter.get("elements", [])


def iter_tables():
    for el in iter_elements():
        if el.element_type == ElementType.DATA_TABLE:
            yield el


def iter_figures():
    for el in iter_elements():
        if el.element_type == ElementType.CHART:
            yield el


def table_by_id(table_id: str) -> ReportElement | None:
    return next((el for el in iter_tables() if el.id == table_id), None)


def figure_by_id(figure_id: str) -> ReportElement | None:
    return next((el for el in iter_figures() if el.id == figure_id), None)


def element_to_dict(el: ReportElement) -> dict[str, Any]:
    d = {
        "type": el.element_type.value,
        "id": el.id,
        "title": el.title,
    }
    if el.description:
        d["description"] = el.description
    if el.method:
        d["method"] = el.method
    if el.unit:
        d["unit"] = el.unit
    if el.notes:
        d["notes"] = el.notes

    if el.element_type == ElementType.DATA_TABLE:
        d["caption"] = table_caption(el)
        d["source"] = el.source or DEFAULT_SOURCE
    elif el.element_type == ElementType.CHART:
        d["caption"] = figure_caption(el)
        d["source"] = el.source or DEFAULT_SOURCE
    elif el.source:
        d["source"] = el.source

    return d


def public_report_template() -> dict[str, Any]:
    chapters = []
    for chapter_num, chapter in REPORT_TEMPLATE.items():
        chapters.append({
            "chapter": chapter_num,
            "title": chapter["title"],
            "description": chapter.get("description", ""),
            "elements": [element_to_dict(el) for el in chapter["elements"]]
        })
    return {
        "name": "NetScope academic report template",
        "description": "Plantilla estructural basada en el formato de la investigacion; no contiene datos medidos.",
        "data_policy": "Los titulos, secciones, tablas, figuras y metodos provienen de la plantilla; los valores se calculan exclusivamente desde el JSON RIPE Atlas cargado.",
        "chapters": chapters,
    }

