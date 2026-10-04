# Network Analysis Platform

Plataforma para analizar archivos JSON de mediciones de RIPE Atlas y generar resultados por fases.

## Activar el proyecto

Abre PowerShell en la carpeta del proyecto:

```powershell
cd C:\Users\wilbe\Downloads\network-analysis-platform
```

Levanta backend y frontend con Docker:

```powershell
docker compose up
```

Cuando los servicios esten listos, abre la app en:

```text
http://localhost:3000
```

El backend queda disponible en:

```text
http://localhost:8000
```

## Reiniciar la app

Si cambiaste codigo o aparece un error de chunks de Next.js, reinicia el frontend:

```powershell
docker compose restart frontend
```

Despues recarga el navegador con `Ctrl + F5`.

## Detener el proyecto

Para detener los servicios:

```powershell
docker compose down
```

## Notas

- El archivo `docker-compose.yml` define los servicios `backend` y `frontend`.
- El frontend usa `NEXT_PUBLIC_API_URL=http://localhost:8000`.
- Para analizar datos, entra a la app y sube el archivo JSON desde la interfaz.
