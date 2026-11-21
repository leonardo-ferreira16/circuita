from sqlmodel import SQLModel

class LoginRequest(SQLModel):
    employee_id: str
    password: str

class Token(SQLModel):
    access_token: str
    token_type: str