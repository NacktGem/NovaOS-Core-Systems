from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.base import get_session
from app.db.models import DMCAReport, User
from app.security.jwt import get_current_user

router = APIRouter(prefix="/dmca", tags=["dmca"])


class DMCAReportBody(BaseModel):
    reporter_email: str
    content_ref: str
    details: str


@router.post("/report")
def report(
    body: DMCAReportBody,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    report = DMCAReport(
        reporter_email=body.reporter_email,
        content_ref=body.content_ref,
        details=body.details,
    )
    session.add(report)
    session.flush()
    return {"id": str(report.id)}
