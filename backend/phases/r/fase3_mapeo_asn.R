library(ggplot2)

generate_fase3_report <- function(df, output_path) {
  label_col <- if ("provider_label" %in% names(df)) "provider_label" else if ("identity_label" %in% names(df)) "identity_label" else "prb_id"
  labels <- as.factor(df[[label_col]])

  p <- ggplot(df, aes(x = hop, fill = labels)) +
    geom_bar(position="dodge") +
    theme_minimal() +
    labs(title = "Distribucion de Hops por Proveedor/ASN", x = "Hop", y = "Frecuencia", fill="Proveedor / ASN") +
    theme(legend.position = "bottom")

  ggsave(output_path, plot = p, width = 8, height = 5, dpi = 300)

  return(list(total_asns = length(unique(labels)), asns_extranjeros = 0))
}