library(ggplot2)

generate_fase5_report <- function(df, output_path) {
  p <- ggplot(df, aes(x = rtt, fill = factor(prb_id))) +
    geom_density(alpha=0.5) +
    theme_minimal() +
    labs(title = "Estabilidad Temporal: Densidad de Jitter", x = "RTT (ms)", y = "Densidad", fill="Probe ID")
    
  ggsave(output_path, plot = p, width = 8, height = 5, dpi = 300)
  
  return(list())
}
