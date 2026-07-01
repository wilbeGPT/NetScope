import json
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from datetime import datetime, timezone

from core.database import get_db
from core import models
from services.orchestrator import execute_phase

router = APIRouter()

os.makedirs("./data/uploads", exist_ok=True)

@router.post("/")
async def create_investigation(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Save the uploaded JSON
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"ripe_{timestamp}_{file.filename}"
    file_path = os.path.join("./data/uploads", filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    investigation = models.Investigation(
        name=f"Investigación {timestamp}",
        raw_json_path=file_path
    )
    db.add(investigation)
    db.commit()
    db.refresh(investigation)
    return {"id": investigation.id, "name": investigation.name}

@router.get("/")
def list_investigations(db: Session = Depends(get_db)):
    invs = db.query(models.Investigation).order_by(models.Investigation.created_at.desc()).all()
    return [{"id": i.id, "name": i.name, "created_at": i.created_at} for i in invs]

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
        "executed_phases": executed_phases
    }

@router.get("/{inv_id}/fases/{phase_number}")
def get_phase_result(inv_id: int, phase_number: int, db: Session = Depends(get_db)):
    result = db.query(models.PhaseResult).filter(
        models.PhaseResult.investigation_id == inv_id,
        models.PhaseResult.phase_number == phase_number
    ).first()
    
    if result:
        return json.loads(result.result_json)
        
    raise HTTPException(status_code=404, detail="Phase not executed yet")

@router.post("/{inv_id}/fases/{phase_number}")
def run_phase(inv_id: int, phase_number: int, db: Session = Depends(get_db)):
    inv = db.query(models.Investigation).filter(models.Investigation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
        
    # Execute through orchestrator
    try:
        response_data = execute_phase(inv_id, inv.raw_json_path, phase_number, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    # Cache result
    result_record = db.query(models.PhaseResult).filter(
        models.PhaseResult.investigation_id == inv_id,
        models.PhaseResult.phase_number == phase_number
    ).first()
    
    if not result_record:
        result_record = models.PhaseResult(
            investigation_id=inv_id,
            phase_number=phase_number
        )
        db.add(result_record)
        
    result_record.result_json = json.dumps(response_data)
    result_record.executed_at = datetime.now(timezone.utc)
    db.commit()
    
    return response_data
