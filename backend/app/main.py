from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.session import create_db_and_tables

from app.models.user import User
from app.models.maintenance_request import MaintenanceRequest
from app.models.equipment import Equipment
from app.models.equipment_request import EquipmentRequest
from app.models.notification import Notification

from app.api.users import router as users_router
from app.api.auth import router as auth_router
from app.api.equipments import router as equipment_router

# Criação da aplicação web
app = FastAPI(title=settings.app_name)

# Liberação do frontend para o ip local
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Quando a aplicação subir, cria as tabelas
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Definição da rota GET
@app.get("/")

# Função que roda quando a rota é acessada
def root():
    return {"message": f"{settings.app_name} funcionando!"}

app.include_router(users_router) # Registro do router
app.include_router(auth_router)
app.include_router(equipment_router)
