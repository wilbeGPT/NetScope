"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, FileJson2, Loader2, UploadCloud } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createInvestigation } from "@/lib/api-client"

export default function NuevaInvestigacion() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    try {
      const { id } = await createInvestigation(file)
      router.push(`/investigacion/${id}`)
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  return (
    <div className="app-shell flex min-h-svh w-full items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-2xl overflow-hidden border-border/80 py-0 shadow-lg">
        <CardHeader className="border-b px-6 py-6 sm:px-8">
          <Link href="/" className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver a investigaciones
          </Link>
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><FileJson2 className="h-5 w-5" /></div>
            <div><CardTitle className="text-2xl">Nueva investigación</CardTitle>
          <CardDescription className="mt-2 max-w-lg leading-6">Carga la exportación JSON de RIPE Atlas. NetScope conservará el archivo fuente y preparará sus módulos de análisis.</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 px-6 py-6 sm:px-8">
          <div className="flex items-center justify-center w-full">
            <label className="upload-dropzone flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="mb-3 h-10 w-10 text-primary" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Selecciona un archivo</span> o arrástralo aquí
                </p>
                <p className="text-xs text-muted-foreground">JSON exportado de RIPE Atlas</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".json"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          {file && <p className="flex items-center justify-center gap-2 text-sm font-medium text-chart-3"><CheckCircle2 className="h-4 w-4" />{file.name}</p>}
          <Button disabled={!file || loading} onClick={handleUpload}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Procesar JSON y Comenzar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
