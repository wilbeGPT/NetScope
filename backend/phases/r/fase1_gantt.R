library(ggplot2)
library(dplyr)
library(scales)

label_status <- function(status) {
  ifelse(status == "Activa", "Activa", "Apagada")
}

generate_gantt <- function(df, output_path) {
  if (nrow(df) == 0 || is.null(output_path) || output_path == "") {
    return(list(status="empty"))
  }

  df$start_time <- as.POSIXct(df$start_time, origin="1970-01-01", tz="America/El_Salvador")
  df$end_time <- as.POSIXct(df$end_time, origin="1970-01-01", tz="America/El_Salvador")
  df$probe_id <- ifelse(is.na(df$probe_id), "N/D", as.character(df$probe_id))
  probe_label <- df$probe_id[1]

  df$ymin <- ifelse(df$status == "Activa", 1.75, 0.75)
  df$ymax <- ifelse(df$status == "Activa", 2.25, 1.25)

  p <- ggplot(df) +
    # Background guide tracks for each status lane
    annotate("rect", xmin = min(df$start_time), xmax = max(df$end_time), ymin = 1.70, ymax = 2.30,
             fill = "#1e293b", alpha = 0.5) +
    annotate("rect", xmin = min(df$start_time), xmax = max(df$end_time), ymin = 0.70, ymax = 1.30,
             fill = "#1e293b", alpha = 0.5) +
    geom_rect(aes(xmin = start_time, xmax = end_time, ymin = ymin, ymax = ymax, fill = status),
              color = "#0f172a", linewidth = 0.4) +
    geom_label(data = subset(df, status == "Apagada" & label != ""),
               aes(x = start_time + (end_time - start_time)/2, y = 1.0, label = label),
               color = "#f8fafc", fill = "#1e293b", size = 3.2, fontface = "bold",
               label.padding = unit(0.25, "lines"), label.r = unit(0.2, "lines"),
               label.size = 0.3) +
    scale_fill_manual(values = c("Activa" = "#10b981", "Apagada" = "#ef4444")) +
    scale_y_continuous(breaks = c(1, 2), labels = c("Apagada", "Activa"), limits = c(0.4, 2.6)) +
    scale_x_datetime(date_labels = "%d %b\n%I:%M %p", date_breaks = "1 day") +
    theme_minimal() +
    theme(
      plot.background = element_rect(fill = "#090d16", color = NA),
      panel.background = element_rect(fill = "#0f172a", color = "#1e293b", linewidth = 0.5),
      panel.grid.minor = element_blank(),
      panel.grid.major.y = element_blank(),
      panel.grid.major.x = element_line(linetype = "dashed", color = "#334155", linewidth = 0.3),
      plot.title = element_text(face = "bold", hjust = 0.5, size = 13, color = "#f8fafc", margin = margin(b = 12)),
      axis.title.y = element_blank(),
      axis.title.x = element_blank(),
      axis.text.y = element_text(face = "bold", size = 11, color = "#e2e8f0"),
      axis.text.x = element_text(size = 9, color = "#94a3b8", family = "mono"),
      legend.position = "none",
      plot.margin = margin(t = 14, r = 16, b = 14, l = 16)
    ) +
    labs(title = paste("Disponibilidad temporal de la sonda", probe_label, "con tiempos de caida"))

  ggsave(output_path, plot = p, width = 12, height = 4.2, dpi = 150)
  return(list(status="ok"))
}
