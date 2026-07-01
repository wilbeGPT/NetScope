library(ggplot2)
library(dplyr)

generate_fase1_report <- function(df, output_path) {
  # Calculate overall metrics matching the Data Funnel
  total_intentos <- sum(df$total_packets)
  mediciones_reales <- sum(df$successful_packets) # rough approx for demo
  dns_exitoso <- sum(!is.na(df$dst_addr)) * 3
  disponibilidad_pct <- (sum(df$successful_packets) / total_intentos) * 100
  
  # Generate a plot (e.g. bar chart of success vs timeout per probe)
  p <- ggplot(df, aes(x = factor(prb_id), y = successful_packets)) +
    geom_bar(stat = "identity", fill = "steelblue") +
    theme_minimal() +
    labs(title = "Paquetes exitosos por Probe", x = "Probe ID", y = "Paquetes")
    
  ggsave(output_path, plot = p, width = 8, height = 5, dpi = 300)
  
  # Return metrics as a list
  return(list(
    total_intentos = total_intentos,
    mediciones_reales = mediciones_reales,
    dns_exitoso = dns_exitoso,
    disponibilidad_pct = disponibilidad_pct
  ))
}
