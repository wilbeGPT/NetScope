from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from core.database import get_db
from core.models import Investigation, PhaseResult
from services.ai_service import ask_gemini
import json

router = APIRouter()

class ChatRequest(BaseModel):
    investigation_id: int
    message: str

@router.post("/ask")
def ask_chat(req: ChatRequest, db: Session = Depends(get_db)):
    # Gather context from the investigation
    inv = db.query(Investigation).filter(Investigation.id == req.investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
        
    context_data = []
    
    # Fetch phase results
    results = db.query(PhaseResult).filter(PhaseResult.investigation_id == req.investigation_id).all()
    for res in results:
        # We can pass the summary metrics as context
        data = json.loads(res.data)
        metrics = data.get("metricas_resumen", {})
        context_data.append(f"Fase {res.phase_number}: {metrics}")
        
    context_str = "\n".join(context_data)
    
    # Send to Gemini
    reply = ask_gemini(req.message, context=context_str)
    
    return {"reply": reply}
