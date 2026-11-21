from sqlmodel import SQLModel, Session, create_engine
from app.core.config import settings

# Conexão principal com o banco criada
engine = create_engine(settings.database_url, echo = True) # echo = True -> comandos aparecem no terminal

# Cria tabelas definidas nos modelos
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# Será usado nos endpoints para abrir sessão com o banco
def get_session():
    with Session(engine) as session:
        yield session

    