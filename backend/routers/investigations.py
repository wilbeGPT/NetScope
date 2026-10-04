from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import os
import shutil
from datetime import datetime

from core.database import get_db
from core import models
from phases.python.parser import load_ripe_measurements, validate_ripe_traceroute_measurements

router = APIRouter()

os.makedirs("./data/uploads", exist_ok=True)


def count_measurements(raw_json_path: str) -> int:
    """Return a best-effort measurement count without failing the list endpoint."""
    try:
        return len(load_ripe_measurements(raw_json_path))
    except (OSError, ValueError):
        return 0


@router.post("/")
async def create_investigation(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Save the uploaded JSON
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"ripe_{timestamp}_{file.filename}"
    file_path = os.path.join("./data/uploads", filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        validate_ripe_traceroute_measurements(load_ripe_measurements(file_path))
    except (OSError, ValueError) as exc:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    investigation = models.Investigation(
        name=f"Investigacion {timestamp}",
        raw_json_path=file_path
    )
    db.add(investigation)
    db.commit()
    db.refresh(investigation)
    return {"id": investigation.id, "name": investigation.name}


@router.get("/")
def list_investigations(db: Session = Depends(get_db)):
    invs = db.query(models.Investigation).order_by(models.Investigation.created_at.desc()).all()
    return [
        {
            "id": i.id,
            "name": i.name,
            "created_at": i.created_at,
            "measurement_count": count_measurements(i.raw_json_path),
        }
        for i in invs
    ]


@router.get("/{inv_id}")
def get_investigation(inv_id: int, db: Session = Depends(get_db)):
    inv = db.query(models.Investigation).filter(models.Investigation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # Get phases executed
    results = db.query(models.PhaseResult.phase_number).filter(models.PhaseResult.investigation_id == inv_id).all()
    executed_phases = [r[0] for r in results]

    return {
        "id": inv.id,
        "name": inv.name,
        "created_at": inv.created_at,
        "measurement_count": count_measurements(inv.raw_json_path),
        "executed_phases": executed_phases
    }
