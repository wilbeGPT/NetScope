library(ggplot2)

generate_fase2_report <- function(df, output_path) {
  if (nrow(df) == 0 || all(is.na(df$rtt))) {
    png(output_path, width = 2400, height = 1500, res = 300)
    plot.new()
    title("Linea base RTT por proveedor")
    dev.off()
    return(list(sonda_optima = "N/D", rtt_minimo = 0, rtt_promedio = 0))
  }

  label_col <- if ("identity_label" %in% names(df)) "identity_label" else "prb_id"
  labels <- as.factor(df[[label_col]])
  min_rtt <- min(df$rtt, na.rm = TRUE)
  avg_rtt <- mean(df$rtt, na.rm = TRUE)
  best_label <- as.character(df[[label_col]][which.min(df$rtt)])

  p <- ggplot(df, aes(x = labels, y = rtt)) +
    geom_boxplot(fill="lightblue") +
    theme_minimal() +
    labs(title = "Linea Base RTT por Proveedor", x = "Proveedor / ASN", y = "RTT (ms)") +
    theme(axis.text.x = element_text(angle = 30, hjust = 1))

  ggsave(output_path, plot = p, width = 8, height = 5, dpi = 300)

  return(list(sonda_optima = best_label, rtt_minimo = min_rtt, rtt_promedio = avg_rtt))
}