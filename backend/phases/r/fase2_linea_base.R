library(ggplot2)

generate_fase2_report <- function(df, output_path) {
  min_rtt <- min(df$rtt, na.rm = TRUE)
  avg_rtt <- mean(df$rtt, na.rm = TRUE)
  best_probe <- df$prb_id[which.min(df$rtt)]
  
  p <- ggplot(df, aes(x = factor(prb_id), y = rtt)) +
    geom_boxplot(fill="lightblue") +
    theme_minimal() +
    labs(title = "Línea Base RTT por Sonda", x = "Probe ID", y = "RTT (ms)")
    
  ggsave(output_path, plot = p, width = 8, height = 5, dpi = 300)
  
  return(list(sonda_optima = as.character(best_probe), rtt_minimo = min_rtt, rtt_promedio = avg_rtt))
}
