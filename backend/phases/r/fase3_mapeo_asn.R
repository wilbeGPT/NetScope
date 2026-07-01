library(ggplot2)

generate_fase3_report <- function(df, output_path) {
  asns <- unique(df$prb_id)
  
  p <- ggplot(df, aes(x = hop, fill = factor(prb_id))) +
    geom_bar(position="dodge") +
    theme_minimal() +
    labs(title = "Distribución de Hops por ASN", x = "Hop", y = "Frecuencia", fill="Probe ID")
    
  ggsave(output_path, plot = p, width = 8, height = 5, dpi = 300)
  
  return(list(total_asns = length(asns), asns_extranjeros = 2)) # Mock 2 foreign
}
