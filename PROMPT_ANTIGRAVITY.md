# Prompt para Antigravity — NetScope

Copia y pega todo el bloque de abajo en Antigravity. Antes, adjunta el archivo `CONTEXTO_PROYECTO.md` que ya tienes, y los 10 archivos de código fuente del frontend (`phase-4-view.tsx`, `critical-nodes-table.tsx`, `ai-chat-panel.tsx`, `phase-placeholder.tsx`, `rtt-line-chart.tsx`, `jitter-box-plot.tsx`, `theme-toggle.tsx`, `theme-provider.tsx`, `layout.tsx`, `page.tsx`).

---

## PROMPT

Eres mi asistente de desarrollo para completar **NetScope**, una plataforma local de investigación de redes. Ya leíste `CONTEXTO_PROYECTO.md` con la arquitectura completa y la metodología de las 5 fases. Además te adjunté el código real del frontend existente, generado con v0 (Vercel). Tu tarea es construir el backend completo y conectarlo al frontend sin reescribir ni romper lo que ya funciona visualmente.

### Estado real del frontend (verificado en el código adjunto)

Todo el frontend actualmente usa **datos hardcodeados dentro de cada componente**:

- `rtt-line-chart.tsx` tiene un array `data` fijo con 4 ISPs ficticios: `Tigo`, `Claro`, `Movistar`, `Digicel`, con RTT inventado por hop (1 al 10).
- `jitter-box-plot.tsx` tiene un array `stats` fijo con cuartiles (`min`, `q1`, `median`, `q3`, `max`, `outliers`) para los mismos 4 ISPs ficticios, renderizado como SVG manual (no es un componente de Recharts, es un box plot construido a mano).
- `critical-nodes-table.tsx` tiene un array `nodes` fijo de 9 filas con campos `isp`, `hop`, `ip`, `owner`, `country`, `countryCode`, `category` (`local` | `regional` | `backbone`), `rttAvg`, `delta`.
- `phase-4-view.tsx` tiene los contadores `Probes: 42`, `Targets: 187`, `Anomalías: 9` escritos directamente en el JSX, sin props.
- `ai-chat-panel.tsx` tiene un array `initialMessages` hardcodeado y la función `handleSend` solo hace `setMessages` local — **no llama a ningún backend**, no hay `fetch`, no hay streaming, es pura UI sin conexión.
- `phase-placeholder.tsx` es el componente genérico reutilizado en Fase 1, 2, 3 y 5 (`page.tsx` lo confirma), con un botón "Ejecutar fase" que **no tiene `onClick`**, es decorativo.
- `page.tsx` usa Tabs de shadcn, con `defaultValue="fase-4"`, y monta `Phase4View` directo y `PhasePlaceholder` para las demás. No hay estado global de aplicación, ni Context, ni fetch de ningún tipo en toda la app.

Importante: los 4 ISPs ficticios del mockup (Tigo, Claro, Movistar, Digicel) **no son los ISPs reales** de la investigación. Los ISPs reales según el paper son: Movistar SV, Claro SV, Conective SV, Salnet/UFG, Universidad de El Salvador, UCA, Liberty Networks SV, Navega.com (GT), Globalnet.hn (HN). El backend debe trabajar con los ISPs reales que vengan del JSON de RIPE Atlas cargado, no con los nombres ficticios del mock.

### Lo que tienes que construir

#### 1. Backend completo (`/backend`)

Sigue exactamente la estructura de carpetas descrita en `CONTEXTO_PROYECTO.md`: FastAPI + Python (parseo con Pandas) + R (ggplot2, vía rpy2) + SQLite + cliente de Groq API para el chat.

Implementa las 5 fases con su lógica real, replicando los cálculos descritos en el contexto:

- **Fase 1**: embudo de datos (intentos teóricos → mediciones reales → DNS exitoso → ruta completa), detección de sondas inestables, disponibilidad de enrutamiento, pérdida de paquetes granular (0/1/2/3 paquetes por medición).
- **Fase 2**: selección de sonda de línea base (mejor RTT mediano + menor jitter + menor packet loss), cálculo de RTT min/mediana/promedio/max/jitter por sonda, análisis micro-delta (LAN local vs tránsito real).
- **Fase 3**: mapeo ISP/ASN desde el campo `from` del JSON + lookup de ASN (puedes usar una tabla estática para los ASNs centroamericanos conocidos del paper como fallback, y dejar preparado el lookup real a RDAP de LACNIC como función separada para no bloquear el desarrollo si no hay internet). Detección de ASN registrado fuera de El Salvador. Detección de múltiples IPs de destino (DNS round-robin).
- **Fase 4**: RTT promedio acumulado por hop por ISP, detección de puntos de inflación (delta > 20ms entre hops consecutivos), tabla de nodos críticos con geolocalización (necesitas una función de geolocalización de IP — puedes usar una librería gratuita tipo `ip-api.com` con rate limit generoso, o una tabla local de rangos conocidos como fallback), cálculo de overhead por ISP vs línea base de Fase 2.
- **Fase 5**: RTT mediano por hora del día, evolución diaria, RTT por franja horaria (mañana/tarde/noche/valle), jitter por ISP (boxplot), RTT por día de la semana.

Cada fase debe:
- Recibir el `investigation_id`, cargar el JSON crudo desde SQLite.
- Preparar los datos con Pandas (`phases/python/faseN_prep.py`).
- Llamar al script R correspondiente vía `rpy2` (`phases/r/faseN_*.R`) para el cálculo estadístico final y la generación del PNG exportable.
- Devolver una respuesta JSON con esta forma exacta para que el frontend pueda consumirla sin cambios de tipos:

```python
class FaseResponse(BaseModel):
    metricas_resumen: dict[str, int | float | str]  # ej: {"probes": 42, "targets": 187, "anomalias": 9}
    series_chart: dict                               # datos ya formados para Recharts, mismo shape que el array `data` de rtt-line-chart.tsx
    tabla: list[dict]                                # mismo shape que el array `nodes` de critical-nodes-table.tsx
    boxplot: list[dict] | None                       # mismo shape que el array `stats` de jitter-box-plot.tsx, cuando aplique
    grafica_png_url: str                              # ruta servida por FastAPI al PNG generado por R
    ejecutado_en: str                                 # timestamp ISO
```

Esto es crítico: la forma de `series_chart` debe calzar con lo que `rtt-line-chart.tsx` espera (`{ hop: number, [ispName]: number }[]`), la de `tabla` con lo que `critical-nodes-table.tsx` espera (campos `isp`, `hop`, `ip`, `owner`, `country`, `countryCode`, `category`, `rttAvg`, `delta`), y la de `boxplot` con lo que `jitter-box-plot.tsx` espera (`{ isp, min, q1, median, q3, max, outliers: number[], color }[]`). El frontend ya tiene los componentes de presentación construidos; tu trabajo es producir el dato real con esa forma exacta, no rediseñar los componentes.

Endpoints necesarios:
```
POST /investigations              → crea investigación, sube JSON crudo
GET  /investigations               → lista investigaciones guardadas
GET  /investigations/{id}          → detalle + estado de cada fase (ejecutada o no)
POST /investigations/{id}/fases/{n} → ejecuta la fase n, guarda y devuelve resultado
GET  /investigations/{id}/fases/{n} → recupera resultado ya calculado, sin reprocesar
POST /chat                         → recibe mensaje + investigation_id, construye contexto con resultados ya ejecutados, llama a Groq, devuelve respuesta
GET  /exports/{filename}           → sirve los PNG generados por R desde data/exports/
```

#### 2. Conectar el frontend existente (sin reescribir componentes de presentación)

Modifica únicamente lo necesario para conectar, dejando intacto el diseño visual:

- Crea `lib/api-client.ts` con funciones tipadas: `createInvestigation`, `listInvestigations`, `getInvestigation`, `runPhase(investigationId, phaseNumber)`, `getPhaseResult`, `sendChatMessage`.
- Crea `lib/types.ts` con los tipos que calcen exactamente con `FaseResponse` del backend y con los tipos ya usados en los componentes (`Node` de `critical-nodes-table.tsx`, `BoxStat` de `jitter-box-plot.tsx`, etc.) — reusa esos nombres de tipos, no inventes otros.
- Modifica `rtt-line-chart.tsx`, `jitter-box-plot.tsx` y `critical-nodes-table.tsx` para que **reciban los datos por props** en lugar de los arrays hardcodeados (`data`, `stats`, `nodes`), manteniendo el resto del JSX y estilos exactamente igual. Si no llega ninguna prop, usa el array hardcodeado actual como valor por defecto, para que el componente siga funcionando como demo visual si se monta sin datos reales.
- Modifica `phase-4-view.tsx` para que reciba como prop el `FaseResponse` de la fase 4 y reemplace los valores fijos `42`, `187`, `9` por `metricas_resumen.probes`, `metricas_resumen.targets`, `metricas_resumen.anomalias`. Pasa los datos correspondientes a los tres componentes hijos.
- Modifica `phase-placeholder.tsx` para aceptar una prop `onExecute: () => void` y conectarla al botón "Ejecutar fase" (actualmente sin `onClick`). Añade un estado de carga (spinner o texto "Ejecutando...") mientras se resuelve la llamada.
- Crea componentes `Fase1View.tsx`, `Fase2View.tsx`, `Fase3View.tsx`, `Fase5View.tsx` siguiendo el mismo patrón visual de `phase-4-view.tsx` (header con badge de fase, descripción, métricas resumen, cards con gráficas), pero con el contenido específico de cada fase según la metodología del contexto (tablas de embudo de datos para Fase 1, tabla de ASN para Fase 3, gráficas de RTT por hora para Fase 5, etc.). Usa Recharts para gráficas nuevas que no tengan ya un componente equivalente.
- Modifica `page.tsx` para que mantenga estado de la investigación activa (puedes usar `useState` + Context simple, no hace falta Zustand ni Redux para este alcance), determine para cada tab si la fase ya fue ejecutada (mostrando `Fase{N}View` con datos reales) o no (mostrando `PhasePlaceholder` con el `onExecute` conectado), y muestre la cantidad real de mediciones cargadas en el badge del header (actualmente fijo en "12 mediciones").
- Conecta `ai-chat-panel.tsx` al endpoint `POST /chat` real: al enviar un mensaje, además de hacer `setMessages` local con el mensaje del usuario, llama a la API, muestra un estado de "escribiendo..." mientras espera, y agrega la respuesta real de Groq como nuevo mensaje del asistente. Mantén el manejo de adjuntos tal cual está (puede seguir siendo solo visual por ahora si subir JSON desde el chat no es parte de esta tarea — pero si el adjunto es un `.json`, conéctalo para que dispare `createInvestigation` con ese archivo).
- Crea una página `app/nueva/page.tsx` para subir el JSON inicial de RIPE Atlas y crear la investigación, redirigiendo después a la vista principal con esa investigación cargada.

#### 3. Infraestructura local

- `docker-compose.yml` en la raíz, levantando `backend` (puerto 8000) y `frontend` (puerto 3000), con volúmenes para hot-reload y persistencia de `backend/data/`.
- `backend/Dockerfile` con Python 3.12 + R base + paquetes R (`tidyverse`, `ggplot2`, `dplyr`, `lubridate`, `jsonlite`, `knitr`) + `rpy2`.
- `frontend/Dockerfile` para Next.js.
- `.env.example` con `GROQ_API_KEY=` como placeholder.

### Restricciones que debes respetar sin excepción

- No reescribas `rtt-line-chart.tsx`, `jitter-box-plot.tsx`, `critical-nodes-table.tsx`, `ai-chat-panel.tsx`, `phase-4-view.tsx`, `phase-placeholder.tsx`, `theme-toggle.tsx`, `theme-provider.tsx` desde cero. Edítalos quirúrgicamente: agrega props, conecta el `onClick` que falta, reemplaza el array hardcodeado por la prop con fallback al mismo array como default. El JSX, las clases de Tailwind, la estructura visual y los componentes de shadcn usados deben seguir siendo los mismos.
- No uses Vercel, ni ningún servicio cloud de pago, en ningún punto.
- No reemplaces SQLite por Postgres/MySQL.
- No reemplaces R por solo Python para el análisis estadístico — R debe seguir siendo el motor de cálculo y generación de gráficas exportables, vía `rpy2`.
- No uses APIs de IA de pago como proveedor por defecto del chat — usa Groq.
- Antes de escribir cualquier código, confirma que entendiste la forma exacta de los tipos `Node`, `BoxStat` y el array `data` de `rtt-line-chart.tsx`, porque el backend tiene que producir datos con esa forma exacta sin que el frontend tenga que adaptarse.

Empieza por: 1) la estructura de carpetas y `docker-compose.yml`, 2) el parser del JSON de RIPE Atlas y el modelo de SQLite, 3) la Fase 1 completa de punta a punta (backend + conexión al `Fase1View` nuevo) como prueba de que el pipeline funciona, antes de continuar con las fases restantes.
