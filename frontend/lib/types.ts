export type BoxStat = {
  isp: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers: number[]
  outlierCount?: number
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

export type ReportValue = string | number
export type ReportRow = Record<string, ReportValue>
export type ChartRow = Record<string, ReportValue>

export type AcademicMetadata = {
  caption?: string
  source?: string
  method?: string
  notes?: string[]
  unit?: string
  sample_size?: number
}

export type ReportTable = AcademicMetadata & {
  id: string
  title: string
  columns: string[]
  rows: ReportRow[]
}

export type ReportFigure = AcademicMetadata & {
  id: string
  title: string
  kind: "png" | "bar" | "line" | "area" | "table" | "boxplot" | string
  url?: string
  dataKey?: string
  categoryKey?: string
  baseline?: number
}

export type HourlyRttRow = { hour: string } & Record<string, ReportValue>
export type DailyRttRow = { date: string } & Record<string, ReportValue>
export type WeekdayRttRow = { weekday: string } & Record<string, ReportValue>

export type TemporalCharts = {
  hourly?: HourlyRttRow[]
  daily?: DailyRttRow[]
  weekday?: WeekdayRttRow[]
}

export type FaseResponse = {
  metricas_resumen: Record<string, ReportValue>
  series_chart: ChartRow[]
  tabla: Node[]
  boxplot: BoxStat[] | null
  grafica_png_url: string
  ejecutado_en: string
  elements?: ReportElement[]
  report_tables?: ReportTable[]
  report_figures?: ReportFigure[]
  temporal_charts?: TemporalCharts
  overhead_chart?: { isp: string; delta_ms: number }[]
}

export type Investigation = {
  id: number
  name: string
  created_at: string
  measurement_count?: number
  executed_phases?: number[]
}

export type ReportElementType = "CHART" | "DATA_TABLE" | "INTERPRETATION_BLOCK" | "PNG" | "TABLE"

export type ReportElement = AcademicMetadata & {
  id: string
  title: string
  description?: string
  type: ReportElementType
  content?: string
  columns?: string[]
  rows?: ReportRow[] | ChartRow[]
  kind?: string
  url?: string
  dataKey?: string
  dataKeys?: string[]
  categoryKey?: string
}

export type ReportChapter = {
  chapter: number
  section: string
  title: string
  description: string
  elements: ReportElement[]
}

export type ReportTemplate = {
  name: string
  description: string
  data_policy: string
  chapters: ReportChapter[]
}

