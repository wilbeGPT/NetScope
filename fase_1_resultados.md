# 4.1 Fase 1 - Integridad de la Red y Analisis de Disponibilidad

La primera fase evalua la integridad inicial del conjunto de mediciones de RIPE Atlas y permite identificar si la informacion recolectada es suficiente para sustentar los analisis posteriores. Esta fase se enfoca en cuatro aspectos: el alcance del conjunto de datos, la diferencia entre mediciones esperadas y mediciones efectivamente registradas, los eventos de inactividad por sonda y la perdida de paquetes a nivel granular.

El periodo de observacion corresponde a siete dias de medicion continua, con una frecuencia teorica de cuatro mediciones por hora para catorce sondas. Bajo esta configuracion se esperaban 9,408 mediciones. El archivo final contiene 9,087 registros, lo que representa una cobertura efectiva de 96.59 % y una perdida operativa de 321 mediciones, equivalente al 3.41 % del volumen programado.

## 4.1.1 Alcance del conjunto de datos

El conjunto de datos contiene mediciones hacia tres direcciones IP de destino: `45.227.202.7`, `200.124.138.24` y `192.168.18.33`. De los 9,087 registros crudos, 9,085 tienen una direccion de destino dentro de este grupo, mientras que dos registros presentan falla de resolucion DNS y no contienen una IP de destino resuelta.

**Figura 1. Distribucion de mediciones por direccion IP de destino resuelta.**

| IP de destino | Sondas asociadas | Mediciones | Alcance observado |
|---|---:|---:|---|
| 45.227.202.7 | 14 | 8,509 | Principal destino publico de la medicion. |
| 200.124.138.24 | 3 | 233 | Destino secundario observado durante el periodo. |
| 192.168.18.33 | 1 | 308 | Direccion privada detectada en la sonda 64959. |
| Sin IP resuelta | 1 | 2 | Fallas puntuales de resolucion DNS en la sonda 65161. |

**Figura 2. Detalle de mediciones por categoria de destino.**

Insertar aqui la grafica generada en Jupyter: `Cantidad de Mediciones por Sonda y por IP de Destino`.

La distribucion muestra que la mayor parte de la actividad se concentra en `45.227.202.7`. El destino `200.124.138.24` aparece en un subconjunto reducido de sondas, mientras que la direccion privada `192.168.18.33` se asocia especificamente con la sonda 64959. Esta separacion es importante porque permite distinguir mediciones hacia destinos publicos, mediciones hacia una IP secundaria y registros que no deben mezclarse con el analisis de conectividad publica.

## 4.1.2 Calculo de embudo de datos

El embudo de datos compara el volumen teorico esperado contra el volumen realmente registrado. La diferencia entre ambos permite medir la completitud de la muestra antes de interpretar latencia, disponibilidad o perdida de paquetes.

**Figura 3. Detalle de fallas de DNS en la sonda 65161.**

| Estado de medicion | Cantidad | Proporcion |
|---|---:|---:|
| Registradas exitosamente en el JSON | 9,087 | 96.59 % |
| Perdidas por apagado, desconexion o ausencia de registro | 321 | 3.41 % |
| Total teorico programado | 9,408 | 100.00 % |

Adicionalmente, se identificaron dos registros donde el campo `dst_addr` aparece vacio. Ambos corresponden a la sonda 65161 y al dominio `webdesktop.ufg.edu.sv`, lo cual evidencia fallas puntuales de resolucion DNS durante el periodo de medicion.

| ID de sonda | Fecha y hora CST | Dominio objetivo | IP resuelta |
|---:|---|---|---|
| 65161 | 2026-02-26 15:05:06 | webdesktop.ufg.edu.sv | None |
| 65161 | 2026-03-01 06:50:05 | webdesktop.ufg.edu.sv | None |

## 4.1.3 Analisis de inestabilidad de sondas

El analisis de disponibilidad por sonda permite separar los problemas de conectividad del destino de los problemas originados por interrupciones locales en las sondas. En esta fase se observa que trece sondas alcanzaron el 100.00 % de disponibilidad teorica, mientras que la sonda 1013115 registro 351 mediciones de 672 esperadas.

**Figura 4. Registro de periodos de inactividad por sonda.**

La sonda 1013115 concentra la perdida operativa de la fase: 321 mediciones faltantes y una disponibilidad de 52.23 %. Su actividad inicio el 2026-02-23 08:21:25 CST y finalizo el 2026-03-01 22:21:26 CST, con varios intervalos prolongados sin mediciones.

**Figura 5. Tabla analitica de desconexiones por sonda durante la semana de medicion.**

| Sonda | Mediciones registradas | Mediciones perdidas | Disponibilidad |
|---:|---:|---:|---:|
| 1013586 | 672 | 0 | 100.00 % |
| 1014263 | 672 | 0 | 100.00 % |
| 64062 | 672 | 0 | 100.00 % |
| 64166 | 672 | 0 | 100.00 % |
| 64366 | 672 | 0 | 100.00 % |
| 64959 | 672 | 0 | 100.00 % |
| 65093 | 672 | 0 | 100.00 % |
| 65161 | 672 | 0 | 100.00 % |
| 65301 | 672 | 0 | 100.00 % |
| 65415 | 672 | 0 | 100.00 % |
| 7607 | 672 | 0 | 100.00 % |
| 7650 | 672 | 0 | 100.00 % |
| 7673 | 672 | 0 | 100.00 % |
| 1013115 | 351 | 321 | 52.23 % |

**Figura 6. Distribucion temporal de mediciones de las sondas que han tenido apagones.**

Insertar aqui la grafica generada en Jupyter: `Disponibilidad de la Sonda 1013115 con Tiempos de Caida`.

Los huecos detectados en la sonda 1013115 son los siguientes:

| Inicio del hueco CST | Fin del hueco CST | Duracion |
|---|---|---:|
| 2026-02-23 12:36:25 | 2026-02-23 14:06:27 | 1.50 h |
| 2026-02-24 23:06:24 | 2026-02-25 07:36:27 | 8.50 h |
| 2026-02-26 01:21:24 | 2026-02-26 08:21:24 | 7.00 h |
| 2026-02-26 18:51:25 | 2026-02-27 08:36:25 | 13.75 h |
| 2026-02-27 11:36:27 | 2026-02-27 12:36:24 | 1.00 h |
| 2026-02-27 16:51:26 | 2026-02-28 20:06:27 | 27.25 h |
| 2026-02-28 22:21:24 | 2026-03-01 10:21:25 | 12.00 h |
| 2026-03-01 20:06:26 | 2026-03-01 21:36:24 | 1.50 h |

Estos cortes explican la brecha entre el total teorico y el total real de mediciones. Por ello, la sonda 1013115 debe tratarse con cautela en las fases siguientes, especialmente cuando se comparen metricas agregadas entre sondas.

## 4.1.4 Analisis de perdida de paquetes a nivel granular

Para el analisis granular se revisaron los paquetes enviados al salto final de las mediciones publicas. En total se contabilizaron 26,331 paquetes enviados al destino final: 25,838 fueron recibidos y 493 se perdieron. Esto equivale a una tasa global de exito de 98.13 % y una perdida global de 1.87 %.

**Figura 7. Distribucion de paquetes recibidos por medicion: 0, 1, 2 o 3 paquetes respondidos.**

| Sonda | Paquetes enviados | Recibidos | Perdidos | Exito | Perdida |
|---:|---:|---:|---:|---:|---:|
| 65415 | 2,016 | 1,530 | 486 | 75.89 % | 24.11 % |
| 1013586 | 2,016 | 2,016 | 0 | 100.00 % | 0.00 % |
| 7650 | 2,016 | 2,016 | 0 | 100.00 % | 0.00 % |
| 64166 | 2,016 | 2,015 | 1 | 99.95 % | 0.05 % |
| 64366 | 2,016 | 2,016 | 0 | 100.00 % | 0.00 % |
| 65301 | 2,016 | 2,015 | 1 | 99.95 % | 0.05 % |
| 7607 | 2,016 | 2,016 | 0 | 100.00 % | 0.00 % |
| 7673 | 2,016 | 2,016 | 0 | 100.00 % | 0.00 % |
| 1014263 | 2,016 | 2,015 | 1 | 99.95 % | 0.05 % |
| 64062 | 2,016 | 2,016 | 0 | 100.00 % | 0.00 % |
| 65093 | 2,016 | 2,016 | 0 | 100.00 % | 0.00 % |
| 65161 | 2,010 | 2,007 | 3 | 99.85 % | 0.15 % |
| 64959 | 1,092 | 1,092 | 0 | 100.00 % | 0.00 % |
| 1013115 | 1,053 | 1,052 | 1 | 99.91 % | 0.09 % |
| Total | 26,331 | 25,838 | 493 | 98.13 % | 1.87 % |

La sonda 65415 concentra practicamente toda la perdida granular observada, con 486 paquetes perdidos de 2,016 enviados. En contraste, la mayoria de sondas presenta perdida nula o marginal, lo cual sugiere que la perdida no es un comportamiento generalizado del sistema de medicion, sino un evento localizado.

**Figura 8. Resumen estadistico de perdida de paquetes a nivel granular.**

| Patron observado | Mediciones |
|---|---:|
| Perfecto: 3 de 3 paquetes llegaron | 8,434 |
| Limitacion leve: 2 de 3 paquetes llegaron | 194 |
| Limitacion fuerte: 1 de 3 paquetes llego | 148 |
| Caida total: 0 de 3 paquetes llegaron | 1 |

El total de paquetes descartados en patrones parciales fue de 490 paquetes. Este valor se obtiene al sumar un paquete perdido por cada medicion con limitacion leve y dos paquetes perdidos por cada medicion con limitacion fuerte. La diferencia frente a los 493 paquetes perdidos totales se explica por los tres paquetes asociados a la unica medicion con caida total.

## Sintesis de la Fase 1

La Fase 1 confirma que el conjunto de datos es suficientemente completo para continuar con el analisis: se recupero el 96.59 % de las mediciones teoricas programadas y trece de las catorce sondas mantuvieron disponibilidad completa durante la semana. Las principales anomalias se concentran en dos puntos: la sonda 1013115, responsable de 321 mediciones no registradas por periodos de inactividad, y la sonda 65415, responsable de la mayor parte de la perdida de paquetes observada a nivel granular.

Por tanto, las fases siguientes deben considerar estas dos condiciones como advertencias metodologicas: la sonda 1013115 puede sesgar comparaciones por disponibilidad, mientras que la sonda 65415 puede influir en indicadores de perdida de paquetes si se interpreta junto con sondas que no presentan el mismo comportamiento.
