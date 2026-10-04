library(ggplot2)
library(dplyr)

generate_fase4_report <- function(df, output_path) {
  label_col <- if ("provider_label" %in% names(df)) "provider_label" else if ("identity_label" %in% names(df)) "identity_label" else "prb_id"
  labels <- as.factor(df[[label_col]])
  providers <- length(unique(labels))
  targets <- if ("dst_addr" %in% names(df)) length(unique(na.omit(df$dst_addr))) else length(unique(df$hop))

  p <- ggplot(df, aes(x = hop, y = rtt, group = labels, color = labels)) +
    geom_line(alpha=0.6) +
    geom_point(size=1) +
    theme_minimal() +
    labs(title = "RTT Acumulado por Hop y Proveedor", x = "Hop", y = "RTT (ms)", color = "Proveedor / ASN") +
    theme(legend.position = "bottom")

  ggsave(output_path, plot = p, width = 8, height = 5, dpi = 300)

  return(list(
    probes = providers,
    targets = targets
  ))
}