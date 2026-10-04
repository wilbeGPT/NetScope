import { FileText } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FaseResponse } from "@/lib/types"

const notesByPhase: Record<number, { title: string; bullets: string[] }> = {
  1: {
    title: "Lectura metodologica de integridad",
    bullets: [
      "La tabla de alcance delimita el universo analizado antes de interpretar disponibilidad o perdida.",
      "El embudo separa intentos observados, respuestas RTT, resolucion de destino y rutas completas.",
      "La figura por categoria de destino permite identificar si el conjunto esta concentrado en destinos locales, nacionales o externos.",
    ],
  },
  2: {
    title: "Lectura metodologica de linea base",
    bullets: [
      "La ruta optima por proveedor/ASN se usa como referencia operativa para comparar rutas menos eficientes.",
      "La tabla RTT por proveedor resume dispersion y estabilidad mediante minimos, mediana, promedio, maximos y jitter.",
      "El micro-delta separa el costo local LAN del transito publico para aislar donde se consume la latencia.",
    ],
  },
  3: {
    title: "Lectura metodologica de mapeo ASN",
    bullets: [
      "El inventario de proveedores, ASNs y origenes explica decisiones de enrutamiento observadas.",
      "La tabla de destinos detecta variacion por DNS round-robin o multiples direcciones objetivo.",
      "La identificacion ISP/ASN se deriva de la IP origen cuando la fuente externa responde; si no, conserva el probe como respaldo trazable.",
    ],
  },
  4: {
    title: "Lectura metodologica de path inflation",
    bullets: [
      "Los saltos con delta RTT mayor a 20 ms se tratan como puntos criticos de inflacion de ruta.",
      "La tabla de nodos criticos cruza hop, IP, operador y pais para ubicar el desvio logico.",
      "El overhead compara el RTT final contra la linea base optima y ordena el impacto por proveedor/ASN.",
    ],
  },
  5: {
    title: "Lectura metodologica de estabilidad temporal",
    bullets: [
      "Las series por hora y por dia muestran si la latencia aumenta en ventanas de mayor uso.",
      "La tabla pico-valle cuantifica la diferencia entre franjas horarias por proveedor/ASN.",
      "El boxplot resume variabilidad y outliers para distinguir jitter persistente de eventos puntuales.",
    ],
  },
}

export function ReportInterpretation({ phase, data, content }: { phase?: number; data?: FaseResponse; content?: string }) {
  const note = phase ? notesByPhase[phase] : null

  return (
    <Card className="border-primary/20 bg-primary/5 py-4">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
          {note?.title ?? "Interpretacion"}
        </CardTitle>
        <CardDescription className="text-xs">
          Sintesis interpretativa basada en las tablas, figuras y metricas generadas para esta fase.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pt-3">
        {content ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>
        ) : (
          <ul className="grid gap-1.5 text-sm text-muted-foreground">
            {note?.bullets.map((item) => (
              <li key={item} className="leading-relaxed">{item}</li>
            ))}
          </ul>
        )}
        {data?.ejecutado_en && (
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">Ejecutado: {data.ejecutado_en}</p>
        )}
      </CardContent>
    </Card>
  )
}