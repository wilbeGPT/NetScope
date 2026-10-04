import { ReportFigure } from "@/lib/types"

export function getFigure(figures: ReportFigure[] | undefined, id: string): ReportFigure | undefined {
  return figures?.find((figure) => figure.id === id)
}

export function figureTitle(figure: ReportFigure | undefined, fallback: string): string {
  return figure?.title ?? fallback
}

export function figureDescription(figure: ReportFigure | undefined, fallback: string): string {
  return (figure as (ReportFigure & { description?: string }) | undefined)?.description ?? fallback
}