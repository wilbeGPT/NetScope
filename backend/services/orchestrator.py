import logging
import traceback

from sqlalchemy.orm import Session
from phases.python.parser import parse_ripe_json
from phases.python import fase1_prep, fase2_prep, fase3_prep, fase4_prep, fase5_prep
from services.academic_report import enrich_academic_metadata

logger = logging.getLogger(__name__)


def execute_phase(inv_id: int, raw_json_path: str, phase_number: int, db: Session) -> dict:
    """
    Orchestrates the execution of a given phase by parsing JSON and delegating.
    """
    try:
        df = parse_ripe_json(raw_json_path)

        if phase_number == 1:
            return enrich_academic_metadata(fase1_prep.execute(df, inv_id))
        elif phase_number == 2:
            return enrich_academic_metadata(fase2_prep.execute(df, inv_id))
        elif phase_number == 3:
            return enrich_academic_metadata(fase3_prep.execute(df, inv_id))
        elif phase_number == 4:
            return enrich_academic_metadata(fase4_prep.execute(df, inv_id, db))
        elif phase_number == 5:
            return enrich_academic_metadata(fase5_prep.execute(df, inv_id))

        raise NotImplementedError(f"Phase {phase_number} is not implemented yet.")
    except Exception as e:
        logger.error(
            "Error orquestando fase %s para investigacion %s desde %s: %s",
            phase_number,
            inv_id,
            raw_json_path,
            e,
        )
        logger.error(traceback.format_exc())
        raise
