from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from app.db.session import get_session
from app.models.user import User
from app.schemas.auth import Token
from app.core.security import verify_password, create_access_token
from app.api.deps import get_current_user
from app.schemas.user import UserRead
from app.api.deps import require_itf, require_requester_roles, require_viewer_roles

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    user = session.exec(
        select(User).where(User.employee_id == form_data.username)
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    access_token = create_access_token(subject=user.employee_id)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/only-itf")
def only_itf_route(current_user: User = Depends(require_itf)):
    return {
        "message": "Acesso liberado para ITF",
        "employee_id": current_user.employee_id,
        "role": current_user.role,
    }


@router.get("/only-requesters")
def only_requesters(current_user: User = Depends(require_requester_roles)):
    return {
        "message": "Acesso liberado para perfis solicitantes",
        "employee_id": current_user.employee_id,
        "role": current_user.role,
    }


@router.get("/only-viewers")
def only_viewers(current_user: User = Depends(require_viewer_roles)):
    return {
        "message": "Acesso liberado para visualização",
        "employee_id": current_user.employee_id,
        "role": current_user.role,
    }