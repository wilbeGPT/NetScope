import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from core.database import get_db
from core import models
from services.orchestrator import execute_phase

router = APIRouter()

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
        
    try:
        response_data = execute_phase(inv_id, inv.raw_json_path, phase_number, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
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
