from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db.session import get_session
from app.models.user import User
from app.schemas.user import UserCreate, UserRead

from app.core.security import get_password_hash

# Rota users
router = APIRouter(prefix="/users", tags=["Users"]) # tags organiza a documentação do swagger

# POST user
@router.post("/", response_model=UserRead) # "a resposta dessa rota deve seguir o UserRead"
def create_user(user_data: UserCreate, session: Session = Depends(get_session)): # "Corpo da requisição é um JSON no formato de UserCreate e aqui é aberta a sessão do banco"
    existing_employee_id = session.exec(
        select(User).where(User.employee_id == user_data.employee_id)
    ).first()
    if existing_employee_id:
        raise HTTPException(status_code = 404, detail="ID já cadastrado!")

    existing_email = session.exec(
        select(User).where(User.email == user_data.email)
    ).first()
    if existing_email:
        raise HTTPException(status_code = 404, detail= "Email já cadastrado!")

    # Instância do model adicionando entrada no banco
    user = User(
        employee_id= user_data.employee_id,
        name = user_data.name,
        email = user_data.email,
        hashed_password= get_password_hash(user_data.password),
        role = user_data.role,
        area = user_data.area
    )    

    session.add(user)
    session.commit()
    session.refresh(user)

    return user

# GET user
@router.get("/", response_model = list[UserRead])
def list_users(session: Session = Depends(get_session)):
    users = session.exec(
        select(User)
    ).all()
    return users

# UPDATE user


# DELETE user
