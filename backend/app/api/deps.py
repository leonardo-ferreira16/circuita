from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from jose import JWTError
from sqlmodel import Session, select

from app.core.security import decode_access_token
from app.db.session import get_session
from app.models.user import User
from app.models.enums import UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# Autenticação
def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        employee_id = payload.get("sub")

        if employee_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = session.exec(
        select(User).where(User.employee_id == employee_id)
    ).first()

    if user is None:
        raise credentials_exception

    return user


# Usuário ativo
def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo",
        )

    return current_user


# Exclusivo ITF
def require_itf(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if current_user.role != UserRole.ITF:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido apenas para o perfil ITF",
        )

    return current_user


# Perfis que podem gerenciar solicitações de equipamento
# A regra fina do local fica dentro da rota:
# ITF -> pode tudo
# GESTOR_GEAD -> só pode GEAD
def require_equipment_manager_roles(
    current_user: User = Depends(get_current_active_user),
) -> User:
    allowed_roles = {
        UserRole.ITF,
        UserRole.GESTOR_GEAD,
    }

    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido apenas para gestores de equipamentos",
        )

    return current_user


def require_requester_roles(
    current_user: User = Depends(get_current_active_user),
) -> User:
    allowed_roles = {
        UserRole.ITF,
        UserRole.GESTOR_GEAD,
        UserRole.GERENTE,
        UserRole.COORDENADOR,
        UserRole.SUPERVISOR,
        UserRole.TECNICO,
        UserRole.OPERADOR,
    }

    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido apenas para perfis solicitantes",
        )

    return current_user


def require_viewer_roles(
    current_user: User = Depends(get_current_active_user),
) -> User:
    allowed_roles = {
        UserRole.ITF,
        UserRole.GESTOR_GEAD,
        UserRole.GERENTE,
        UserRole.COORDENADOR,
        UserRole.SUPERVISOR,
        UserRole.TECNICO,
        UserRole.ESTAGIARIO,
        UserRole.OPERADOR,
    }

    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido apenas para perfis com visualização",
        )

    return current_user