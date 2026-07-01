library(ggplot2)
library(dplyr)

generate_fase4_report <- function(df, output_path) {
  probes <- length(unique(df$prb_id))
  targets <- length(unique(df$hop))
  
  p <- ggplot(df, aes(x = hop, y = rtt, group = prb_id, color = factor(prb_id))) +
    geom_line(alpha=0.6) +
    geom_point(size=1) +
    theme_minimal() +
    labs(title = "RTT Acumulado por Hop", x = "Hop", y = "RTT (ms)", color = "Probe ID") +
    theme(legend.position = "bottom")
    
  ggsave(output_path, plot = p, width = 8, height = 5, dpi = 300)
  
  return(list(
    probes = probes,
    targets = targets
  ))
}
