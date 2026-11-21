from pwdlib import PasswordHash

from datetime import datetime, timedelta, timezone
from jose import jwt

from app.core.config import settings

PASSWORD_HASH = PasswordHash.recommended() # Objeto com estratégia da lib

def get_password_hash(password: str) -> str: # Recebe senha pura e devolve o hash
    return PASSWORD_HASH.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool: # Compara senha digitada pelo usuário e hash salvo no banco
    return PASSWORD_HASH.verify(plain_password, hashed_password)

def create_access_token(subject: str) -> str: # Função pega identificador e transforma em um token. Token: "user fez login", "token expira em tal horário", "server assinou com a secret key"
    expire = datetime.now(timezone.utc) + timedelta(
        minutes = settings.access_token_expire_minutes
    )
    # Montagem do payload
    to_encode = {
        "sub": subject, # id
        "exp": expire 
    }

    return jwt.encode(to_encode, settings.secret_key, algorithm = settings.algorithm) # assinatura do token

# Função para decodificar o token de acesso -> reebe token, verifica assinatura com secret key, verifica o formato e devolve o payload
def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])