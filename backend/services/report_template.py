"""Structural academic-report template for NetScope.

This module contains the reusable structural skeleton and academic text derived
from the investigation: sections, expected tables, figures, titles, captions,
and methodology metadata. Dynamic measured values are computed at runtime from
the uploaded RIPE Atlas measurement JSON.
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
    content: str = ""
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
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "1.1",
                "1.1 Contexto y motivacion",
                description=(
                    "El acceso a plataformas de educacion en linea se ha consolidado como un pilar "
                    "fundamental de la educacion universitaria en El Salvador, particularmente tras "
                    "la aceleracion digital impulsada por la pandemia de COVID-19. Sin embargo, la calidad "
                    "de esta experiencia depende de manera directa y critica de la eficiencia de la "
                    "infraestructura de conectividad a Internet que cada estudiante tiene disponible "
                    "desde su hogar o lugar de trabajo.\n\n"
                    "Un fenomeno ampliamente documentado en redes de paises en desarrollo es el Path "
                    "Inflation: el trafico generado en el mismo pais —y cuyo destino tambien esta en el "
                    "mismo pais— viaja miles de kilometros hacia nodos de intercambio internacionales "
                    "(como el NAP de las Americas en Miami, EE.UU.) antes de ser devuelto al destino "
                    "local. Este recorrido redundante incrementa la latencia innecesariamente, degrada "
                    "la experiencia del usuario y representa un desperdicio de ancho de banda internacional."
                ),
                content=(
                    "El acceso a plataformas de educacion en linea se ha consolidado como un pilar "
                    "fundamental de la educacion universitaria en El Salvador, particularmente tras "
                    "la aceleracion digital impulsada por la pandemia de COVID-19. Sin embargo, la calidad "
                    "de esta experiencia depende de manera directa y critica de la eficiencia de la "
                    "infraestructura de conectividad a Internet que cada estudiante tiene disponible "
                    "desde su hogar o lugar de trabajo.\n\n"
                    "Un fenomeno ampliamente documentado en redes de paises en desarrollo es el Path "
                    "Inflation: el trafico generado en el mismo pais —y cuyo destino tambien esta en el "
                    "mismo pais— viaja miles de kilometros hacia nodos de intercambio internacionales "
                    "(como el NAP de las Americas en Miami, EE.UU.) antes de ser devuelto al destino "
                    "local. Este recorrido redundante incrementa la latencia innecesariamente, degrada "
                    "la experiencia del usuario y representa un desperdicio de ancho de banda internacional."
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "1.2",
                "1.2 Pregunta de investigacion",
                description=(
                    "¿En que medida la infraestructura de routing de los proveedores de Internet en "
                    "El Salvador introduce Path Inflation sobre las conexiones hacia la plataforma de "
                    "educacion en linea webdesktop.ufg.edu.sv, y cual es su impacto cuantificable sobre "
                    "la latencia experimentada por los estudiantes universitarios?"
                ),
                content=(
                    "¿En que medida la infraestructura de routing de los proveedores de Internet en "
                    "El Salvador introduce Path Inflation sobre las conexiones hacia la plataforma de "
                    "educacion en linea webdesktop.ufg.edu.sv, y cual es su impacto cuantificable sobre "
                    "la latencia experimentada por los estudiantes universitarios?"
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "1.3",
                "1.3 Hipotesis de trabajo",
                description=(
                    "El trafico de red originado desde multiples ISPs salvadoreños hacia el servidor "
                    "webdesktop.ufg.edu.sv es enrutado a traves de nodos de intercambio ubicados fuera del "
                    "territorio nacional (principalmente en Miami o Guatemala) antes de retornar al destino, "
                    "lo que resulta en una latencia artificialmente elevada en comparacion con la latencia "
                    "teorica optima calculable sobre la base de la distancia geografica real."
                ),
                content=(
                    "El trafico de red originado desde multiples ISPs salvadoreños hacia el servidor "
                    "webdesktop.ufg.edu.sv es enrutado a traves de nodos de intercambio ubicados fuera del "
                    "territorio nacional (principalmente en Miami o Guatemala) antes de retornar al destino, "
                    "lo que resulta en una latencia artificialmente elevada en comparacion con la latencia "
                    "teorica optima calculable sobre la base de la distancia geografica real."
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "1.4",
                "1.4 Objetivos de la investigacion (General y especificos)",
                description=(
                    "Objetivo General:\n"
                    "Demostrar y cuantificar el fenomeno de Path Inflation en las rutas de red de los ISPs "
                    "salvadoreños hacia la infraestructura universitaria de la UFG, identificando sus causas "
                    "estructurales y su impacto sobre la experiencia academica del estudiante.\n\n"
                    "Objetivos Especificos:\n"
                    "• Medir la disponibilidad y la perdida de paquetes (Packet Loss) hacia webdesktop.ufg.edu.sv "
                    "durante 14 dias de medicion distribuida.\n"
                    "• Establecer matematicamente una linea base de eficiencia de red (latencia optima alcanzable) "
                    "con base en las sondas de mejor desempeño.\n"
                    "• Identificar y clasificar todos los ISPs participantes segun su sistema autonomo (ASN) y su "
                    "pais de registro.\n"
                    "• Rastrear los nodos de transito internacional por los que transita el trafico de cada ISP y "
                    "cuantificar el overhead de latencia que introducen.\n"
                    "• Analizar la variabilidad temporal de la latencia (jitter) para determinar si el Path "
                    "Inflation se agrava en horas pico de uso academico."
                ),
                content=(
                    "Objetivo General:\n"
                    "Demostrar y cuantificar el fenomeno de Path Inflation en las rutas de red de los ISPs "
                    "salvadoreños hacia la infraestructura universitaria de la UFG, identificando sus causas "
                    "estructurales y su impacto sobre la experiencia academica del estudiante.\n\n"
                    "Objetivos Especificos:\n"
                    "• Medir la disponibilidad y la perdida de paquetes (Packet Loss) hacia webdesktop.ufg.edu.sv "
                    "durante 14 dias de medicion distribuida.\n"
                    "• Establecer matematicamente una linea base de eficiencia de red (latencia optima alcanzable) "
                    "con base en las sondas de mejor desempeño.\n"
                    "• Identificar y clasificar todos los ISPs participantes segun su sistema autonomo (ASN) y su "
                    "pais de registro.\n"
                    "• Rastrear los nodos de transito internacional por los que transita el trafico de cada ISP y "
                    "cuantificar el overhead de latencia que introducen.\n"
                    "• Analizar la variabilidad temporal de la latencia (jitter) para determinar si el Path "
                    "Inflation se agrava en horas pico de uso academico."
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "1.5",
                "1.5 Estructura del documento",
                description=(
                    "El presente informe de investigacion se estructura en siete capitulos correlativos:\n"
                    "• Capitulo 1: Introduccion — Presenta el contexto, motivacion, pregunta de investigacion, "
                    "hipotesis y objetivos del estudio.\n"
                    "• Capitulo 2: Marco Teorico — Expone los fundamentos conceptuales sobre protocolos IPv4/IPv6, "
                    "el fenomeno de Path Inflation y Tromboning, estandares de medicion (RFC 2330 y RFC 2681), la "
                    "plataforma RIPE Atlas, el contexto de infraestructura en El Salvador y la Calidad de Experiencia (QoE).\n"
                    "• Capitulo 3: Metodologia — Detalla el diseño experimental basado en RIPE Atlas, los parametros "
                    "tecnicos de medicion (TCP 443, spread, Paris Traceroute), la representatividad de la muestra de sondas, "
                    "el plan de analisis en cinco fases y las fuentes de verificacion externa (RDAP, BGPView, PeeringDB).\n"
                    "• Capitulo 4: Resultados — Desarrolla cronologicamente las cinco fases analiticas (Integridad, "
                    "Linea Base, Mapeo de ASNs, Demostracion de Path Inflation y Estabilidad Temporal) respaldadas por "
                    "26 figuras y 6 tablas de datos.\n"
                    "• Capitulo 5: Discusion — Analiza las implicaciones estructurales de la fragmentacion de ASNs, el "
                    "impacto en la educacion en linea y la necesidad de IXPs locales y acuerdos de peering.\n"
                    "• Capitulo 6: Conclusiones — Sintetiza los hallazgos relativos a la infraestructura de destino, el "
                    "comportamiento de los proveedores y la validacion de la hipotesis de investigacion.\n"
                    "• Capitulo 7: Referencias — Recopila los datasets primarios, fuentes de verificacion, estandares "
                    "IETF y literatura cientifica de referencia."
                ),
                content=(
                    "El presente informe de investigacion se estructura en siete capitulos correlativos:\n"
                    "• Capitulo 1: Introduccion — Presenta el contexto, motivacion, pregunta de investigacion, "
                    "hipotesis y objetivos del estudio.\n"
                    "• Capitulo 2: Marco Teorico — Expone los fundamentos conceptuales sobre protocolos IPv4/IPv6, "
                    "el fenomeno de Path Inflation y Tromboning, estandares de medicion (RFC 2330 y RFC 2681), la "
                    "plataforma RIPE Atlas, el contexto de infraestructura en El Salvador y la Calidad de Experiencia (QoE).\n"
                    "• Capitulo 3: Metodologia — Detalla el diseño experimental basado en RIPE Atlas, los parametros "
                    "tecnicos de medicion (TCP 443, spread, Paris Traceroute), la representatividad de la muestra de sondas, "
                    "el plan de analisis en cinco fases y las fuentes de verificacion externa (RDAP, BGPView, PeeringDB).\n"
                    "• Capitulo 4: Resultados — Desarrolla cronologicamente las cinco fases analiticas (Integridad, "
                    "Linea Base, Mapeo de ASNs, Demostracion de Path Inflation y Estabilidad Temporal) respaldadas por "
                    "26 figuras y 6 tablas de datos.\n"
                    "• Capitulo 5: Discusion — Analiza las implicaciones estructurales de la fragmentacion de ASNs, el "
                    "impacto en la educacion en linea y la necesidad de IXPs locales y acuerdos de peering.\n"
                    "• Capitulo 6: Conclusiones — Sintetiza los hallazgos relativos a la infraestructura de destino, el "
                    "comportamiento de los proveedores y la validacion de la hipotesis de investigacion.\n"
                    "• Capitulo 7: Referencias — Recopila los datasets primarios, fuentes de verificacion, estandares "
                    "IETF y literatura cientifica de referencia."
                ),
            ),
        ],
    },
    2: {
        "title": "Marco Teorico",
        "description": "Conceptos fundamentales sobre mediciones de red y path inflation.",
        "elements": [
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "2.1",
                "2.1 Evolucion de protocolos: Coexistencia IPv4 e IPv6",
                description=(
                    "El protocolo de Internet version 4 (IPv4), diseñado hace mas de cuatro decadas, enfrenta "
                    "limitaciones estructurales criticas derivadas del agotamiento de su espacio de direccionamiento "
                    "de 32 bits. Para solventar esta problematica, el Internet Engineering Task Force (IETF) diseño "
                    "el protocolo IPv6, que amplia el espacio de direcciones a 128 bits y optimiza elementos "
                    "arquitectonicos del enrutamiento. No obstante, la transicion global hacia IPv6 ha sido gradual "
                    "y heterogenea, particularmente en economias emergentes como El Salvador, donde predomina un "
                    "modelo de coexistencia conocido como Dual-Stack, en el que ambos protocolos operan simultaneamente.\n\n"
                    "Diversos estudios, como el de Huston (2022), evidencian que el rendimiento relativo entre IPv4 e "
                    "IPv6 no es intrinsecamente superior en uno u otro caso, sino que depende de factores como la "
                    "optimizacion del enrutamiento, politicas de los proveedores de servicios de Internet (ISP) y la "
                    "madurez de la infraestructura. En contextos donde IPv6 aun no cuenta con rutas plenamente optimizadas, "
                    "pueden observarse fenomenos de enrutamiento suboptimal, lo que impacta directamente en metricas "
                    "como la latencia y el jitter. En este sentido, la coexistencia de ambos protocolos introduce "
                    "variabilidad en el rendimiento de la red, constituyendose en un factor relevante al analizar "
                    "fenomenos como el path inflation, especialmente en regiones donde la infraestructura de interconexion "
                    "local es limitada."
                ),
                content=(
                    "El protocolo de Internet version 4 (IPv4), diseñado hace mas de cuatro decadas, enfrenta "
                    "limitaciones estructurales criticas derivadas del agotamiento de su espacio de direccionamiento "
                    "de 32 bits. Para solventar esta problematica, el Internet Engineering Task Force (IETF) diseño "
                    "el protocolo IPv6, que amplia el espacio de direcciones a 128 bits y optimiza elementos "
                    "arquitectonicos del enrutamiento. No obstante, la transicion global hacia IPv6 ha sido gradual "
                    "y heterogenea, particularmente en economias emergentes como El Salvador, donde predomina un "
                    "modelo de coexistencia conocido como Dual-Stack, en el que ambos protocolos operan simultaneamente.\n\n"
                    "Diversos estudios, como el de Huston (2022), evidencian que el rendimiento relativo entre IPv4 e "
                    "IPv6 no es intrinsecamente superior en uno u otro caso, sino que depende de factores como la "
                    "optimizacion del enrutamiento, politicas de los proveedores de servicios de Internet (ISP) y la "
                    "madurez de la infraestructura. En contextos donde IPv6 aun no cuenta con rutas plenamente optimizadas, "
                    "pueden observarse fenomenos de enrutamiento suboptimal, lo que impacta directamente en metricas "
                    "como la latencia y el jitter. En este sentido, la coexistencia de ambos protocolos introduce "
                    "variabilidad en el rendimiento de la red, constituyendose en un factor relevante al analizar "
                    "fenomenos como el path inflation, especialmente en regiones donde la infraestructura de interconexion "
                    "local es limitada."
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "2.2",
                "2.2 El fenomeno de Path Inflation y enrutamiento BGP",
                description=(
                    "El fenomeno conocido como path inflation describe la discrepancia entre la ruta optima "
                    "(generalmente la mas corta en terminos geograficos o de saltos) y la ruta efectivamente "
                    "utilizada por los paquetes en Internet, la cual suele estar determinada por politicas de "
                    "enrutamiento BGP mas que por eficiencia topologica.\n\n"
                    "Una manifestacion particular de este fenomeno es el tromboning, en el cual el trafico entre "
                    "dos nodos geograficamente cercanos es desviado a traves de rutas internacionales antes de "
                    "regresar a su destino. En el contexto centroamericano, esto suele implicar que comunicaciones "
                    "locales sean enrutadas a traves de puntos de intercambio internacionales, como el NAP de las "
                    "Americas en Miami, debido a la ausencia o debilidad de acuerdos de peering local o de Puntos "
                    "de Intercambio de Internet (IXP) robustos.\n\n"
                    "Estudios como el de Fanou et al. (2017), aunque centrados en el ecosistema africano, resultan "
                    "metodologicamente relevantes para analizar regiones con caracteristicas estructurales similares, "
                    "tales como baja densidad de IXPs y alta dependencia de transito internacional. Bajo estas "
                    "condiciones, se ha observado un incremento significativo en el Round Trip Time (RTT), afectando "
                    "aplicaciones sensibles a la latencia. En el caso de El Salvador, la limitada interconectividad "
                    "directa entre redes academicas y comerciales sugiere la posible existencia de estos fenomenos, "
                    "lo cual justifica su analisis empirico mediante herramientas de medicion activa."
                ),
                content=(
                    "El fenomeno conocido como path inflation describe la discrepancia entre la ruta optima "
                    "(generalmente la mas corta en terminos geograficos o de saltos) y la ruta efectivamente "
                    "utilizada por los paquetes en Internet, la cual suele estar determinada por politicas de "
                    "enrutamiento BGP mas que por eficiencia topologica.\n\n"
                    "Una manifestacion particular de este fenomeno es el tromboning, en el cual el trafico entre "
                    "dos nodos geograficamente cercanos es desviado a traves de rutas internacionales antes de "
                    "regresar a su destino. En el contexto centroamericano, esto suele implicar que comunicaciones "
                    "locales sean enrutadas a traves de puntos de intercambio internacionales, como el NAP de las "
                    "Americas en Miami, debido a la ausencia o debilidad de acuerdos de peering local o de Puntos "
                    "de Intercambio de Internet (IXP) robustos.\n\n"
                    "Estudios como el de Fanou et al. (2017), aunque centrados en el ecosistema africano, resultan "
                    "metodologicamente relevantes para analizar regiones con caracteristicas estructurales similares, "
                    "tales como baja densidad de IXPs y alta dependencia de transito internacional. Bajo estas "
                    "condiciones, se ha observado un incremento significativo en el Round Trip Time (RTT), afectando "
                    "aplicaciones sensibles a la latencia. En el caso de El Salvador, la limitada interconectividad "
                    "directa entre redes academicas y comerciales sugiere la posible existencia de estos fenomenos, "
                    "lo cual justifica su analisis empirico mediante herramientas de medicion activa."
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "2.3",
                "2.3 Medicion de desempeño de red: RFC 2330 y RFC 2681",
                description=(
                    "La evaluacion del rendimiento de redes IP se fundamenta en metricas estandarizadas definidas "
                    "por organismos como el Internet Engineering Task Force (IETF). Documentos clave como el "
                    "RFC 2330 establecen el marco conceptual para la medicion de desempeño (Framework for IP Performance "
                    "Metrics), mientras que el RFC 2681 define formalmente el Round-trip Delay como una metrica fundamental "
                    "para cuantificar la latencia.\n\n"
                    "Estas metricas permiten evaluar parametros criticos como:\n"
                    "• Latencia (RTT): Medicion del retardo de ida y vuelta que experimentan los paquetes de datos entre "
                    "origen y destino.\n"
                    "• Jitter (variacion de retardo): Variacion estadistica del retardo entre paquetes sucesivos, indispensable "
                    "para evaluar la estabilidad de enlaces.\n"
                    "• Perdida de paquetes (Packet Loss): Proporcion de paquetes transmitidos que no generan respuesta en los "
                    "intervalos de timeout establecidos.\n\n"
                    "Los cuales son determinantes en la calidad de servicios interactivos en tiempo real. En este contexto, "
                    "la distincion entre mediciones activas y pasivas es crucial: las mediciones activas implican la inyeccion "
                    "controlada de trafico sonda (por ejemplo, traceroutes y pings), mientras que las pasivas analizan trafico "
                    "preexistente. Para estudios de topologia y enrutamiento interdominio, las mediciones activas resultan "
                    "particularmente adecuadas y rigurosas."
                ),
                content=(
                    "La evaluacion del rendimiento de redes IP se fundamenta en metricas estandarizadas definidas "
                    "por organismos como el Internet Engineering Task Force (IETF). Documentos clave como el "
                    "RFC 2330 establecen el marco conceptual para la medicion de desempeño (Framework for IP Performance "
                    "Metrics), mientras que el RFC 2681 define formalmente el Round-trip Delay como una metrica fundamental "
                    "para cuantificar la latencia.\n\n"
                    "Estas metricas permiten evaluar parametros criticos como:\n"
                    "• Latencia (RTT): Medicion del retardo de ida y vuelta que experimentan los paquetes de datos entre "
                    "origen y destino.\n"
                    "• Jitter (variacion de retardo): Variacion estadistica del retardo entre paquetes sucesivos, indispensable "
                    "para evaluar la estabilidad de enlaces.\n"
                    "• Perdida de paquetes (Packet Loss): Proporcion de paquetes transmitidos que no generan respuesta en los "
                    "intervalos de timeout establecidos.\n\n"
                    "Los cuales son determinantes en la calidad de servicios interactivos en tiempo real. En este contexto, "
                    "la distincion entre mediciones activas y pasivas es crucial: las mediciones activas implican la inyeccion "
                    "controlada de trafico sonda (por ejemplo, traceroutes y pings), mientras que las pasivas analizan trafico "
                    "preexistente. Para estudios de topologia y enrutamiento interdominio, las mediciones activas resultan "
                    "particularmente adecuadas y rigurosas."
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "2.4",
                "2.4 RIPE Atlas como plataforma de medicion cientifica",
                description=(
                    "RIPE Atlas se ha consolidado como una de las plataformas mas relevantes para la medicion activa "
                    "de Internet a escala global. Basada en una red distribuida de sondas fisicas (hardware probes), "
                    "permite la recoleccion de datos de latencia, rutas y disponibilidad desde multiples puntos geograficos. "
                    "A diferencia de soluciones basadas exclusivamente en software, el uso de dispositivos dedicados "
                    "reduce la variabilidad introducida por factores locales del sistema (como carga del CPU o procesos en "
                    "segundo plano), permitiendo obtener mediciones consistentes y comparables.\n\n"
                    "El documento fundacional de RIPE NCC (2015) respalda la validez metodologica de esta herramienta, "
                    "destacando su utilidad en estudios de topologia, analisis de enrutamiento y evaluacion de desempeño de "
                    "red en contextos academicos y de investigacion.\n\n"
                    "En el presente estudio, RIPE Atlas constituye el instrumento central para identificar y cuantificar "
                    "fenomenos de path inflation y su impacto en la latencia interuniversitaria."
                ),
                content=(
                    "RIPE Atlas se ha consolidado como una de las plataformas mas relevantes para la medicion activa "
                    "de Internet a escala global. Basada en una red distribuida de sondas fisicas (hardware probes), "
                    "permite la recoleccion de datos de latencia, rutas y disponibilidad desde multiples puntos geograficos. "
                    "A diferencia de soluciones basadas exclusivamente en software, el uso de dispositivos dedicados "
                    "reduce la variabilidad introducida por factores locales del sistema (como carga del CPU o procesos en "
                    "segundo plano), permitiendo obtener mediciones consistentes y comparables.\n\n"
                    "El documento fundacional de RIPE NCC (2015) respalda la validez metodologica de esta herramienta, "
                    "destacando su utilidad en estudios de topologia, analisis de enrutamiento y evaluacion de desempeño de "
                    "red en contextos academicos y de investigacion.\n\n"
                    "En el presente estudio, RIPE Atlas constituye el instrumento central para identificar y cuantificar "
                    "fenomenos de path inflation y su impacto en la latencia interuniversitaria."
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "2.5",
                "2.5 Contexto de infraestructura e interconexion en El Salvador",
                description=(
                    "La evolucion de Internet en El Salvador ha estado marcada por un crecimiento progresivo en cobertura "
                    "y penetracion, impulsado por entidades como SVNet y regulado por la Superintendencia General de "
                    "Electricidad y Telecomunicaciones (SIGET). No obstante, el desarrollo de infraestructura de interconexion "
                    "local, particularmente en terminos de peering y Puntos de Intercambio de Internet (IXPs), ha sido "
                    "limitado en comparacion con regiones mas desarrolladas.\n\n"
                    "Estudios presentados en foros regionales como LACNIC evidencian que la adopcion de tecnologias como IPv6 "
                    "avanza de manera gradual, mientras que analisis de resiliencia de Internet en Centroamerica (Internet "
                    "Society, 2023) señalan una alta dependencia de rutas internacionales para el intercambio de trafico "
                    "domestico.\n\n"
                    "En el ambito academico, existe una limitada cantidad de investigaciones que analicen especificamente la "
                    "topologia y eficiencia del enrutamiento entre instituciones de educacion superior, lo que revela un "
                    "vacio significativo en la literatura tecnica nacional que este trabajo busca subsanar."
                ),
                content=(
                    "La evolucion de Internet en El Salvador ha estado marcada por un crecimiento progresivo en cobertura "
                    "y penetracion, impulsado por entidades como SVNet y regulado por la Superintendencia General de "
                    "Electricidad y Telecomunicaciones (SIGET). No obstante, el desarrollo de infraestructura de interconexion "
                    "local, particularmente en terminos de peering y Puntos de Intercambio de Internet (IXPs), ha sido "
                    "limitado en comparacion con regiones mas desarrolladas.\n\n"
                    "Estudios presentados en foros regionales como LACNIC evidencian que la adopcion de tecnologias como IPv6 "
                    "avanza de manera gradual, mientras que analisis de resiliencia de Internet en Centroamerica (Internet "
                    "Society, 2023) señalan una alta dependencia de rutas internacionales para el intercambio de trafico "
                    "domestico.\n\n"
                    "En el ambito academico, existe una limitada cantidad de investigaciones que analicen especificamente la "
                    "topologia y eficiencia del enrutamiento entre instituciones de educacion superior, lo que revela un "
                    "vacio significativo en la literatura tecnica nacional que este trabajo busca subsanar."
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "2.6",
                "2.6 Calidad de Experiencia (QoE) y su relacion con la latencia",
                description=(
                    "Si bien las metricas de desempeño de red (QoS) permiten evaluar objetivamente parametros tecnicos, la "
                    "experiencia del usuario final se conceptualiza mediante el termino Quality of Experience (QoE), el "
                    "cual integra factores tecnicos y perceptuales.\n\n"
                    "En entornos educativos digitales, la QoE se ve directamente afectada por la latencia, el jitter y la "
                    "estabilidad de la conexion, especialmente en aplicaciones interactivas como videoconferencias (clases "
                    "sincronicas), plataformas de aprendizaje en linea, laboratorios remotos y sistemas colaborativos en "
                    "tiempo real.\n\n"
                    "Diversos estudios en interaccion humano-computadora establecen que la percepcion de calidad se degrada "
                    "significativamente cuando la latencia supera ciertos umbrales:\n"
                    "• < 50 ms: Imperceptible para el usuario en interacciones bidireccionales en tiempo real.\n"
                    "• 50–150 ms: Aceptable para la mayoria de aplicaciones interactivas.\n"
                    "• > 200 ms: Degradacion notable y friccion cognitiva en interaccion en tiempo real.\n\n"
                    "En este contexto, fenomenos como el path inflation generan incrementos innecesarios en la latencia, "
                    "afectando directamente la experiencia del estudiante, incluso cuando la distancia geografica entre el "
                    "origen del usuario y el campus universitario es reducida."
                ),
                content=(
                    "Si bien las metricas de desempeño de red (QoS) permiten evaluar objetivamente parametros tecnicos, la "
                    "experiencia del usuario final se conceptualiza mediante el termino Quality of Experience (QoE), el "
                    "cual integra factores tecnicos y perceptuales.\n\n"
                    "En entornos educativos digitales, la QoE se ve directamente afectada por la latencia, el jitter y la "
                    "estabilidad de la conexion, especialmente en aplicaciones interactivas como videoconferencias (clases "
                    "sincronicas), plataformas de aprendizaje en linea, laboratorios remotos y sistemas colaborativos en "
                    "tiempo real.\n\n"
                    "Diversos estudios en interaccion humano-computadora establecen que la percepcion de calidad se degrada "
                    "significativamente cuando la latencia supera ciertos umbrales:\n"
                    "• < 50 ms: Imperceptible para el usuario en interacciones bidireccionales en tiempo real.\n"
                    "• 50–150 ms: Aceptable para la mayoria de aplicaciones interactivas.\n"
                    "• > 200 ms: Degradacion notable y friccion cognitiva en interaccion en tiempo real.\n\n"
                    "En este contexto, fenomenos como el path inflation generan incrementos innecesarios en la latencia, "
                    "afectando directamente la experiencia del estudiante, incluso cuando la distancia geografica entre el "
                    "origen del usuario y el campus universitario es reducida."
                ),
            ),
        ],
    },
    3: {
        "title": "Metodologia",
        "description": "Diseño de la investigacion, recoleccion de datos y fases de analisis.",
        "elements": [
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "3.1",
                "3.1 Plataforma de medicion: RIPE Atlas y Traceroute TCP",
                description=(
                    "RIPE Atlas es la red de medicion de Internet distribuida mas grande del mundo, operada por el "
                    "RIPE NCC (Réseaux IP Européens Network Coordination Centre). La plataforma cuenta con miles de "
                    "sondas de hardware y software desplegadas en redes domesticas y empresariales alrededor del mundo, "
                    "y permite a investigadores lanzar mediciones activas —como traceroutes, pings y consultas DNS— desde "
                    "multiples puntos de origen simultaneamente, obteniendo una vision topologica real del Internet.\n\n"
                    "Para esta investigacion se utilizo el tipo de medicion Traceroute sobre protocolo TCP, que permite "
                    "reconstruir el camino completo de la red desde cada sonda hasta el servidor objetivo, identificando "
                    "cada router intermedio (hop) y midiendo el tiempo de respuesta de cada uno (RTT, Round-Trip Time)."
                ),
                content=(
                    "RIPE Atlas es la red de medicion de Internet distribuida mas grande del mundo, operada por el "
                    "RIPE NCC (Réseaux IP Européens Network Coordination Centre). La plataforma cuenta con miles de "
                    "sondas de hardware y software desplegadas en redes domesticas y empresariales alrededor del mundo, "
                    "y permite a investigadores lanzar mediciones activas —como traceroutes, pings y consultas DNS— desde "
                    "multiples puntos de origen simultaneamente, obteniendo una vision topologica real del Internet.\n\n"
                    "Para esta investigacion se utilizo el tipo de medicion Traceroute sobre protocolo TCP, que permite "
                    "reconstruir el camino completo de la red desde cada sonda hasta el servidor objetivo, identificando "
                    "cada router intermedio (hop) y midiendo el tiempo de respuesta de cada uno (RTT, Round-Trip Time)."
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "3.2",
                "3.2 Diseño de las mediciones y parametros tecnicos (frecuencia 900s, puerto 443, etc.)",
                description=(
                    "Se diseñaron y ejecutaron dos rondas de medicion con parametros rigurosamente optimizados para "
                    "el entorno de red de la UFG:\n\n"
                    "Primera medicion (23 de febrero – 2 de marzo de 2026):\n"
                    "• Destino: webdesktop.ufg.edu.sv (plataforma institucional de educacion virtual).\n"
                    "• Tipo de medicion: Traceroute TCP con resolucion DNS en cada sonda (Resolve on Probe: ON).\n"
                    "• Version IP: IPv4, con paquetes SYN puros de 0 bytes (ultraligeros).\n"
                    "• Puerto destino: 443 (HTTPS), permitiendo que los paquetes atraviesen firewalls perimetrales que "
                    "filtran ICMP/UDP por politicas de seguridad corporativa.\n"
                    "• Frecuencia de ejecucion: Cada 900 segundos (15 minutos), equivalente a 96 muestras diarias por sonda.\n"
                    "• Spread (distribucion temporal): 600 segundos (10 minutos) para evitar la sincronizacion simultanea "
                    "de sondas y prevenir falsos positivos de SYN Flood / DDoS en el firewall institucional.\n"
                    "• Muestras por salto: 3 paquetes por cada hop con timeout de 4,000 ms.\n"
                    "• Rango de saltos: Primer salto 1, maximo 32 saltos.\n"
                    "• Algoritmo Paris Traceroute: Parametro 16, manipulando campos de cabecera TCP para mantener una "
                    "firma de flujo uniforme frente a routers con balanceo de carga ECMP (Equal-Cost Multi-Path), asegurando "
                    "mediciones topologicas consistentes.\n"
                    "• Fragmentacion: Desactivada (Don't Fragment: OFF).\n"
                    "• Duracion total: 7 dias continuos exactos (168 horas).\n\n"
                    "Segunda medicion (16 – 23 de marzo de 2026):\n"
                    "• Incorporo una frecuencia acelerada de cada 600 segundos (10 minutos) y spread de 500 segundos "
                    "(8 minutos) para densificar las muestras temporales manteniendo identicos los restantes parametros tecnicos."
                ),
                content=(
                    "Se diseñaron y ejecutaron dos rondas de medicion con parametros rigurosamente optimizados para "
                    "el entorno de red de la UFG:\n\n"
                    "Primera medicion (23 de febrero – 2 de marzo de 2026):\n"
                    "• Destino: webdesktop.ufg.edu.sv (plataforma institucional de educacion virtual).\n"
                    "• Tipo de medicion: Traceroute TCP con resolucion DNS en cada sonda (Resolve on Probe: ON).\n"
                    "• Version IP: IPv4, con paquetes SYN puros de 0 bytes (ultraligeros).\n"
                    "• Puerto destino: 443 (HTTPS), permitiendo que los paquetes atraviesen firewalls perimetrales que "
                    "filtran ICMP/UDP por politicas de seguridad corporativa.\n"
                    "• Frecuencia de ejecucion: Cada 900 segundos (15 minutos), equivalente a 96 muestras diarias por sonda.\n"
                    "• Spread (distribucion temporal): 600 segundos (10 minutos) para evitar la sincronizacion simultanea "
                    "de sondas y prevenir falsos positivos de SYN Flood / DDoS en el firewall institucional.\n"
                    "• Muestras por salto: 3 paquetes por cada hop con timeout de 4,000 ms.\n"
                    "• Rango de saltos: Primer salto 1, maximo 32 saltos.\n"
                    "• Algoritmo Paris Traceroute: Parametro 16, manipulando campos de cabecera TCP para mantener una "
                    "firma de flujo uniforme frente a routers con balanceo de carga ECMP (Equal-Cost Multi-Path), asegurando "
                    "mediciones topologicas consistentes.\n"
                    "• Fragmentacion: Desactivada (Don't Fragment: OFF).\n"
                    "• Duracion total: 7 dias continuos exactos (168 horas).\n\n"
                    "Segunda medicion (16 – 23 de marzo de 2026):\n"
                    "• Incorporo una frecuencia acelerada de cada 600 segundos (10 minutos) y spread de 500 segundos "
                    "(8 minutos) para densificar las muestras temporales manteniendo identicos los restantes parametros tecnicos."
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "3.3",
                "3.3 Poblacion de sondas y representatividad nacional",
                description=(
                    "La muestra de estudio comprendio 16 sondas RIPE Atlas seleccionadas aleatoriamente entre los dispositivos "
                    "activos con codigo de pais El Salvador (SV), complementadas con el analisis de 14 sondas analiticamente "
                    "validas distribuidas a traves de las principales redes del territorio nacional.\n\n"
                    "La poblacion de sondas abarca los operadores y redes representativos del pais:\n"
                    "• Redes comerciales masivas: Claro El Salvador (AS14754 / CTE Telecom Personal), Tigo / Navega (AS27743), "
                    "Telefonica / Movistar El Salvador (AS27653) y Digicel.\n"
                    "• Operadores corporativos y FTTH: Conective S.A. (AS27989) e IBW / Convergencia.\n"
                    "• Redes academicas y universitarias: Universidad Centroamericana Jose Simeon Cañas (UCA, AS27989/AS27743) "
                    "y Universidad de El Salvador (UES, AS27653).\n"
                    "• Red de referencia interna: Sonda interna ubicada dentro del campus UFG (prb_id=64959) para control "
                    "de latencia en LAN.\n\n"
                    "Esta diversidad garantiza la representatividad estadistica del trafico estudiantil en las distintas "
                    "modalidades de conectividad residencial, movil y corporativa en El Salvador."
                ),
                content=(
                    "La muestra de estudio comprendio 16 sondas RIPE Atlas seleccionadas aleatoriamente entre los dispositivos "
                    "activos con codigo de pais El Salvador (SV), complementadas con el analisis de 14 sondas analiticamente "
                    "validas distribuidas a traves de las principales redes del territorio nacional.\n\n"
                    "La poblacion de sondas abarca los operadores y redes representativos del pais:\n"
                    "• Redes comerciales masivas: Claro El Salvador (AS14754 / CTE Telecom Personal), Tigo / Navega (AS27743), "
                    "Telefonica / Movistar El Salvador (AS27653) y Digicel.\n"
                    "• Operadores corporativos y FTTH: Conective S.A. (AS27989) e IBW / Convergencia.\n"
                    "• Redes academicas y universitarias: Universidad Centroamericana Jose Simeon Cañas (UCA, AS27989/AS27743) "
                    "y Universidad de El Salvador (UES, AS27653).\n"
                    "• Red de referencia interna: Sonda interna ubicada dentro del campus UFG (prb_id=64959) para control "
                    "de latencia en LAN.\n\n"
                    "Esta diversidad garantiza la representatividad estadistica del trafico estudiantil en las distintas "
                    "modalidades de conectividad residencial, movil y corporativa en El Salvador."
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "3.4",
                "3.4 Plan de analisis: Las cinco fases de investigacion",
                description=(
                    "Los datos recopilados fueron analizados de acuerdo con un plan estructurado en cinco fases metodologicas "
                    "progresivas:\n"
                    "• Fase 1 — Integridad de la red y analisis de disponibilidad: Depuracion del embudo de datos, cuantificacion "
                    "de fallas de resolucion DNS, inestabilidad de sondas y calculo granular de perdida de paquetes (Packet Loss).\n"
                    "• Fase 2 — Establecimiento de la linea base de eficiencia: Identificacion matematica de la sonda de referencia "
                    "con menor dispersion y latencia minima para fijar la cota teorica y practica optima alcanzable.\n"
                    "• Fase 3 — Mapeo de proveedores e identificacion de ASNs: Clasificacion de sondas por ISP, verificacion de "
                    "paises de registro de ASNs, analisis de desconexiones y caracterizacion de rutas hacia las dos direcciones IP "
                    "activas del servidor institucional (45.227.202.7 y 200.124.138.24).\n"
                    "• Fase 4 — Demostracion del Path Inflation: Deteccion sistematica de saltos criticos con incremento de RTT > 20 ms, "
                    "rastreo de puntos de presencia (PoPs) internacionales y calculo del overhead de latencia por ISP frente a la linea base.\n"
                    "• Fase 5 — Estabilidad temporal: Evaluacion del comportamiento del enrutamiento por hora del dia, analisis de "
                    "horas pico academicas, consistencia interdiaria y caracterizacion del jitter mediante distribucion por percentiles y box plots."
                ),
                content=(
                    "Los datos recopilados fueron analizados de acuerdo con un plan estructurado en cinco fases metodologicas "
                    "progresivas:\n"
                    "• Fase 1 — Integridad de la red y analisis de disponibilidad: Depuracion del embudo de datos, cuantificacion "
                    "de fallas de resolucion DNS, inestabilidad de sondas y calculo granular de perdida de paquetes (Packet Loss).\n"
                    "• Fase 2 — Establecimiento de la linea base de eficiencia: Identificacion matematica de la sonda de referencia "
                    "con menor dispersion y latencia minima para fijar la cota teorica y practica optima alcanzable.\n"
                    "• Fase 3 — Mapeo de proveedores e identificacion de ASNs: Clasificacion de sondas por ISP, verificacion de "
                    "paises de registro de ASNs, analisis de desconexiones y caracterizacion de rutas hacia las dos direcciones IP "
                    "activas del servidor institucional (45.227.202.7 y 200.124.138.24).\n"
                    "• Fase 4 — Demostracion del Path Inflation: Deteccion sistematica de saltos criticos con incremento de RTT > 20 ms, "
                    "rastreo de puntos de presencia (PoPs) internacionales y calculo del overhead de latencia por ISP frente a la linea base.\n"
                    "• Fase 5 — Estabilidad temporal: Evaluacion del comportamiento del enrutamiento por hora del dia, analisis de "
                    "horas pico academicas, consistencia interdiaria y caracterizacion del jitter mediante distribucion por percentiles y box plots."
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "3.5",
                "3.5 Fuentes de verificacion (RDAP, BGPView, PeeringDB)",
                description=(
                    "Para garantizar el rigor academico y la precision en la identificacion topologica de cada operador, "
                    "las mediciones y prefijos IP fueron verificados y contrastados mediante multiples fuentes autorizadas e "
                    "independientes:\n"
                    "• Campo 'from' del JSON primario de RIPE Atlas: Registro de la direccion IP publica de origen asociada "
                    "a cada medicion traceroute.\n"
                    "• Base de datos de sondas RIPE Atlas: Informacion tecnica oficial de ASN y pais de registro de cada "
                    "hardware probe.\n"
                    "• API publica RDAP de LACNIC: Consulta del Registro de Direcciones de Internet para America Latina y el "
                    "Caribe (https://rdap.lacnic.net/rdap/) para verificar la razon social y entidad legal titular de cada bloque IPv4.\n"
                    "• API y motor de consultas BGPView: Analisis de visibilidad BGP, upstream providers de transito y relacion "
                    "interdominio entre sistemas autonomos.\n"
                    "• Directorio global PeeringDB: Verificacion del estado de presencia en puntos de intercambio de trafico (IXP), "
                    "politicas de peering publico y privado, e interconexiones en centros de datos regionales como el NAP de las Americas."
                ),
                content=(
                    "Para garantizar el rigor academico y la precision en la identificacion topologica de cada operador, "
                    "las mediciones y prefijos IP fueron verificados y contrastados mediante multiples fuentes autorizadas e "
                    "independientes:\n"
                    "• Campo 'from' del JSON primario de RIPE Atlas: Registro de la direccion IP publica de origen asociada "
                    "a cada medicion traceroute.\n"
                    "• Base de datos de sondas RIPE Atlas: Informacion tecnica oficial de ASN y pais de registro de cada "
                    "hardware probe.\n"
                    "• API publica RDAP de LACNIC: Consulta del Registro de Direcciones de Internet para America Latina y el "
                    "Caribe (https://rdap.lacnic.net/rdap/) para verificar la razon social y entidad legal titular de cada bloque IPv4.\n"
                    "• API y motor de consultas BGPView: Analisis de visibilidad BGP, upstream providers de transito y relacion "
                    "interdominio entre sistemas autonomos.\n"
                    "• Directorio global PeeringDB: Verificacion del estado de presencia en puntos de intercambio de trafico (IXP), "
                    "politicas de peering publico y privado, e interconexiones en centros de datos regionales como el NAP de las Americas."
                ),
            ),
        ],
    },
    4: {
        "title": "Resultados",
        "description": "Hallazgos de las 5 fases de analisis sobre la infraestructura evaluada.",
        "elements": [
            # Fase 1
            ReportElement(ElementType.CHART, "1", "Distribucion de mediciones por direccion IP de destino resuelta"),
            ReportElement(ElementType.CHART, "2", "Detalle de mediciones por categoria de destino"),
            ReportElement(ElementType.CHART, "3", "Detalle de fallas de DNS en la sonda 65161 (Resumen de volumen de mediciones)"),
            ReportElement(ElementType.CHART, "4", "Registro de periodos de inactividad por sonda (Evidencia de aborto por falla de resolucion DNS)"),
            ReportElement(ElementType.CHART, "5", "Tabla analitica de desconexiones por sonda durante la semana de medicion"),
            ReportElement(ElementType.CHART, "6", "Distribucion temporal de mediciones de sondas inestables"),
            ReportElement(ElementType.CHART, "7", "Distribucion de paquetes recibidos por medicion (Auditoria de paquetes en destino final por sonda)"),
            ReportElement(ElementType.CHART, "8", "Resumen estadistico de perdida de paquetes a nivel granular (Patrones de descarte por control/firewall)"),
            ReportElement(ElementType.CHART, "9", "Sintesis de metricas de disponibilidad de la Fase 1 (Grafica RIPE omitida)"),
            
            # Fase 2
            ReportElement(ElementType.CHART, "10", "Comparativa de metricas integrales por sonda para la seleccion de la linea base"),
            ReportElement(ElementType.CHART, "11", "Sonda seleccionada como linea base de eficiencia"),
            ReportElement(ElementType.CHART, "12", "Mediana de Latencia (RTT) por Sonda Hacia la UFG"),
            ReportElement(ElementType.CHART, "13", "Perdida de Paquetes (Packet Loss %) por Sonda"),
            
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
        ],
    },
    5: {
        "title": "Discusion",
        "description": "Interpretacion de los resultados y su impacto.",
        "elements": [
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "5.1",
                "5.1 Fragmentacion estructural del ecosistema de ISPs salvadoreños",
                description=(
                    "Uno de los hallazgos mas significativos de esta investigacion es la confirmacion de que una porcion "
                    "relevante de la infraestructura de Internet en El Salvador opera bajo sistemas autonomos registrados "
                    "fuera del pais. Este fenomeno no es exclusivo de El Salvador; es una caracteristica recurrente de los "
                    "mercados de telecomunicaciones de America Central, donde operadores de alcance regional consolidan "
                    "sus recursos de direccionamiento IP bajo entidades juridicas radicadas en el pais con mayor peso corporativo.\n\n"
                    "La consecuencia tecnica directa es que los protocolos de enrutamiento de Internet (BGP, Border Gateway "
                    "Protocol) toman decisiones de encaminamiento basadas en la informacion registrada en los ASNs, no en "
                    "la ubicacion geografica real del trafico. Cuando un paquete originado en El Salvador bajo el AS14754 "
                    "necesita alcanzar otro punto de El Salvador, los routers de transito del backbone global pueden "
                    "interpretarlo como trafico originado en Guatemala y enrutarlo primero hacia ese pais, añadiendo latencia "
                    "innecesaria desde el primer salto."
                ),
                content=(
                    "Uno de los hallazgos mas significativos de esta investigacion es la confirmacion de que una porcion "
                    "relevante de la infraestructura de Internet en El Salvador opera bajo sistemas autonomos registrados "
                    "fuera del pais. Este fenomeno no es exclusivo de El Salvador; es una caracteristica recurrente de los "
                    "mercados de telecomunicaciones de America Central, donde operadores de alcance regional consolidan "
                    "sus recursos de direccionamiento IP bajo entidades juridicas radicadas en el pais con mayor peso corporativo.\n\n"
                    "La consecuencia tecnica directa es que los protocolos de enrutamiento de Internet (BGP, Border Gateway "
                    "Protocol) toman decisiones de encaminamiento basadas en la informacion registrada en los ASNs, no en "
                    "la ubicacion geografica real del trafico. Cuando un paquete originado en El Salvador bajo el AS14754 "
                    "necesita alcanzar otro punto de El Salvador, los routers de transito del backbone global pueden "
                    "interpretarlo como trafico originado en Guatemala y enrutarlo primero hacia ese pais, añadiendo latencia "
                    "innecesaria desde el primer salto."
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "5.2",
                "5.2 Implicaciones para la educacion en linea",
                description=(
                    "En el contexto de la educacion virtual, la latencia adicional introducida por el Path Inflation no "
                    "afecta igualmente a todos los tipos de actividad academica. Las actividades que mas se ven perjudicadas "
                    "son las que requieren interaccion en tiempo real: videoconferencias, evaluaciones en linea con control "
                    "de tiempo, laboratorios virtuales interactivos y plataformas de colaboracion sincronica. En estos "
                    "escenarios, un incremento de 20–50 ms de latencia por Path Inflation puede traducirse en desincronizacion "
                    "de audio/video, timeouts de sesion y experiencia de usuario degradada.\n\n"
                    "La identificacion de la sonda 1014263 como linea base con 54.15 ms de latencia mediana establece que "
                    "existe al menos un proveedor en El Salvador capaz de ofrecer una ruta eficiente hacia la UFG. Que otros "
                    "proveedores presenten latencias significativamente superiores no es un problema de la distancia fisica, "
                    "sino de las decisiones de routing y la ausencia de acuerdos de peering local."
                ),
                content=(
                    "En el contexto de la educacion virtual, la latencia adicional introducida por el Path Inflation no "
                    "afecta igualmente a todos los tipos de actividad academica. Las actividades que mas se ven perjudicadas "
                    "son las que requieren interaccion en tiempo real: videoconferencias, evaluaciones en linea con control "
                    "de tiempo, laboratorios virtuales interactivos y plataformas de colaboracion sincronica. En estos "
                    "escenarios, un incremento de 20–50 ms de latencia por Path Inflation puede traducirse en desincronizacion "
                    "de audio/video, timeouts de sesion y experiencia de usuario degradada.\n\n"
                    "La identificacion de la sonda 1014263 como linea base con 54.15 ms de latencia mediana establece que "
                    "existe al menos un proveedor en El Salvador capaz de ofrecer una ruta eficiente hacia la UFG. Que otros "
                    "proveedores presenten latencias significativamente superiores no es un problema de la distancia fisica, "
                    "sino de las decisiones de routing y la ausencia de acuerdos de peering local."
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "5.3",
                "5.3 La solucion estructural: Acuerdos de peering e IXPs locales",
                description=(
                    "La evidencia presentada en esta investigacion apunta hacia una solucion tecnica bien documentada en la "
                    "literatura de ingenieria de redes: el establecimiento o fortalecimiento de un Internet Exchange Point "
                    "(IXP) local en El Salvador. Un IXP es una infraestructura fisica donde multiples ISPs se conectan entre "
                    "si directamente (peering), sin necesidad de que el trafico entre dos redes salvadoreñas deba salir al "
                    "backbone internacional y volver.\n\n"
                    "La existencia de ISPs con ASNs registrados fuera del pais es, en este sentido, un obstaculo adicional, "
                    "ya que dificulta los acuerdos de peering local al no tener una identidad de red formalmente salvadoreña "
                    "con la que negociar. La solucion requiere tanto voluntad regulatoria como coordinacion entre los "
                    "operadores para registrar sus bloques de IPs dentro del pais y participar activamente en mecanismos de "
                    "intercambio local de trafico."
                ),
                content=(
                    "La evidencia presentada en esta investigacion apunta hacia una solucion tecnica bien documentada en la "
                    "literatura de ingenieria de redes: el establecimiento o fortalecimiento de un Internet Exchange Point "
                    "(IXP) local en El Salvador. Un IXP es una infraestructura fisica donde multiples ISPs se conectan entre "
                    "si directamente (peering), sin necesidad de que el trafico entre dos redes salvadoreñas deba salir al "
                    "backbone internacional y volver.\n\n"
                    "La existencia de ISPs con ASNs registrados fuera del pais es, en este sentido, un obstaculo adicional, "
                    "ya que dificulta los acuerdos de peering local al no tener una identidad de red formalmente salvadoreña "
                    "con la que negociar. La solucion requiere tanto voluntad regulatoria como coordinacion entre los "
                    "operadores para registrar sus bloques de IPs dentro del pais y participar activamente en mecanismos de "
                    "intercambio local de trafico."
                ),
            ),
        ],
    },
    6: {
        "title": "Conclusiones",
        "description": "Sintesis de la investigacion y recomendaciones.",
        "elements": [
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "6.1",
                "6.1 Conclusiones sobre el servidor de destino",
                description=(
                    "La infraestructura del servidor webdesktop.ufg.edu.sv demostro ser robusta y confiable. Con una "
                    "disponibilidad del 99.98% a nivel de enrutamiento, una perdida de paquetes perimetral del 1.87% "
                    "atribuible a mecanismos de rate-limiting estandar, y dos uplinks activos con configuracion DNS "
                    "round-robin para redundancia, el servidor de la UFG no es el cuello de botella del sistema. Los "
                    "problemas de conectividad identificados son originados en la infraestructura de los proveedores."
                ),
                content=(
                    "La infraestructura del servidor webdesktop.ufg.edu.sv demostro ser robusta y confiable. Con una "
                    "disponibilidad del 99.98% a nivel de enrutamiento, una perdida de paquetes perimetral del 1.87% "
                    "atribuible a mecanismos de rate-limiting estandar, y dos uplinks activos con configuracion DNS "
                    "round-robin para redundancia, el servidor de la UFG no es el cuello de botella del sistema. Los "
                    "problemas de conectividad identificados son originados en la infraestructura de los proveedores."
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "6.2",
                "6.2 Conclusiones sobre los proveedores de Internet",
                description=(
                    "El ecosistema de ISPs en El Salvador presenta una fragmentacion estructural preocupante: cuatro de "
                    "las catorce sondas (28.6%) operan bajo ASNs registrados en Guatemala y Honduras, lo que introduce "
                    "riesgo inherente de routing internacional para trafico domestico. El caso de Claro El Salvador "
                    "(AS14754 / Guatemala) es el mas documentado por esta investigacion, tanto por la anomalia de "
                    "registro como por el comportamiento altamente inestable de sus sondas (72.5 horas fuera de linea "
                    "en 7 dias, 8 episodios de desconexion, 5 cambios de IP dinamica)."
                ),
                content=(
                    "El ecosistema de ISPs en El Salvador presenta una fragmentacion estructural preocupante: cuatro de "
                    "las catorce sondas (28.6%) operan bajo ASNs registrados en Guatemala y Honduras, lo que introduce "
                    "riesgo inherente de routing internacional para trafico domestico. El caso de Claro El Salvador "
                    "(AS14754 / Guatemala) es el mas documentado por esta investigacion, tanto por la anomalia de "
                    "registro como por el comportamiento altamente inestable de sus sondas (72.5 horas fuera de linea "
                    "en 7 dias, 8 episodios de desconexion, 5 cambios de IP dinamica)."
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "6.3",
                "6.3 Conclusiones sobre la hipotesis de Path Inflation",
                description=(
                    "Los datos de las Fases 1, 2 y 3 establecen las condiciones previas para la demostracion del Path "
                    "Inflation: se ha confirmado que existen diferencias de latencia significativas entre proveedores, que "
                    "al menos un proveedor logra una latencia mediana de 54.15 ms (linea base), y que varios ISPs operan "
                    "bajo ASNs extranjeros que estructuralmente predisponen al trafico a recorrer rutas internacionales.\n\n"
                    "Asimismo, las Fases 4 y 5 completan la demostracion empirica cuantificando sobrecostos de latencia "
                    "de mas de 20 a 50 ms por desvios internacionales hacia PoPs en Sudamerica (Lima) y Norteamerica (Miami) "
                    "antes de retornar al pais, validando plenamente la hipotesis de trabajo formulada."
                ),
                content=(
                    "Los datos de las Fases 1, 2 y 3 establecen las condiciones previas para la demostracion del Path "
                    "Inflation: se ha confirmado que existen diferencias de latencia significativas entre proveedores, que "
                    "al menos un proveedor logra una latencia mediana de 54.15 ms (linea base), y que varios ISPs operan "
                    "bajo ASNs extranjeros que estructuralmente predisponen al trafico a recorrer rutas internacionales.\n\n"
                    "Asimismo, las Fases 4 y 5 completan la demostracion empirica cuantificando sobrecostos de latencia "
                    "de mas de 20 a 50 ms por desvios internacionales hacia PoPs en Sudamerica (Lima) y Norteamerica (Miami) "
                    "antes de retornar al pais, validando plenamente la hipotesis de trabajo formulada."
                ),
            ),
        ],
    },
    7: {
        "title": "Referencias",
        "description": "Fuentes bibliograficas y documentacion de apoyo.",
        "elements": [
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "7.1",
                "7.1 Datos primarios RIPE Atlas",
                description=(
                    "• RIPE Atlas Measurement Platform. Mediciones #Primera y #Segunda ronda hacia webdesktop.ufg.edu.sv. "
                    "RIPE NCC, 2026. Acceso via API publica: https://atlas.ripe.net/api/v2/measurements/\n"
                    "• RIPE Atlas Probe Database. Informacion de ASN y pais de registro de sondas en El Salvador. RIPE NCC, 2026.\n"
                    "• RIPE NCC. (2015). RIPE Atlas: A global Internet measurement network. Internet Protocol Journal, 18(3). "
                    "https://www.ripe.net/\n"
                    "• RIPE NCC. (2023). RIPE Atlas documentation: Accuracy and precision of hardware probes. https://atlas.ripe.net/docs/"
                ),
                content=(
                    "• RIPE Atlas Measurement Platform. Mediciones #Primera y #Segunda ronda hacia webdesktop.ufg.edu.sv. "
                    "RIPE NCC, 2026. Acceso via API publica: https://atlas.ripe.net/api/v2/measurements/\n"
                    "• RIPE Atlas Probe Database. Informacion de ASN y pais de registro de sondas en El Salvador. RIPE NCC, 2026.\n"
                    "• RIPE NCC. (2015). RIPE Atlas: A global Internet measurement network. Internet Protocol Journal, 18(3). "
                    "https://www.ripe.net/\n"
                    "• RIPE NCC. (2023). RIPE Atlas documentation: Accuracy and precision of hardware probes. https://atlas.ripe.net/docs/"
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "7.2",
                "7.2 Estandares y protocolos (IETF RFCs)",
                description=(
                    "• Internet Engineering Task Force (IETF). (1981). RFC 791: Internet Protocol. DARPA Internet Program "
                    "Protocol Specification.\n"
                    "• Internet Engineering Task Force (IETF). (1981). RFC 793: Transmission Control Protocol. DARPA Internet "
                    "Program Protocol Specification.\n"
                    "• Internet Engineering Task Force (IETF). (1998). RFC 2330: Framework for IP Performance Metrics. "
                    "https://doi.org/10.17487/RFC2330\n"
                    "• Internet Engineering Task Force (IETF). (1999). RFC 2681: A Round-trip Delay Metric for IP Performance Metrics. "
                    "https://doi.org/10.17487/RFC2681\n"
                    "• Internet Engineering Task Force (IETF). (2006). RFC 4271: A Border Gateway Protocol 4 (BGP-4). "
                    "https://doi.org/10.17487/RFC4271\n"
                    "• Augustin, B., Cuvellier, X., Orgogozo, B., Viger, F., Friedman, T., Latapy, M., Magnien, C., & Teixeira, R. "
                    "(2006). Avoiding traceroute anomalies with Paris Traceroute. Proceedings of the 6th ACM SIGCOMM Conference on "
                    "Internet Measurement (IMC '06), 153–158.\n"
                    "• Jacobson, V. (1989). Traceroute: Network diagnostic tool. Lawrence Berkeley Laboratory, UNIX Manual."
                ),
                content=(
                    "• Internet Engineering Task Force (IETF). (1981). RFC 791: Internet Protocol. DARPA Internet Program "
                    "Protocol Specification.\n"
                    "• Internet Engineering Task Force (IETF). (1981). RFC 793: Transmission Control Protocol. DARPA Internet "
                    "Program Protocol Specification.\n"
                    "• Internet Engineering Task Force (IETF). (1998). RFC 2330: Framework for IP Performance Metrics. "
                    "https://doi.org/10.17487/RFC2330\n"
                    "• Internet Engineering Task Force (IETF). (1999). RFC 2681: A Round-trip Delay Metric for IP Performance Metrics. "
                    "https://doi.org/10.17487/RFC2681\n"
                    "• Internet Engineering Task Force (IETF). (2006). RFC 4271: A Border Gateway Protocol 4 (BGP-4). "
                    "https://doi.org/10.17487/RFC4271\n"
                    "• Augustin, B., Cuvellier, X., Orgogozo, B., Viger, F., Friedman, T., Latapy, M., Magnien, C., & Teixeira, R. "
                    "(2006). Avoiding traceroute anomalies with Paris Traceroute. Proceedings of the 6th ACM SIGCOMM Conference on "
                    "Internet Measurement (IMC '06), 153–158.\n"
                    "• Jacobson, V. (1989). Traceroute: Network diagnostic tool. Lawrence Berkeley Laboratory, UNIX Manual."
                ),
            ),
            ReportElement(
                ElementType.INTERPRETATION_BLOCK,
                "7.3",
                "7.3 Literatura academica de referencia sobre Path Inflation y antecedentes",
                description=(
                    "• Ager, B., Chatzis, N., Feldmann, A., Sarrar, N., Uhlig, S., & Willinger, W. (2012). Anatomy of a large "
                    "European IXP. ACM SIGCOMM Computer Communication Review, 42(4), 163–174.\n"
                    "• Center for Applied Internet Data Analysis (CAIDA). (2024). Macroscopic Internet topology data aggregation. "
                    "https://www.caida.org/\n"
                    "• Fanou, R., Francois, P., & Aben, E. (2017). On the diversity and performance of the African Internet "
                    "ecosystem. Proceedings of the Internet Measurement Conference (IMC), 461–474. https://doi.org/10.1145/3131365.3131369\n"
                    "• Gill, P., Arlitt, M., Li, Z., & Mahanti, A. (2008). The flattening Internet topology: Natural evolution, "
                    "unsightly vision or Silicon PR? ACM SIGCOMM CCR, 38(5), 31–38.\n"
                    "• Huston, G. (2022). IPv6 performance measurement. APNIC Labs. https://labs.apnic.net/\n"
                    "• Internet Society. (2023). State of Internet resilience: Central America report. ISOC Pulse. "
                    "https://pulse.internetsociety.org/\n"
                    "• Latin American and Caribbean Internet Addresses Registry (LACNIC). (2022). Analisis de la estabilidad del "
                    "ruteo BGP en America Latina y el Caribe. https://www.lacnic.net/\n"
                    "• Lodhi, A., Larson, N., Dhamdhere, A., Dovrolis, C., & Claffy, K. (2014). Using PeeringDB to understand the "
                    "peering ecosystem. ACM SIGCOMM CCR, 44(2), 20–27.\n"
                    "• Superintendencia General de Electricidad y Telecomunicaciones (SIGET). (2025). Informe estadistico de "
                    "telecomunicaciones de El Salvador. Gobierno de El Salvador.\n"
                    "• SVNet. (2024). Historia y evolucion del Internet en El Salvador: Hacia la soberania digital. San Salvador, El Salvador."
                ),
                content=(
                    "• Ager, B., Chatzis, N., Feldmann, A., Sarrar, N., Uhlig, S., & Willinger, W. (2012). Anatomy of a large "
                    "European IXP. ACM SIGCOMM Computer Communication Review, 42(4), 163–174.\n"
                    "• Center for Applied Internet Data Analysis (CAIDA). (2024). Macroscopic Internet topology data aggregation. "
                    "https://www.caida.org/\n"
                    "• Fanou, R., Francois, P., & Aben, E. (2017). On the diversity and performance of the African Internet "
                    "ecosystem. Proceedings of the Internet Measurement Conference (IMC), 461–474. https://doi.org/10.1145/3131365.3131369\n"
                    "• Gill, P., Arlitt, M., Li, Z., & Mahanti, A. (2008). The flattening Internet topology: Natural evolution, "
                    "unsightly vision or Silicon PR? ACM SIGCOMM CCR, 38(5), 31–38.\n"
                    "• Huston, G. (2022). IPv6 performance measurement. APNIC Labs. https://labs.apnic.net/\n"
                    "• Internet Society. (2023). State of Internet resilience: Central America report. ISOC Pulse. "
                    "https://pulse.internetsociety.org/\n"
                    "• Latin American and Caribbean Internet Addresses Registry (LACNIC). (2022). Analisis de la estabilidad del "
                    "ruteo BGP en America Latina y el Caribe. https://www.lacnic.net/\n"
                    "• Lodhi, A., Larson, N., Dhamdhere, A., Dovrolis, C., & Claffy, K. (2014). Using PeeringDB to understand the "
                    "peering ecosystem. ACM SIGCOMM CCR, 44(2), 20–27.\n"
                    "• Superintendencia General de Electricidad y Telecomunicaciones (SIGET). (2025). Informe estadistico de "
                    "telecomunicaciones de El Salvador. Gobierno de El Salvador.\n"
                    "• SVNet. (2024). Historia y evolucion del Internet en El Salvador: Hacia la soberania digital. San Salvador, El Salvador."
                ),
            ),
        ],
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
    if el.content:
        d["content"] = el.content
    elif el.description:
        d["content"] = el.description
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
