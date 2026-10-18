from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import os
import shutil
from datetime import datetime

from core.database import get_db
from core import models
from phases.python.parser import load_ripe_measurements, validate_ripe_traceroute_measurements

router = APIRouter()

os.makedirs("./data/uploads", exist_ok=True)


_count_cache: dict[tuple[str, int], int] = {}


def count_measurements(raw_json_path: str) -> int:
    """Return a best-effort measurement count with mtime-based caching."""
    try:
        stat = os.stat(raw_json_path)
        cache_key = (raw_json_path, stat.st_mtime_ns)
        if cache_key in _count_cache:
            return _count_cache[cache_key]
        count = len(load_ripe_measurements(raw_json_path))
        _count_cache[cache_key] = count
        return count
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


@router.get("/{inv_id}/report-template")
def get_investigation_report_template(inv_id: int, db: Session = Depends(get_db)):
    from routers.report_template import get_report_template
    return get_report_template(inv_id=inv_id, db=db)


@router.get("/{inv_id}/export/docx")
def export_investigation_docx(inv_id: int, db: Session = Depends(get_db)):
    import json
    import re
    from fastapi.responses import Response
    from services.academic_report import generate_contextualized_template
    from services.docx_export import generate_thesis_docx

    inv = db.query(models.Investigation).filter(models.Investigation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    results = db.query(models.PhaseResult).filter(models.PhaseResult.investigation_id == inv_id).all()
    phase_data: dict[int, dict] = {}
    for r in results:
        try:
            phase_data[r.phase_number] = json.loads(r.result_json)
        except Exception:
            pass

    template = generate_contextualized_template(inv, phase_data)
    stream = generate_thesis_docx(inv, template, phase_data)

    safe_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', inv.name or f"investigacion_{inv.id}")
    filename = f"Tesis_UFG_{safe_name}.docx"

    return Response(
        content=stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )



class UpdateInvestigationPayload(BaseModel):
    name: str = Field(..., min_length=1)


@router.patch("/{inv_id}")
@router.put("/{inv_id}")
def update_investigation(inv_id: int, payload: UpdateInvestigationPayload, db: Session = Depends(get_db)):
    inv = db.query(models.Investigation).filter(models.Investigation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    new_name = payload.name.strip()
    if not new_name:
        raise HTTPException(status_code=422, detail="Name cannot be empty")

    inv.name = new_name
    db.commit()
    db.refresh(inv)

    return {
        "id": inv.id,
        "name": inv.name,
        "created_at": inv.created_at,
        "measurement_count": count_measurements(inv.raw_json_path),
    }


@router.delete("/{inv_id}")
def delete_investigation(inv_id: int, db: Session = Depends(get_db)):
    inv = db.query(models.Investigation).filter(models.Investigation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    # Delete associated phase execution records
    db.query(models.PhaseResult).filter(models.PhaseResult.investigation_id == inv_id).delete()

    # Clean up uploaded raw JSON file if it exists
    if inv.raw_json_path and os.path.exists(inv.raw_json_path):
        try:
            os.remove(inv.raw_json_path)
        except OSError:
            pass

    # Delete investigation record
    db.delete(inv)
    db.commit()

    return {"message": "Investigation deleted successfully", "id": inv_id}
