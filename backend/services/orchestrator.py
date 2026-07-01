from sqlalchemy.orm import Session
from phases.python.parser import parse_ripe_json
from phases.python import fase1_prep, fase2_prep, fase3_prep, fase4_prep, fase5_prep

def execute_phase(inv_id: int, raw_json_path: str, phase_number: int, db: Session) -> dict:
    """
    Orchestrates the execution of a given phase by parsing JSON and delegating.
    """
    df = parse_ripe_json(raw_json_path)
    
    if phase_number == 1:
        return fase1_prep.execute(df, inv_id)
    elif phase_number == 2:
        return fase2_prep.execute(df, inv_id)
    elif phase_number == 3:
        return fase3_prep.execute(df, inv_id)
    elif phase_number == 4:
        return fase4_prep.execute(df, inv_id, db)
    elif phase_number == 5:
        return fase5_prep.execute(df, inv_id)
    
    raise NotImplementedError(f"Phase {phase_number} is not implemented yet.")
