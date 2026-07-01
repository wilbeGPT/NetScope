from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os

router = APIRouter()

@router.get("/{filename}")
def serve_export(filename: str):
    file_path = os.path.join("./data/exports", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Export not found")
    return FileResponse(file_path)
