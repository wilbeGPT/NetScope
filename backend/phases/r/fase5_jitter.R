library(ggplot2)

generate_fase5_report <- function(df, output_path) {
  label_col <- if ("identity_label" %in% names(df)) "identity_label" else "prb_id"
  labels <- as.factor(df[[label_col]])

  p <- ggplot(df, aes(x = rtt, fill = labels)) +
    geom_density(alpha=0.5) +
    theme_minimal() +
    labs(title = "Estabilidad Temporal: Densidad de RTT", x = "RTT (ms)", y = "Densidad", fill="Proveedor / ASN") +
    theme(legend.position = "bottom")

  ggsave(output_path, plot = p, width = 8, height = 5, dpi = 300)

  return(list())
}