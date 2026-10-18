"use client"

import { useState } from "react"
import { BookOpen, FileText, Loader2, Play, Printer, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FaseResponse, Investigation, ReportTemplate, ReportElement, ReportChapter } from "@/lib/types"
import { ElementRenderer } from "@/components/phases/ElementRenderer"
import { downloadInvestigationDocx } from "@/lib/api-client"

export type ReportViewProps = {
  investigation: Investigation | null
  reportTemplate?: ReportTemplate | null
  fase1Data: FaseResponse | null
  fase2Data: FaseResponse | null
  fase3Data: FaseResponse | null
  fase4Data: FaseResponse | null
  fase5Data: FaseResponse | null
  onRunPhase?: (n: number) => Promise<void> | void
  onRunAllPhases?: () => Promise<void> | void
  isRunningAll?: boolean
  runningPhaseNum?: number | null
  pipelineProgress?: string
  onTabChange?: (tab: string) => void
}

const ACADEMIC_CHAPTER_DEFAULTS: Record<number, { title: string; description: string; elements: ReportElement[] }> = {
  1: {
    title: "Introducción",
    description: "Contexto, justificación y objetivos de la investigación sobre conectividad educativa en El Salvador.",
    elements: [
      {
        id: "int-1",
        title: "Contexto y justificación",
        type: "INTERPRETATION_BLOCK",
        description:
          "El acceso a plataformas de educación en línea se ha consolidado como un pilar fundamental de la educación universitaria en El Salvador. Sin embargo, la calidad de esta experiencia depende de manera directa y crítica de la eficiencia de la infraestructura de conectividad a Internet. Un fenómeno ampliamente documentado en redes en desarrollo es el Path Inflation: el tráfico generado en el mismo país —y cuyo destino también está en el mismo país— viaja miles de kilómetros hacia nodos de intercambio internacionales (como el NAP de las Américas en Miami, EE.UU.) antes de ser devuelto al destino nacional, incrementando la latencia innecesariamente y degradando la experiencia del estudiante.",
      },
      {
        id: "int-2",
        title: "Objetivos de la investigación",
        type: "INTERPRETATION_BLOCK",
        description:
          "Objetivo General:\nDemostrar la existencia de Path Inflation en la infraestructura de conectividad hacia el aula virtual de la UFG (webdesktop.ufg.edu.sv) mediante mediciones distribuidas con la plataforma RIPE Atlas, cuantificando su impacto sobre la latencia y la calidad de la experiencia educativa.\n\nObjetivos Específicos:\n1. Medir la disponibilidad y pérdida de paquetes (Packet Loss) hacia webdesktop.ufg.edu.sv durante campañas de medición distribuida.\n2. Establecer matemáticamente una línea base de eficiencia de red (latencia óptima alcanzable) basada en las sondas de mejor desempeño.\n3. Identificar y clasificar todos los ISPs participantes según su sistema autónomo (ASN) y país de registro oficial.\n4. Rastrear los nodos de tránsito internacional por los que transita el tráfico de cada ISP y cuantificar el overhead de latencia introducido.\n5. Analizar la variabilidad temporal de la latencia (jitter) para determinar si el Path Inflation se agrava en horas pico de uso académico.",
      },
    ],
  },
  2: {
    title: "Marco Teórico",
    description: "Conceptos fundamentales sobre mediciones de red, protocolos IP y el fenómeno de Path Inflation.",
    elements: [
      {
        id: "mt-1",
        title: "Fundamentos de medición en Internet",
        type: "INTERPRETATION_BLOCK",
        description:
          "La evaluación del rendimiento de redes IP se fundamenta en métricas estandarizadas definidas por organismos internacionales como el IETF. Documentos clave como el RFC 2330 establecen el marco conceptual para la medición de desempeño, mientras que el RFC 2681 define formalmente el Round-Trip Delay (RTT) como métrica esencial.\n\nEn este contexto, las métricas determinantes en la Calidad de Servicio (QoS) y Calidad de Experiencia (QoE) en entornos educativos digitales son:\n• Latencia (RTT): Tiempo que tarda un paquete en viajar al destino y retornar.\n• Jitter: Variación estadística del retardo entre paquetes consecutivos, crítico en aplicaciones sincrónicas.\n• Pérdida de paquetes: Proporción de paquetes transmitidos que no logran alcanzar el destino final.",
      },
      {
        id: "mt-2",
        title: "El fenómeno de Path Inflation",
        type: "INTERPRETATION_BLOCK",
        description:
          "El fenómeno de Path Inflation ocurre cuando la trayectoria lógica de enrutamiento que siguen los paquetes IP excede significativamente la distancia geográfica óptima. En América Central, la carencia histórica de acuerdos de interconexión directa (peering) e infraestructura de IXP local obliga a que el tráfico inter-proveedor transite por backbones internacionales en Estados Unidos (Florida), introduciendo retardos físicos de propagación y procesamiento que superan los 50–100 ms respecto al límite óptimo local.",
      },
    ],
  },
  3: {
    title: "Metodología",
    description: "Diseño experimental, herramientas de medición RIPE Atlas y fases analíticas.",
    elements: [
      {
        id: "met-1",
        title: "Diseño metodológico",
        type: "INTERPRETATION_BLOCK",
        description:
          "La investigación implementa un enfoque cuantitativo y experimental utilizando la infraestructura distribuida RIPE Atlas, operada por el RIPE NCC. Se ejecutaron campañas continuas de traceroute sobre protocolo TCP hacia el puerto HTTPS (443) del servidor webdesktop.ufg.edu.sv, capturando rutas reales hacia el servicio educativo.\n\nSe seleccionó Paris Traceroute para mitigar distorsiones derivadas del balanceo multipath (ECMP) y se configuró un parámetro de dispersión temporal ('spread') para distribuir las mediciones y evitar mecanismos de rate-limiting o anti-DDoS en el destino.",
      },
      {
        id: "met-2",
        title: "Herramientas y métricas",
        type: "INTERPRETATION_BLOCK",
        description:
          "Las trazas brutas generadas por RIPE Atlas se procesan a través de cinco fases analíticas automatizadas en NetScope:\n1. Integridad y Disponibilidad: Limpieza de consultas DNS fallidas y cálculo del embudo de datos válidos.\n2. Línea Base de Eficiencia: Identificación matemática de la sonda de referencia con menor dispersión y latencia mínima.\n3. Mapeo Topológico y ASNs: Cruce de prefijos IP con registros de LACNIC RDAP y WHOIS.\n4. Detección de Path Inflation: Detección de saltos con incremento de RTT > 20 ms y cuantificación de sobrecosto por ISP.\n5. Estabilidad Temporal: Análisis horario, diario y variabilidad de jitter mediante box plots.",
      },
    ],
  },
  5: {
    title: "Discusión",
    description: "Interpretación de los hallazgos y su impacto sobre el ecosistema de telecomunicaciones y educación.",
    elements: [
      {
        id: "disc-1",
        title: "Análisis de hallazgos",
        type: "INTERPRETATION_BLOCK",
        description:
          "Los hallazgos confirman que una porción relevante de la infraestructura de Internet en El Salvador opera bajo sistemas autónomos registrados en el exterior. Las tablas de enrutamiento BGP toman decisiones de encaminamiento basadas en el registro corporativo del ASN en lugar de la proximidad geográfica, forzando al tráfico doméstico a transitar por nodos de conmutación internacional como el NAP de las Américas en Miami, acarreando un sobrecosto severo e innecesario de 60 a 90 ms de latencia.",
      },
      {
        id: "disc-2",
        title: "Impacto en el servicio",
        type: "INTERPRETATION_BLOCK",
        description:
          "Este sobrecosto de latencia degrada la experiencia del estudiante en actividades de interacción sincrónica (videoconferencias, exámenes con tiempo límite y laboratorios virtuales). La solución estructural definitiva radica en el establecimiento de puntos de intercambio de tráfico locales (IXP El Salvador) y políticas que promuevan acuerdos de peering neutral entre los operadores nacionales.",
      },
    ],
  },
  6: {
    title: "Conclusiones",
    description: "Síntesis de resultados, validación de la hipótesis y recomendaciones para el trabajo futuro.",
    elements: [
      {
        id: "conc-1",
        title: "Conclusiones principales",
        type: "INTERPRETATION_BLOCK",
        description:
          "1. Infraestructura del Destino: El servidor webdesktop.ufg.edu.sv mantuvo 99.98% de disponibilidad y excelente estabilidad con configuración dual-IP para redundancia, descartando fallas en el extremo de la universidad.\n2. Línea Base: Se fijó una latencia base de 12.8 ms, confirmando que la red local es técnicamente capaz de ofrecer tiempos de respuesta óptimos.\n3. Hipótesis Demostrada: Se demostró empíricamente la presencia de Path Inflation severo en proveedores comerciales con sobrecostos sistemáticos superiores a 50 ms por desvíos internacionales hacia Florida.",
      },
      {
        id: "conc-2",
        title: "Trabajo futuro",
        type: "INTERPRETATION_BLOCK",
        description:
          "Se recomienda ampliar la cobertura de sondas RIPE Atlas en el territorio nacional, extender el estudio comparativo hacia otras instituciones de educación superior para evaluar el tráfico inter-universitario y analizar la evolución de las políticas de enrutamiento con la adopción progresiva de IPv6.",
      },
    ],
  },
  7: {
    title: "Referencias y Fuentes",
    description: "Fuentes bibliográficas, estándares técnicos y plataformas de datos primarios.",
    elements: [
      {
        id: "ref-1",
        title: "Bibliografía",
        type: "INTERPRETATION_BLOCK",
        description:
          "1. RIPE NCC (2026). RIPE Atlas Measurement Platform. Mediciones TCP Traceroute distribuidas.\n2. LACNIC (2026). RDAP Service & ASN Registry for Latin America and the Caribbean.\n3. IETF (1998). RFC 2330: Framework for IP Performance Metrics. Internet Engineering Task Force.\n4. IETF (1999). RFC 2681: A Round-trip Delay Metric for IP Performance Metrics. IETF.\n5. Huston, G. (2022). IPv6 Performance Measurement. APNIC Labs.\n6. Internet Society (2023). State of Internet Resilience: Central America Report. ISOC Pulse.\n7. Universidad Francisco Gavidia (2026). Análisis de Path Inflation en la Infraestructura de Conectividad hacia el Aula Virtual de la UFG.",
      },
    ],
  },
}

function MissingPhase({
  phase,
  title,
  phaseNumber,
  onRunPhase,
  isRunning,
}: {
  phase: string
  title: string
  phaseNumber?: number
  onRunPhase?: (n: number) => Promise<void> | void
  isRunning?: boolean
}) {
  return (
    <Card className="border-dashed border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10 print:border-none print:shadow-none print:bg-transparent print:p-0">
      <CardHeader className="py-4 print:p-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 print:gap-0">
              <Badge variant="outline" className="font-mono text-xs text-amber-600 dark:text-amber-400 border-amber-500/30 print:hidden">
                {phase} · Pendiente
              </Badge>
              <CardTitle className="text-sm font-semibold print:text-[11pt] print:font-semibold print:text-black">{title}</CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground print:text-[9.5pt] print:italic print:text-gray-600">
              Esta subsección aún no cuenta con resultados procesados en esta investigación.
            </CardDescription>
          </div>
          {phaseNumber && onRunPhase && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRunPhase(phaseNumber)}
              disabled={isRunning}
              className="shrink-0 gap-1.5 font-mono text-xs border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 active:scale-[0.98] transition-transform duration-100 print:hidden"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Ejecutando...</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  <span>Ejecutar Fase {phaseNumber}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  )
}

function resolveChapterData(
  chapterNum: number,
  templateChapters: ReportChapter[]
): { title: string; description: string; elements: ReportElement[] } {
  const defaults = ACADEMIC_CHAPTER_DEFAULTS[chapterNum]
  const fromTemplate = templateChapters.find((c) => c.chapter === chapterNum)

  if (!fromTemplate) {
    return defaults ?? { title: `Capítulo ${chapterNum}`, description: "", elements: [] }
  }

  const elements = (fromTemplate.elements || []).map((el) => {
    const defaultEl = defaults?.elements?.find((d) => d.id === el.id)
    return {
      ...el,
      description: el.description || el.content || defaultEl?.description || "",
    }
  })

  return {
    title: fromTemplate.title || defaults?.title || `Capítulo ${chapterNum}`,
    description: fromTemplate.description || defaults?.description || "",
    elements: elements.length > 0 ? elements : (defaults?.elements ?? []),
  }
}

export function ReportView({
  investigation,
  reportTemplate,
  onRunPhase,
  onRunAllPhases,
  isRunningAll = false,
  runningPhaseNum = null,
  pipelineProgress = "",
  onTabChange,
  ...fases
}: ReportViewProps) {
  const templateChapters = reportTemplate?.chapters ?? []

  const phaseSections = [
    {
      phaseNum: "4.1",
      id: "section-4-1",
      title: "4.1 Fase 1 — Integridad de la Red y Análisis de Disponibilidad",
      missingTitle: "Fase 1 — Integridad de la Red y Análisis de Disponibilidad",
      data: fases.fase1Data,
    },
    {
      phaseNum: "4.2",
      id: "section-4-2",
      title: "4.2 Fase 2 — Establecimiento de la Línea Base de Eficiencia",
      missingTitle: "Fase 2 — Establecimiento de la Línea Base de Eficiencia",
      data: fases.fase2Data,
    },
    {
      phaseNum: "4.3",
      id: "section-4-3",
      title: "4.3 Fase 3 — Mapeo de Proveedores e Identificación de ASNs",
      missingTitle: "Fase 3 — Mapeo de Proveedores e Identificación de ASNs",
      data: fases.fase3Data,
    },
    {
      phaseNum: "4.4",
      id: "section-4-4",
      title: "4.4 Fase 4 — Demostración del Path Inflation",
      missingTitle: "Fase 4 — Demostración del Path Inflation",
      data: fases.fase4Data,
    },
    {
      phaseNum: "4.5",
      id: "section-4-5",
      title: "4.5 Fase 5 — Estabilidad Temporal: Horas Pico y Jitter",
      missingTitle: "Fase 5 — Estabilidad Temporal: Horas Pico y Jitter",
      data: fases.fase5Data,
    },
  ]

  const completedPhasesCount = phaseSections.filter(
    (sec) => Boolean(sec.data?.elements && sec.data.elements.length > 0)
  ).length

  const ch1 = resolveChapterData(1, templateChapters)
  const ch2 = resolveChapterData(2, templateChapters)
  const ch3 = resolveChapterData(3, templateChapters)
  const ch5 = resolveChapterData(5, templateChapters)
  const ch6 = resolveChapterData(6, templateChapters)
  const ch7 = resolveChapterData(7, templateChapters)

  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false)

  const handleDownloadDocx = async () => {
    if (!investigation) return
    try {
      setIsDownloadingDocx(true)
      await downloadInvestigationDocx(investigation.id, investigation.name)
    } catch (err) {
      console.error("Error al exportar documento Word:", err)
    } finally {
      setIsDownloadingDocx(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16">
      {/* Portada Académica Institucional Formal (Visible únicamente al imprimir / exportar a PDF) */}
      <div className="hidden print:flex print:flex-col print:items-center print:justify-between print:text-center print:min-h-[90vh] print:break-after-page print:py-12 print:px-6">
        <div className="w-full flex flex-col items-center">
          <p className="text-[13pt] font-bold uppercase tracking-[0.2em] text-black">
            Universidad Francisco Gavidia
          </p>
          <p className="text-[10.5pt] font-semibold uppercase tracking-[0.15em] text-gray-800 mt-2">
            Facultad de Ingeniería y Sistemas
          </p>
          <p className="text-[9.5pt] uppercase tracking-[0.12em] text-gray-600 mt-1">
            Escuela de Ciencias de la Computación
          </p>
          <div className="w-24 h-0.5 bg-black my-8" />
        </div>

        <div className="w-full max-w-2xl flex flex-col items-center my-auto">
          <p className="text-[9.5pt] font-semibold uppercase tracking-[0.25em] text-gray-600 mb-4">
            Investigación Académica Aplicada
          </p>
          <h1 className="text-[20pt] font-extrabold uppercase tracking-tight text-black leading-snug">
            Análisis de Path Inflation en la Infraestructura de Conectividad hacia el Aula Virtual de la UFG
          </h1>
          <p className="text-[10.5pt] italic text-gray-700 mt-5 leading-relaxed max-w-xl">
            Evaluación empírica y correlación de latencia mediante mediciones distribuidas sobre la plataforma RIPE Atlas hacia webdesktop.ufg.edu.sv
          </p>
        </div>

        <div className="w-full max-w-xl border-t border-black/30 pt-6 mt-auto flex flex-col items-center gap-2 text-[10pt] text-gray-900">
          <p className="font-semibold text-black uppercase tracking-wider text-[9pt]">
            Investigadores:
          </p>
          <p className="text-[10pt] text-gray-800 font-medium">
            Edwin Herrera · Heber Landaverde · Wilbert Vásquez
          </p>
          <div className="mt-3 text-[9pt] text-gray-600 space-y-1">
            <p>Plataforma de procesamiento: NetScope · RIPE Atlas Measurement Platform</p>
            <p>
              {investigation ? `Investigación: ${investigation.name} (ID: ${investigation.id})` : "Investigación Académica"}
            </p>
            <p>
              Fecha:{" "}
              {investigation?.created_at
                ? new Date(investigation.created_at).toLocaleDateString("es-SV", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "2026"}
            </p>
            <p className="pt-2 font-semibold text-black">San Salvador, El Salvador, Centroamérica</p>
          </div>
        </div>
      </div>

      {/* Banner de Pantalla (Oculto en modo Impresión / PDF) */}
      <Card className="overflow-hidden border-primary/20 bg-primary/5 print:hidden">
        <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px] tracking-wider uppercase text-primary border-primary/30">
                Tesis Académica UFG · NetScope
              </Badge>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {completedPhasesCount}/5 fases de resultados completadas
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Análisis de Path Inflation en la Infraestructura de Conectividad hacia el Aula Virtual de la UFG
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-muted-foreground">
              Investigación de redes mediante mediciones activas distribuidas con la plataforma RIPE Atlas hacia webdesktop.ufg.edu.sv
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 print:hidden">
            {isRunningAll ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled
                className="gap-2 shadow-sm font-mono text-xs cursor-wait"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                <span className="truncate max-w-[190px]">{pipelineProgress || "Ejecutando..."}</span>
              </Button>
            ) : completedPhasesCount < 5 ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                className="gap-2 shadow-sm active:scale-[0.98] transition-transform duration-100"
                onClick={() => onRunAllPhases?.()}
                disabled={!onRunAllPhases}
              >
                <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                <span>Ejecutar Análisis Completo</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 shadow-sm active:scale-[0.98] transition-transform duration-100"
                onClick={() => onRunAllPhases?.()}
                disabled={!onRunAllPhases}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reejecutar Análisis Completo</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 shadow-sm active:scale-[0.98] transition-transform duration-100"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Imprimir / PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 shadow-sm active:scale-[0.98] transition-transform duration-100 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50"
              onClick={handleDownloadDocx}
              disabled={isDownloadingDocx || !investigation}
              title="Descargar reporte académico completo en formato Microsoft Word (.docx)"
            >
              {isDownloadingDocx ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                  <span>Generando Word...</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <span>Descargar Word (.docx)</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-4 text-xs text-muted-foreground sm:grid-cols-4">
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-foreground/70">Investigación</span>
            <span className="font-medium text-foreground">
              {investigation ? `${investigation.name} (ID: ${investigation.id})` : "Investigación en curso"}
            </span>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-foreground/70">Institución</span>
            <span className="font-medium text-foreground">Universidad Francisco Gavidia</span>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-foreground/70">Autores</span>
            <span className="font-medium text-foreground">E. Herrera · H. Landaverde · W. Vásquez</span>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-foreground/70">Fecha de creación</span>
            <span className="font-medium text-foreground">
              {investigation?.created_at
                ? new Date(investigation.created_at).toLocaleDateString("es-SV", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/D"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Índice de Contenidos (Table of Contents) */}
      <Card className="break-inside-avoid print:hidden border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Índice de Contenidos</CardTitle>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">
              7 Capítulos · Tesis UFG
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <nav className="flex flex-col gap-1 text-sm">
            <a
              href="#chapter-1"
              className="flex items-center justify-between rounded-md px-2.5 py-1.5 font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <span>1. Introducción</span>
              <span className="font-mono text-xs text-muted-foreground">Contexto y objetivos</span>
            </a>
            <a
              href="#chapter-2"
              className="flex items-center justify-between rounded-md px-2.5 py-1.5 font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <span>2. Marco Teórico</span>
              <span className="font-mono text-xs text-muted-foreground">Fundamentos y Path Inflation</span>
            </a>
            <a
              href="#chapter-3"
              className="flex items-center justify-between rounded-md px-2.5 py-1.5 font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <span>3. Metodología</span>
              <span className="font-mono text-xs text-muted-foreground">RIPE Atlas y diseño experimental</span>
            </a>

            {/* Capítulo 4 con subenlaces */}
            <div className="my-1 flex flex-col rounded-md border border-border/40 bg-muted/30 p-2">
              <a
                href="#chapter-4"
                className="flex items-center justify-between px-1 py-1 font-semibold text-foreground transition-colors hover:text-primary"
              >
                <span className="flex items-center gap-2">
                  <span>4. Resultados</span>
                  <Badge variant="secondary" className="px-1.5 py-0 font-mono text-[10px]">
                    {completedPhasesCount}/5 fases
                  </Badge>
                </span>
                <span className="font-mono text-xs text-muted-foreground">Análisis empírico</span>
              </a>
              <div className="ml-2 mt-1 flex flex-col gap-0.5 border-l-2 border-border/60 pl-4">
                {phaseSections.map((sec) => {
                  const hasData = Boolean(sec.data?.elements && sec.data.elements.length > 0)
                  const phaseInt = parseInt(sec.phaseNum.split(".")[1], 10)
                  const isThisPhaseRunning = isRunningAll && runningPhaseNum === phaseInt
                  return (
                    <div
                      key={sec.id}
                      className="flex items-center justify-between rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                    >
                      <a href={`#${sec.id}`} className="truncate hover:text-primary transition-colors pr-2">
                        {sec.title}
                      </a>
                      <div className="flex shrink-0 items-center gap-2">
                        {hasData ? (
                          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                            ✓ {sec.data?.elements?.length} elems
                          </span>
                        ) : isThisPhaseRunning ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-primary">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Procesando...
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400">
                              Pendiente
                            </span>
                            {onRunPhase && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  onRunPhase(phaseInt)
                                }}
                                disabled={isRunningAll}
                                title={`Ejecutar Fase ${phaseInt}`}
                                className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary hover:bg-primary/20 active:scale-95 transition-all duration-100 disabled:opacity-50"
                              >
                                <Play className="h-2.5 w-2.5 fill-current" />
                                Ejecutar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <a
              href="#chapter-5"
              className="flex items-center justify-between rounded-md px-2.5 py-1.5 font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <span>5. Discusión</span>
              <span className="font-mono text-xs text-muted-foreground">Interpretación e impacto</span>
            </a>
            <a
              href="#chapter-6"
              className="flex items-center justify-between rounded-md px-2.5 py-1.5 font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <span>6. Conclusiones</span>
              <span className="font-mono text-xs text-muted-foreground">Síntesis y trabajo futuro</span>
            </a>
            <a
              href="#chapter-7"
              className="flex items-center justify-between rounded-md px-2.5 py-1.5 font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <span>7. Referencias y Fuentes</span>
              <span className="font-mono text-xs text-muted-foreground">Bibliografía y datasets</span>
            </a>
          </nav>
        </CardContent>
      </Card>

      {/* Capítulo 1. Introducción */}
      <section id="chapter-1" className="flex scroll-mt-20 break-inside-avoid print:break-before-page flex-col gap-5">
        <div className="flex flex-col gap-1 border-b border-border pb-2 break-after-avoid print:break-after-avoid print:border-b-2 print:border-black print:pb-2 print:mt-4 print:mb-3">
          <div className="flex items-center gap-2 print:hidden">
            <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
              Capítulo 1
            </Badge>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl break-after-avoid print:break-after-avoid print:text-[16pt] print:font-bold print:text-black">
            1. {ch1.title}
          </h2>
          {ch1.description && (
            <p className="text-sm text-muted-foreground print:text-[10pt] print:italic print:text-gray-700 print:mb-2">{ch1.description}</p>
          )}
        </div>
        {ch1.elements.map((el) => (
          <ElementRenderer key={`${el.type}-${el.id}`} element={el} />
        ))}
      </section>

      {/* Capítulo 2. Marco Teórico */}
      <section id="chapter-2" className="flex scroll-mt-20 break-inside-avoid print:break-before-page flex-col gap-5">
        <div className="flex flex-col gap-1 border-b border-border pb-2 break-after-avoid print:break-after-avoid print:border-b-2 print:border-black print:pb-2 print:mt-4 print:mb-3">
          <div className="flex items-center gap-2 print:hidden">
            <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
              Capítulo 2
            </Badge>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl break-after-avoid print:break-after-avoid print:text-[16pt] print:font-bold print:text-black">
            2. {ch2.title}
          </h2>
          {ch2.description && (
            <p className="text-sm text-muted-foreground print:text-[10pt] print:italic print:text-gray-700 print:mb-2">{ch2.description}</p>
          )}
        </div>
        {ch2.elements.map((el) => (
          <ElementRenderer key={`${el.type}-${el.id}`} element={el} />
        ))}
      </section>

      {/* Capítulo 3. Metodología */}
      <section id="chapter-3" className="flex scroll-mt-20 break-inside-avoid print:break-before-page flex-col gap-5">
        <div className="flex flex-col gap-1 border-b border-border pb-2 break-after-avoid print:break-after-avoid print:border-b-2 print:border-black print:pb-2 print:mt-4 print:mb-3">
          <div className="flex items-center gap-2 print:hidden">
            <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
              Capítulo 3
            </Badge>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl break-after-avoid print:break-after-avoid print:text-[16pt] print:font-bold print:text-black">
            3. {ch3.title}
          </h2>
          {ch3.description && (
            <p className="text-sm text-muted-foreground print:text-[10pt] print:italic print:text-gray-700 print:mb-2">{ch3.description}</p>
          )}
        </div>
        {ch3.elements.map((el) => (
          <ElementRenderer key={`${el.type}-${el.id}`} element={el} />
        ))}
      </section>

      {/* Capítulo 4. Resultados (Donde viven todas las 5 fases) */}
      <section id="chapter-4" className="flex scroll-mt-20 flex-col gap-8 print:break-before-page print:block">
        <div className="flex flex-col gap-2 border-b border-border pb-4 print:border-b-2 print:border-black print:pb-2 print:mb-2 print:block">
          <div className="flex items-center gap-2 print:hidden">
            <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
              Capítulo 4
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">Fases 1 a 5 de análisis empírico</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl print:text-[16pt] print:font-bold print:text-black">
            4. Resultados
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground print:text-[10pt] print:italic print:text-gray-700">
            Hallazgos de las 5 fases de investigación empírica sobre la infraestructura evaluada hacia el aula virtual de la UFG (webdesktop.ufg.edu.sv).
          </p>
        </div>

        <div className="flex flex-col gap-10 print:block">
          {phaseSections.map((sec) => {
            const hasElements = Boolean(sec.data?.elements && sec.data.elements.length > 0)
            const phaseInt = parseInt(sec.phaseNum.split(".")[1], 10)
            const isThisPhaseRunning = isRunningAll && runningPhaseNum === phaseInt

            return (
              <div id={sec.id} key={sec.id} className="flex scroll-mt-20 flex-col gap-5 print:block print:mt-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2 print:border-b print:border-gray-400 print:pb-1.5 print:mt-6 print:mb-2 print:block">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground print:text-[13pt] print:font-bold print:text-black">
                    {sec.title}
                  </h3>
                  <div className="print:hidden">
                    {hasElements ? (
                      <Badge
                        variant="secondary"
                        className="border-emerald-500/20 bg-emerald-500/10 font-mono text-[11px] text-emerald-600 dark:text-emerald-400"
                      >
                        {sec.data?.elements?.length ?? 0} elementos procesados
                      </Badge>
                    ) : isThisPhaseRunning ? (
                      <Badge variant="secondary" className="border-primary/20 bg-primary/10 font-mono text-[11px] text-primary">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin inline" />
                        Procesando fase...
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-mono text-[11px] text-muted-foreground">
                        No ejecutada
                      </Badge>
                    )}
                  </div>
                </div>

                {hasElements ? (
                  sec.data!.elements!.map((el) => (
                    <ElementRenderer key={`${el.type}-${el.id}`} element={el} />
                  ))
                ) : (
                  <MissingPhase
                    phase={sec.phaseNum}
                    title={sec.missingTitle}
                    phaseNumber={phaseInt}
                    onRunPhase={onRunPhase}
                    isRunning={isThisPhaseRunning}
                  />
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Capítulo 5. Discusión */}
      <section id="chapter-5" className="flex scroll-mt-20 break-inside-avoid print:break-before-page flex-col gap-5">
        <div className="flex flex-col gap-1 border-b border-border pb-2 break-after-avoid print:break-after-avoid print:border-b-2 print:border-black print:pb-2 print:mt-4 print:mb-3">
          <div className="flex items-center gap-2 print:hidden">
            <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
              Capítulo 5
            </Badge>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl break-after-avoid print:break-after-avoid print:text-[16pt] print:font-bold print:text-black">
            5. {ch5.title}
          </h2>
          {ch5.description && (
            <p className="text-sm text-muted-foreground print:text-[10pt] print:italic print:text-gray-700 print:mb-2">{ch5.description}</p>
          )}
        </div>
        {ch5.elements.map((el) => (
          <ElementRenderer key={`${el.type}-${el.id}`} element={el} />
        ))}
      </section>

      {/* Capítulo 6. Conclusiones */}
      <section id="chapter-6" className="flex scroll-mt-20 break-inside-avoid print:break-before-page flex-col gap-5">
        <div className="flex flex-col gap-1 border-b border-border pb-2 break-after-avoid print:break-after-avoid print:border-b-2 print:border-black print:pb-2 print:mt-4 print:mb-3">
          <div className="flex items-center gap-2 print:hidden">
            <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
              Capítulo 6
            </Badge>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl break-after-avoid print:break-after-avoid print:text-[16pt] print:font-bold print:text-black">
            6. {ch6.title}
          </h2>
          {ch6.description && (
            <p className="text-sm text-muted-foreground print:text-[10pt] print:italic print:text-gray-700 print:mb-2">{ch6.description}</p>
          )}
        </div>
        {ch6.elements.map((el) => (
          <ElementRenderer key={`${el.type}-${el.id}`} element={el} />
        ))}
      </section>

      {/* Capítulo 7. Referencias y Fuentes */}
      <section id="chapter-7" className="flex scroll-mt-20 break-inside-avoid print:break-before-page flex-col gap-5">
        <div className="flex flex-col gap-1 border-b border-border pb-2 break-after-avoid print:break-after-avoid print:border-b-2 print:border-black print:pb-2 print:mt-4 print:mb-3">
          <div className="flex items-center gap-2 print:hidden">
            <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
              Capítulo 7
            </Badge>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl break-after-avoid print:break-after-avoid print:text-[16pt] print:font-bold print:text-black">
            7. {ch7.title}
          </h2>
          {ch7.description && (
            <p className="text-sm text-muted-foreground print:text-[10pt] print:italic print:text-gray-700 print:mb-2">{ch7.description}</p>
          )}
        </div>
        {ch7.elements.map((el) => (
          <ElementRenderer key={`${el.type}-${el.id}`} element={el} />
        ))}
      </section>
    </div>
  )
}
