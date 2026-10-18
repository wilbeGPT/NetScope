import json
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from core import models
from services.report_template import public_report_template
from services.academic_report import generate_contextualized_template

router = APIRouter()


@router.get("")
def get_report_template(inv_id: Optional[int] = None, db: Session = Depends(get_db)):
    if not inv_id:
        return public_report_template()

    inv = db.query(models.Investigation).filter(models.Investigation.id == inv_id).first()
    if not inv:
        return public_report_template()

    results = db.query(models.PhaseResult).filter(models.PhaseResult.investigation_id == inv_id).all()
    phase_data: dict[int, dict] = {}
    for r in results:
        try:
            phase_data[r.phase_number] = json.loads(r.result_json)
        except Exception:
            pass

    return generate_contextualized_template(inv, phase_data)
