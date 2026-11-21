# Gestão Corretiva

Sistema web para gerenciamento de equipamentos, solicitações de manutenção, retirada de itens, validação técnica e acompanhamento de notificações.

O projeto foi desenvolvido para apoiar o controle operacional de equipamentos do **Laboratório de Eletrônica** e da **GEAD**, centralizando informações que antes poderiam ficar espalhadas entre planilhas, mensagens e registros manuais.

---

## Visão geral

A aplicação permite:

- cadastrar e gerenciar equipamentos;
- controlar estoque por local;
- registrar solicitações de equipamentos;
- aprovar, rejeitar e confirmar retiradas;
- abrir solicitações de manutenção vinculadas a ordens SAP;
- registrar diagnóstico, reparo e cost avoidance;
- controlar permissões por perfil de usuário;
- exibir notificações de novas solicitações e mudanças de status;
- filtrar equipamentos por local, tipo, área, status e disponibilidade.

---

## Tecnologias utilizadas

### Backend

- Python
- FastAPI
- SQLModel
- SQLAlchemy
- PostgreSQL
- Psycopg
- JWT
- Pydantic
- Argon2

### Frontend

- React
- Vite
- React Router
- Axios
- Context API
- CSS

### Infraestrutura e desenvolvimento

- Git
- GitHub
- Docker e Docker Compose em evolução
- PostgreSQL local
- Windows 11
- VS Code

---

## Principais funcionalidades

### Gestão de equipamentos

- cadastro de equipamentos;
- edição de dados;
- upload de imagem;
- fabricante;
- modelo;
- número de série;
- código SAP;
- quantidade em estoque;
- área responsável;
- local de armazenamento;
- tipo de equipamento;
- status de disponibilidade;
- visualização em cards;
- modal com informações detalhadas;
- identificação visual de equipamentos sem estoque.

### Locais de operação

A aplicação trabalha com dois locais:

- `LAB_ELETRONICA`
- `GEAD`

Regras atuais:

- equipamentos do Laboratório de Eletrônica são classificados como eletrônicos;
- equipamentos da GEAD podem ser elétricos ou mecânicos;
- o perfil ITF pode administrar os dois locais;
- o perfil GESTOR_GEAD gerencia apenas os recursos vinculados à GEAD.

### Solicitações de equipamentos

- seleção do equipamento;
- quantidade solicitada;
- justificativa;
- preenchimento automático da área do usuário;
- aprovação ou rejeição;
- confirmação de retirada;
- redução do estoque somente após a retirada;
- registro de data e responsável pela retirada;
- bloqueio de solicitação quando não há estoque.

### Solicitações de manutenção

- cadastro de equipamento;
- descrição do sintoma;
- número da ordem SAP;
- validação pelo ITF;
- rejeição;
- diagnóstico técnico;
- status do reparo;
- cost avoidance;
- finalização da solicitação;
- bloqueio de edição após finalização.

### Notificações

- nova solicitação de equipamento;
- nova solicitação de manutenção;
- aprovação;
- rejeição;
- retirada;
- atualização de status;
- indicador de notificações não lidas.

---

## Perfis de usuário

| Perfil | Permissões principais |
|---|---|
| ITF | Gerencia equipamentos, valida solicitações, registra avaliação técnica e acessa todos os locais |
| GESTOR_GEAD | Gerencia equipamentos e solicitações da GEAD |
| GERENTE | Visualiza informações da sua área |
| COORDENADOR | Visualiza informações da sua subárea |
| SUPERVISOR | Acompanha solicitações da sua subárea |
| TECNICO | Cria solicitações de manutenção e equipamentos |
| OPERADOR | Cria solicitações de manutenção e equipamentos |
| ESTAGIARIO | Visualiza informações conforme sua área |

---

## Estrutura do projeto

```text
gestao_corretiva/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── static/
│   │   └── main.py
│   ├── .env
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── main.jsx
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

---

## Requisitos

Antes de iniciar, instale:

- Python 3.12 ou superior;
- Node.js 20 ou superior;
- PostgreSQL;
- Git.

---

## Configuração do backend

Entre na pasta do backend:

```bash
cd backend
```

Crie o ambiente virtual:

```bash
python -m venv .venv
```

Ative o ambiente virtual no Windows:

```bash
.venv\Scripts\activate
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Crie um arquivo `.env` dentro de `backend`.

Exemplo:

```env
DATABASE_URL=postgresql+psycopg://postgres:SUA_SENHA@localhost:5432/gestao_corretiva
SECRET_KEY=SUA_CHAVE_SECRETA
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

> Nunca envie o arquivo `.env` para o repositório.

Inicie o backend:

```bash
uvicorn app.main:app --reload
```

A API ficará disponível em:

```text
http://127.0.0.1:8000
```

Documentação Swagger:

```text
http://127.0.0.1:8000/docs
```

---

## Configuração do frontend

Entre na pasta do frontend:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Inicie o projeto:

```bash
npm run dev
```

O frontend normalmente ficará disponível em:

```text
http://localhost:5173
```

---

## Banco de dados

Crie um banco PostgreSQL:

```sql
CREATE DATABASE gestao_corretiva;
```

As principais tabelas utilizadas são:

- `users`
- `equipments`
- `equipment_requests`
- `maintenance_requests`
- `notifications`

### Enums importantes

```text
UserRole
UserArea
EquipmentLocation
EquipmentType
EquipmentRequestStatus
MaintenanceRequestStatus
```

Ao adicionar novos valores em enums Python, verifique também se o tipo correspondente no PostgreSQL precisa ser atualizado.

Exemplo:

```sql
ALTER TYPE userarea
ADD VALUE IF NOT EXISTS 'ENGENHARIA';
```

---

## Rotas principais

### Autenticação

```text
POST /auth/login
GET  /users/me
```

### Equipamentos

```text
GET    /equipments/
POST   /equipments/
GET    /equipments/{id}
PATCH  /equipments/{id}
POST   /equipments/{id}/photo
```

### Solicitações de equipamentos

```text
GET    /equipment-requests/
POST   /equipment-requests/
GET    /equipment-requests/{id}
PATCH  /equipment-requests/{id}/validate
PATCH  /equipment-requests/{id}/withdraw
```

### Solicitações de manutenção

```text
GET    /maintenance-requests/
POST   /maintenance-requests/
GET    /maintenance-requests/{id}
PATCH  /maintenance-requests/{id}/validate
PATCH  /maintenance-requests/{id}/technical-update
```

### Notificações

```text
GET    /notifications/
GET    /notifications/unread-count
PATCH  /notifications/{id}/read
```

---

## Fluxo de solicitação de equipamento

```text
Usuário solicita equipamento
        ↓
Solicitação fica pendente
        ↓
ITF ou Gestor GEAD avalia
        ↓
Aprovação ou rejeição
        ↓
Retirada confirmada
        ↓
Estoque é reduzido
```

---

## Fluxo de manutenção

```text
Usuário informa equipamento, sintoma e ordem SAP
        ↓
ITF valida ou rejeita
        ↓
Avaliação técnica
        ↓
Diagnóstico e reparo
        ↓
Registro de cost avoidance
        ↓
Finalização
```

---

## Segurança

O projeto utiliza:

- autenticação com JWT;
- hash de senha com Argon2;
- controle de acesso baseado em perfil;
- proteção de rotas no frontend;
- validação de permissões no backend;
- variáveis sensíveis armazenadas em `.env`.

---

## Melhorias planejadas

- dashboard com indicadores;
- histórico de alterações de status;
- exportação para Excel;
- filtros por período;
- tempo médio de atendimento;
- auditoria de movimentações;
- integração com SAP S/4HANA;
- Docker Compose;
- testes automatizados;
- deploy em ambiente corporativo;
- upload de múltiplas imagens;
- responsividade completa;
- relatórios gerenciais.

---

## Ideias de indicadores para o dashboard

- total de equipamentos;
- equipamentos disponíveis;
- equipamentos sem estoque;
- solicitações pendentes;
- solicitações aprovadas;
- solicitações rejeitadas;
- retiradas por período;
- solicitações por área;
- solicitações por local;
- tempo médio de validação;
- manutenções finalizadas;
- cost avoidance acumulado.

---

## Capturas de tela

Adicione as imagens do projeto em uma pasta como:

```text
docs/images/
```

Depois utilize:

```md
![Tela de equipamentos](docs/images/equipamentos.png)
```

Exemplo de seção:

```md
## Interface

![Dashboard](docs/images/dashboard.png)

![Equipamentos](docs/images/equipamentos.png)

![Solicitações](docs/images/solicitacoes.png)
```

---

## Comandos Git

Primeiro envio:

```bash
git init
git add .
git commit -m "feat: estrutura inicial do sistema de gestão corretiva"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git
git push -u origin main
```

Próximas alterações:

```bash
git add .
git commit -m "feat: descreva a alteração"
git push
```

---

## Autor

Desenvolvido por **Leonardo Ferreira**.

Projeto voltado à gestão de equipamentos, manutenção corretiva, análise de dados e melhoria de processos operacionais.

---

## Status do projeto

> Em desenvolvimento.

As funcionalidades principais já estão implementadas, mas o sistema ainda passa por melhorias de interface, regras de negócio, relatórios e integração com sistemas externos.
