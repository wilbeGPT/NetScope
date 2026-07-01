# Contexto del Proyecto — NetScope

## Qué es este proyecto

NetScope es una plataforma personal de investigación para analizar mediciones de red de RIPE Atlas, específicamente para estudiar el fenómeno de **Path Inflation** (cuando el tráfico de Internet viaja por rutas más largas de lo geográficamente necesario antes de llegar a su destino).

Es un proyecto de **uso personal**, sin costes, que corre **localmente en Windows con Docker**. No se va a desplegar en ningún servicio de nube (no Vercel, no AWS, nada). Todo vive en la máquina del investigador.

## Origen y propósito

Este proyecto nace de una investigación académica real de la Universidad Francisco Gavidia (UFG) sobre Path Inflation en la conectividad hacia su plataforma de educación virtual. La investigación original se hizo de forma manual con Python/Pandas analizando archivos JSON exportados de RIPE Atlas. NetScope automatiza y replica esa metodología de 5 fases para que pueda reutilizarse en futuras investigaciones, con cualquier archivo JSON de mediciones RIPE Atlas.

## La metodología de 5 fases (esto es lo más importante)

El núcleo del análisis siempre sigue esta estructura, tomada directamente de la investigación original:

### Fase 1 — Integridad de la Red y Análisis de Disponibilidad
- Calcula el "embudo de datos": intentos teóricos programados vs mediciones reales vs mediciones con DNS exitoso vs mediciones con ruta completa.
- Detecta sondas inestables (períodos de desconexión).
- Calcula disponibilidad a nivel de enrutamiento (% de "Destination Reached: True").
- Análisis granular de pérdida de paquetes (cuántos de los 3 paquetes por medición llegaron).

### Fase 2 — Establecimiento de la Línea Base de Eficiencia
- Identifica la sonda con mejores métricas de red (menor RTT, menor jitter, menor packet loss) como referencia de "ruta óptima".
- Calcula RTT mínimo, mediana, promedio, máximo y jitter (StdDev) por sonda.
- Hace un "análisis micro-delta": cuánto tiempo se consume en la LAN local vs en tránsito por la red pública.

### Fase 3 — Mapeo de Proveedores e Identificación de ASNs
- Identifica el ISP y ASN (Sistema Autónomo) de cada sonda usando 3 fuentes: campo `from` del JSON, plataforma RIPE Atlas, y API RDAP de LACNIC.
- Hallazgo clave a buscar: ASNs registrados en un país distinto al de operación real (esto es una causa estructural de path inflation).
- Detecta inestabilidad de sondas específicas (desconexiones, cambios de IP dinámica).
- Si el servidor destino tiene múltiples IPs públicas (DNS round-robin), las separa y compara.

### Fase 4 — Demostración del Path Inflation (el núcleo del análisis)
- Grafica RTT promedio acumulado por hop, por ISP (Gráfica de líneas, eje X = número de hop, eje Y = RTT en ms).
- Identifica "puntos de inflación": saltos donde el delta de RTT entre un hop y el siguiente supera 20ms (umbral porque eso equivale a más de 2000km de distancia física, imposible de explicar por infraestructura local).
- Geolocaliza los nodos críticos de tránsito (ej: nodos en España, Suecia, Estados Unidos, Perú antes de volver al destino local).
- Calcula el "overhead de Path Inflation" por ISP: diferencia entre el RTT real y la línea base óptima establecida en Fase 2.
- Genera tabla y gráfica de barras horizontales del overhead por ISP, ordenado descendente.

### Fase 5 — Estabilidad Temporal: Horas Pico y Jitter
- RTT mediano por hora del día (0-23h), por ISP, para detectar si el path inflation empeora en horas de uso académico.
- Evolución diaria del RTT a lo largo de todo el período de medición.
- RTT mediano por franja horaria (mañana/tarde/noche/valle), con columna de diferencia pico vs valle.
- Jitter por ISP: boxplot de la desviación estándar de los 3 paquetes enviados a cada hop de destino.
- RTT por día de la semana (para detectar patrones laborable vs fin de semana).

## Estructura de datos de entrada

El input siempre es un archivo JSON exportado directamente de la API de mediciones de RIPE Atlas (`https://atlas.ripe.net/api/v2/measurements/`), tipo Traceroute sobre TCP. Cada registro tiene esta forma aproximada:

```json
{
  "msm_id": 12345678,
  "prb_id": 1014263,
  "from": "181.225.133.162",
  "dst_addr": "45.227.202.7",
  "dst_name": "webdesktop.ufg.edu.sv",
  "timestamp": 1740340800,
  "result": [
    {
      "hop": 1,
      "result": [
        { "from": "192.168.1.1", "rtt": 0.79 },
        { "from": "192.168.1.1", "rtt": 0.81 },
        { "from": "192.168.1.1", "rtt": 0.85 }
      ]
    }
  ]
}
```

Detalles importantes del schema real de RIPE Atlas que el parser debe manejar:
- Un hop puede tener menos de 3 resultados, o resultados con `"x": "*"` en lugar de `rtt` (timeout, no significa pérdida de paquete real).
- El campo `paris_id` puede estar presente (Paris Traceroute, fuerza que todos los paquetes tomen la misma ruta física en presencia de balanceo ECMP).
- `dst_addr` puede variar entre mediciones si el servidor destino usa DNS round-robin con múltiples IPs.
- Direcciones IP privadas (RFC 1918, ej `192.168.x.x`) en el destino indican una sonda dentro de la misma red local del servidor — deben excluirse del análisis de routing externo.

## Arquitectura de software

**Tipo de arquitectura: Monolítica modular con separación frontend/backend**, corriendo en contenedores Docker en la máquina local del usuario (Windows). No hay infraestructura en la nube. Cero costos.

```
┌─────────────────────────────────────────────────────────────────┐
│                         WINDOWS LOCAL                            │
│                                                                  │
│  ┌──────────────────┐    ┌─────────────────┐  ┌───────────────┐ │
│  │   Next.js        │    │    FastAPI       │  │  Groq API     │ │
│  │   localhost:3000 │◄──►│    localhost:8000│◄─►│  (gratuita)  │ │
│  │                  │    │                  │  └───────────────┘ │
│  │  Panel chat IA   │    │  Orquestador     │                    │
│  │  Panel de fases  │    │  de 5 fases      │  ┌───────────────┐ │
│  │  Gráficas        │    │  Python + R      │◄─►│   SQLite     │ │
│  │  (Recharts)      │    │                  │  │   local       │ │
│  └──────────────────┘    └────────┬────────┘  └───────────────┘ │
│                                   │                              │
│                          ┌────────▼────────┐                     │
│                          │   R Engine      │                     │
│                          │   (ggplot2)     │                     │
│                          │   exporta PNG   │                     │
│                          └─────────────────┘                     │
└──────────────────────────────────────────────────────────────────┘
```

### Stack tecnológico definitivo

| Capa | Tecnología | Rol |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind + shadcn/ui | UI, ya existe un diseño hecho en v0 que debe respetarse |
| Gráficas interactivas | Recharts | Se muestran en pantalla, en el panel derecho |
| Gráficas de publicación | R + ggplot2 | Exportables a PNG/PDF con calidad académica |
| Backend / API | FastAPI (Python) | Orquesta el análisis, expone endpoints REST |
| Análisis de datos | Pandas + NumPy (preparación) + R (estadística/gráficas) | Pandas limpia y estructura, R analiza y grafica |
| Puente Python↔R | rpy2 | Permite llamar funciones R desde Python sin proceso separado |
| Asistente de IA del chat | Groq API, modelo Llama 3.1 70B (gratuito, 14,400 req/día) | Interpreta y explica los resultados de cada fase en lenguaje natural |
| Base de datos | SQLite | Persiste investigaciones para no reprocesar el JSON cada vez |
| Orquestación de contenedores | Docker Compose | Un solo comando levanta frontend + backend |

### Por qué estas decisiones (para que Antigravity no las cuestione)

- **No se usa backend en la nube ni Vercel**: es expresamente un proyecto local, sin costos, para investigación personal.
- **R se usa junto a Python deliberadamente**: el usuario quiere R para el rigor estadístico y la calidad de gráficas tipo paper académico, y Python para el parseo/orquestación. No reemplazar R por solo Python.
- **Groq en vez de OpenAI/Claude de pago**: requisito explícito de cero costos. Si se cambia de proveedor de IA en el futuro, debe ser por otro con tier gratuito (ej. Gemini), nunca uno de pago por defecto.
- **SQLite en vez de Postgres**: no se necesita un servidor de base de datos separado para uso personal en una sola máquina.
- **Docker Compose en vez de instalación manual**: para que el entorno (Python + R + sus librerías) sea reproducible sin fricción en Windows.

## Estructura de carpetas esperada

```
netscope/
├── docker-compose.yml
├── .env                              # GROQ_API_KEY=...
│
├── backend/
│   ├── Dockerfile                    # imagen con Python Y R instalados
│   ├── requirements.txt
│   ├── main.py                       # entry point FastAPI
│   │
│   ├── routers/
│   │   ├── analyze.py                # POST /analyze/fase/{n}
│   │   ├── chat.py                   # POST /chat (llama a Groq)
│   │   ├── investigations.py         # CRUD de investigaciones guardadas
│   │   └── export.py                 # exportar PNG/PDF/CSV
│   │
│   ├── services/
│   │   ├── orchestrator.py           # coordina el pipeline de las 5 fases
│   │   ├── r_bridge.py               # wrapper de rpy2
│   │   └── ai_service.py             # cliente de la API de Groq
│   │
│   ├── phases/
│   │   ├── python/                   # preparación de datos por fase
│   │   │   ├── parser.py             # JSON RIPE Atlas crudo -> DataFrame limpio
│   │   │   ├── fase1_prep.py
│   │   │   ├── fase2_prep.py
│   │   │   ├── fase3_prep.py
│   │   │   ├── fase4_prep.py
│   │   │   └── fase5_prep.py
│   │   └── r/                        # análisis estadístico + gráficas ggplot2
│   │       ├── fase1_disponibilidad.R
│   │       ├── fase2_linea_base.R
│   │       ├── fase3_mapeo_asn.R
│   │       ├── fase4_path_inflation.R
│   │       └── fase5_jitter.R
│   │
│   ├── core/
│   │   ├── models.py                 # Pydantic + SQLAlchemy
│   │   ├── database.py               # conexión SQLite
│   │   └── constants.py              # umbrales (20ms delta, 53.98ms línea base ejemplo, etc.)
│   │
│   └── data/
│       ├── netscope.db               # SQLite
│       └── exports/                  # PNG/PDF generados por R
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── app/
│   │   ├── page.tsx                  # home: lista de investigaciones
│   │   ├── nueva/page.tsx            # subir JSON nuevo
│   │   └── investigacion/[id]/page.tsx  # layout principal (ver diseño de referencia)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── ChatPanel.tsx         # panel izquierdo: chat con Gemma/Groq
│   │   │   └── PhasePanel.tsx        # panel derecho: tabs Fase 1-5 + resultados
│   │   ├── chat/
│   │   ├── phases/
│   │   │   ├── PhaseNav.tsx          # navegación entre las 5 fases (tabs superiores)
│   │   │   ├── PhaseEmpty.tsx        # estado "Esta fase aún no se ha ejecutado" + botón Ejecutar
│   │   │   ├── Fase1View.tsx
│   │   │   ├── Fase2View.tsx
│   │   │   ├── Fase3View.tsx
│   │   │   ├── Fase4View.tsx
│   │   │   └── Fase5View.tsx
│   │   └── charts/                   # un componente Recharts por gráfica del paper
│   │       ├── RttPerHopChart.tsx
│   │       ├── PathInflationBar.tsx
│   │       ├── RttPerHourChart.tsx
│   │       ├── DailyRttChart.tsx
│   │       └── JitterBoxPlot.tsx
│   └── lib/
│       ├── api-client.ts
│       └── types.ts
│
└── notebooks/
    ├── exploracion.ipynb             # Jupyter, análisis exploratorio adicional
    └── reporte.Rmd                   # R Markdown, para generar PDF de investigación
```

## Diseño de UI ya existente (referencia obligatoria)

Ya existe un diseño hecho en v0 (Vercel) que debe respetarse como base visual. Layout de dos columnas:

- **Panel izquierdo (fijo, ~30% del ancho):** chat con el asistente de IA llamado "Gemma 4" (visualmente, aunque el motor real detrás sea Groq). Header con avatar, nombre, estado "ONLINE". Lista de mensajes estilo chat. Input inferior con botones de adjuntar archivo, adjuntar imagen, selector de modelo, botón Enviar. Texto de ayuda: "Adjunta JSON de RIPE Atlas, CSV procesados, gráficas o capturas para enriquecer el análisis."

- **Panel derecho (70% del ancho):** navegación superior con 5 tabs/cards, una por fase (Fase 1: Integridad, Fase 2: Línea Base, Fase 3: Mapeo ASN, Fase 4: Path Inflation, Fase 5: Estabilidad), cada una con su ícono. Debajo, el contenido de la fase seleccionada:
  - Si no se ha ejecutado: mensaje "Esta fase aún no se ha ejecutado" + botón "Ejecutar fase".
  - Si ya se ejecutó: título de la fase, descripción metodológica, métricas resumen en cards (ej: PROBES, TARGETS, ANOMALÍAS para Fase 4), y la(s) gráfica(s) correspondientes con Recharts.

- **Header superior global:** logo "NetScope", breadcrumb tipo "ripe-atlas · path-inflation-lab", badge de cantidad de mediciones cargadas, badge de versión, toggle de tema claro/oscuro.

El nombre del proyecto en la UI es **NetScope**.

## Flujo funcional completo (de punta a punta)

1. Usuario sube un archivo JSON de RIPE Atlas desde `/nueva`.
2. Backend lo guarda en SQLite asociado a una nueva investigación, junto con el JSON crudo original (para poder reprocesar si se mejora algún algoritmo).
3. Usuario navega a `/investigacion/[id]` y ve las 5 fases como "no ejecutadas".
4. Usuario hace clic en "Ejecutar fase" en cualquier fase (no es obligatorio el orden, aunque Fase 2 y Fase 4 tienen dependencia lógica entre sí porque Fase 4 usa la línea base calculada en Fase 2).
5. Backend ejecuta: `parser.py` → `faseN_prep.py` (Pandas) → `r_bridge.py` llama al script R correspondiente → R calcula y genera PNG en `data/exports/` → resultados (tablas + datos para Recharts + ruta de PNG) se guardan en SQLite y se devuelven al frontend.
6. Frontend renderiza la fase con Recharts usando los datos JSON, y ofrece el PNG generado por R como descarga para uso en documentos académicos.
7. En paralelo, el usuario puede chatear en el panel izquierdo. Cada mensaje al backend (`POST /chat`) incluye como contexto los resultados de las fases ya ejecutadas, para que la IA (vía Groq) pueda responder con datos reales, por ejemplo: "Detecté path inflation significativa en 4 nodos críticos. Tigo presenta un delta de 87.4 ms en el hop 6 hacia AS-3356 (Level3, US)."

## Constantes y umbrales clave del paper que el código debe usar

- Umbral de "punto de path inflation": delta de RTT > 20 ms entre un hop y el siguiente.
- Clasificación de severidad: 20-40ms = salto regional (amarillo), >40ms = cruce intercontinental (rojo).
- Bandas de interpretación de RTT absoluto por hop: <15ms = red local (verde), 15-40ms = backbone regional (amarillo), 40-80ms = tránsito internacional (naranja), >80ms = nodo fuera de región (rojo).
- Umbrales de QoE (calidad de experiencia) por latencia: <50ms imperceptible, 50-150ms aceptable, >200ms degradación notable.
- Una medición de RIPE Atlas se considera "exitosa" si al menos 1 de 3 paquetes recibe respuesta (esto puede generar discrepancia entre "disponibilidad" y "pérdida de paquetes real").

## Lo que NO se debe hacer

- No desplegar nada en Vercel, AWS, ni ningún proveedor cloud de pago.
- No usar APIs de IA de pago (OpenAI, Claude vía API de pago, etc.) como opción por defecto.
- No usar Postgres/MySQL — SQLite es suficiente y deliberado.
- No reemplazar R por Python puro para el análisis estadístico — es un requisito explícito tener ambos lenguajes.
- No romper el diseño visual ya existente del v0; extenderlo, no reinventarlo.
