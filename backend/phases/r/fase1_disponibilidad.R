library(ggplot2)
library(dplyr)

generate_fase1_report <- function(df) {
  # Calculate overall metrics matching the Data Funnel
  total_intentos <- sum(df$total_packets)
  mediciones_reales <- sum(df$successful_packets) # Approximation based on successful packet counts returned by R input
  dns_exitoso <- sum(!is.na(df$dst_addr)) * 3
  disponibilidad_pct <- (sum(df$successful_packets) / total_intentos) * 100
  
  # Return metrics as a list
  return(list(
    total_intentos = total_intentos,
    mediciones_reales = mediciones_reales,
    dns_exitoso = dns_exitoso,
    disponibilidad_pct = disponibilidad_pct
  ))
}
