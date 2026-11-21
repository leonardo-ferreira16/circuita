from pydantic_settings import BaseSettings, SettingsConfigDict

# BaseSettings para ler as variáveis do ambiente .env (app_name, database_url, secret_key)

class Settings(BaseSettings):
    app_name: str = "Gestao Corretiva Lab"
    database_url: str # Configuração obrigatória
    secret_key: str
    access_token_expire_minutes: int = 30
    algorithm: str = "HS256"
    # Pydantic procura arquivo .env
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Instância para outros arquivos
settings = Settings()