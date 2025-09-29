import secrets
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.base import get_session
from app.db.models import User
from app.security.jwt import create_token, get_current_user
from app.security.passwords import verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginBody(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(body: LoginBody, response: Response, session: Session = Depends(get_session)):
    user = session.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="invalid credentials")
    claims = {"email": user.email, "role": user.role, "tiers": user.tiers}
    if user.role == "godmode":
        claims["flags"] = {"godmode_bypass": True}
    token = create_token(str(user.id), claims)
    csrf_token = secrets.token_urlsafe(16)
    response.set_cookie(
        "access_token", token, httponly=True, samesite="Strict", secure=False
    )
    response.set_cookie("csrf_token", csrf_token, httponly=False, samesite="Strict", secure=False)
    return {"id": str(user.id), "role": user.role, "tiers": user.tiers}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("csrf_token")
    return {"ok": True}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"id": str(user.id), "email": user.email, "role": user.role, "tiers": user.tiers}
