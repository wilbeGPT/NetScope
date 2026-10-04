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

  df$ymin <- ifelse(df$status == "Activa", 1.8, 0.8)
  df$ymax <- ifelse(df$status == "Activa", 2.2, 1.2)

  p <- ggplot(df) +
    geom_rect(aes(xmin = start_time, xmax = end_time, ymin = ymin, ymax = ymax, fill = status), color="black", linewidth=0.2) +
    geom_label(data = subset(df, status == "Apagada" & label != ""),
               aes(x = start_time + (end_time - start_time)/2, y = 1.0, label = label),
               color = "black", fill = "white", size = 3, fontface = "bold",
               label.padding = unit(0.2, "lines"), label.r = unit(0.15, "lines")) +
    scale_fill_manual(values = c("Activa" = "#81c784", "Apagada" = "#e57373")) +
    scale_y_continuous(breaks = c(1, 2), labels = c("Apagada", "Activa"), limits = c(0.5, 2.5)) +
    scale_x_datetime(date_labels = "%d %b\n%I:%M %p", date_breaks = "1 day") +
    theme_bw() +
    theme(
      legend.position = "none",
      panel.grid.minor = element_blank(),
      panel.grid.major.y = element_blank(),
      panel.grid.major.x = element_line(linetype = "dotted", color = "gray80"),
      plot.title = element_text(face = "bold", hjust = 0.5, size = 14),
      axis.title.y = element_blank(),
      axis.title.x = element_blank(),
      axis.text.y = element_text(face = "bold", size=10)
    ) +
    labs(title = paste("Disponibilidad de la sonda", probe_label, "con tiempos de caida"))

  ggsave(output_path, plot = p, width = 12, height = 4, dpi = 150)
  return(list(status="ok"))
}
