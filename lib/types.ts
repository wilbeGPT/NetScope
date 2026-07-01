export type BoxStat = {
  isp: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers: number[]
  color: string
}

export type CountryCategory = "local" | "regional" | "backbone"

export type Node = {
  isp: string
  hop: number
  ip: string
  owner: string
  country: string
  countryCode: string
  category: CountryCategory
  rttAvg: number
  delta: number
}

export type FaseResponse = {
  metricas_resumen: Record<string, string | number>
  series_chart: any[] 
  tabla: Node[]
  boxplot: BoxStat[] | null
  grafica_png_url: string
  ejecutado_en: string
}

export type Investigation = {
  id: number
  name: string
  created_at: string
  executed_phases?: number[]
}
