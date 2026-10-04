"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UploadCloud, Loader2 } from "lucide-react"
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
    <div className="flex h-svh w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nueva Investigacion</CardTitle>
          <CardDescription>Sube un archivo JSON de RIPE Atlas</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 border-border">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
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
          {file && <p className="text-sm font-medium text-center">{file.name}</p>}
          <Button disabled={!file || loading} onClick={handleUpload}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Procesar JSON y Comenzar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}