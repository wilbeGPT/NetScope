from fastapi import APIRouter

from services.report_template import public_report_template

router = APIRouter()


@router.get("")
def get_report_template():
    return public_report_template()
