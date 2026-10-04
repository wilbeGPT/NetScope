"use client"

import { Tabs, TabsContent } from "@/components/ui/tabs"
import { PhaseNav } from "@/components/phases/PhaseNav"
import { PhaseEmpty } from "@/components/phases/PhaseEmpty"
import { Fase1View } from "@/components/phases/Fase1View"
import { Fase2View } from "@/components/phases/Fase2View"
import { Fase3View } from "@/components/phases/Fase3View"
import { Fase4View } from "@/components/phases/Fase4View"
import { Fase5View } from "@/components/phases/Fase5View"
import { ReportView } from "@/components/phases/ReportView"
import { Activity, GitBranch, Network, Radar, ShieldCheck } from "lucide-react"
import { FaseResponse, Investigation, ReportTemplate } from "@/lib/types"

export function PhasePanel({
  investigation,
  reportTemplate,
  fase1Data,
  fase2Data,
  fase3Data,
  fase4Data,
  fase5Data,
  onRunPhase,
}: {
  investigation: Investigation | null
  reportTemplate?: ReportTemplate | null
  fase1Data: FaseResponse | null
  fase2Data: FaseResponse | null
  fase3Data: FaseResponse | null
  fase4Data: FaseResponse | null
  fase5Data: FaseResponse | null
  onRunPhase: (n: number) => Promise<void>
}) {
  return (
    <main className="flex min-h-0 flex-col overflow-y-auto print:overflow-visible">
      <Tabs defaultValue="reporte" className="flex flex-col">
        <PhaseNav />
        <div className="px-6 py-6 print:px-0">
          <TabsContent value="reporte" className="mt-0">
            <ReportView
              investigation={investigation}
              reportTemplate={reportTemplate}
              fase1Data={fase1Data}
              fase2Data={fase2Data}
              fase3Data={fase3Data}
              fase4Data={fase4Data}
              fase5Data={fase5Data}
            />
          </TabsContent>
          <TabsContent value="fase-1" className="mt-0">
            {fase1Data ? (
              <Fase1View data={fase1Data} />
            ) : (
              <PhaseEmpty
                phase="Fase 1"
                title="Validacion de Integridad"
                description="Verificacion de consistencia y completitud de las mediciones de RIPE Atlas antes del analisis estadistico."
                icon={ShieldCheck}
                onExecute={() => onRunPhase(1)}
              />
            )}
          </TabsContent>
          <TabsContent value="fase-2" className="mt-0">
            {fase2Data ? (
              <Fase2View data={fase2Data} />
            ) : (
              <PhaseEmpty
                phase="Fase 2"
                title="Construccion de Linea Base RTT"
                description="Calculo de metricas base de latencia por proveedor/ASN y destino para identificar el comportamiento normal de la red."
                icon={Activity}
                onExecute={() => onRunPhase(2)}
              />
            )}
          </TabsContent>
          <TabsContent value="fase-3" className="mt-0">
            {fase3Data ? (
              <Fase3View data={fase3Data} />
            ) : (
              <PhaseEmpty
                phase="Fase 3"
                title="Mapeo ASN"
                description="Asociacion de cada hop con su Sistema Autonomo operativo y propietario para reconstruir la topologia logica."
                icon={GitBranch}
                onExecute={() => onRunPhase(3)}
              />
            )}
          </TabsContent>
          <TabsContent value="fase-4" className="mt-0">
            {fase4Data ? (
              <Fase4View data={fase4Data} />
            ) : (
              <PhaseEmpty
                phase="Fase 4"
                title="Deteccion de Path Inflation"
                description="Comparacion de trayectorias geograficas vs. logicas en mediciones para identificar desvios."
                icon={Network}
                onExecute={() => onRunPhase(4)}
              />
            )}
          </TabsContent>
          <TabsContent value="fase-5" className="mt-0">
            {fase5Data ? (
              <Fase5View data={fase5Data} />
            ) : (
              <PhaseEmpty
                phase="Fase 5"
                title="Analisis de Estabilidad Temporal"
                description="Evaluacion de la persistencia del path inflation a lo largo del tiempo y deteccion de variaciones de ruta."
                icon={Radar}
                onExecute={() => onRunPhase(5)}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </main>
  )
}