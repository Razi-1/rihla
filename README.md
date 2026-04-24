# Rihla

AI-powered tutoring platform connecting students, parents, and tutors. Features AI-powered search, encrypted chat, video calling, attendance tracking, and ML-based tutor ranking.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12+, FastAPI, SQLAlchemy 2.0 (async), Alembic |
| Web | React 18, Vite, TypeScript, Zustand, Framer Motion |
| Admin | React 18, Vite, TypeScript (separate app, port 3001) |
| Mobile | React Native, Expo Dev Client, TypeScript, Reanimated 3 |
| Database | PostgreSQL 16+ |
| Cache | Redis 7+ |
| Chat | Matrix/Synapse (self-hosted) |
| Video | Jitsi Meet (self-hosted) |
| AI | Ollama + Google Gemma 4 E4B |
| Storage | MinIO (S3-compatible) |
| Email | Mailpit (dev) |

## Prerequisites

- **Python 3.12+**
- **Node.js 18+** and **npm**
- **Docker** and **Docker Compose**
- **Git**
- **mkcert** (for local HTTPS certificates)
- **Android Studio** or **Xcode** (for mobile development)

## Quick Start

### 1. Clone and configure

```bash
git clone https://github.com/Razi-1/rihla.git
cd rihla
cp .env.example .env
```

Edit `.env` and generate security keys:

```bash
# Generate 5 unique hex keys (for JWT, HMAC, CSRF, Jitsi secrets)
python -c "import secrets; print(secrets.token_hex(32))"

# Generate Fernet key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 2. Start infrastructure services

```bash
docker compose up -d postgres redis minio mailpit
```

Wait for services to be healthy, then optionally start Synapse, Jitsi, and Ollama:

```bash
# Chat server
docker compose up -d synapse

# Video calling
docker compose up -d jitsi-prosody jitsi-jicofo jitsi-jvb jitsi-web

# AI search (requires GPU)
docker compose up -d ollama
docker exec rihla-ollama ollama pull gemma4:e4b
```

### 3. Backend setup

```bash
cd backend
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed initial data
python scripts/import_subjects.py
python scripts/import_locations.py

# Create admin account
python scripts/create_admin.py

# Start the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

### 4. Web frontend

```bash
cd web
npm install
npm run dev
```

Opens at http://localhost:3000

### 5. Admin frontend

```bash
cd admin
npm install
npm run dev
```

Opens at http://localhost:3001

### 6. Mobile app

```bash
cd mobile
npm install

# Create a development build (NOT Expo Go)
npx expo prebuild
npx expo run:android  # or npx expo run:ios

# Start the dev server
npx expo start --dev-client
```

## Project Structure

```
rihla/
├── backend/        # FastAPI Python backend
│   ├── app/
│   │   ├── api/        # Route handlers (v1/ and admin/)
│   │   ├── core/       # Auth, security, rate limiting
│   │   ├── models/     # SQLAlchemy models
│   │   ├── schemas/    # Pydantic request/response schemas
│   │   ├── services/   # Business logic
│   │   ├── ml/         # ML pipeline (ranking, sentiment)
│   │   └── integrations/ # External service clients
│   └── tests/
├── web/            # Consumer web app (React + Vite)
├── admin/          # Admin web app (React + Vite)
├── mobile/         # Mobile app (React Native + Expo)
├── docker/         # Docker configs for services
└── shared/         # Shared TypeScript types
```

## Running Tests

### Backend
```bash
cd backend
.venv/Scripts/python -m pytest tests/ -v
```

### Web (TypeScript check)
```bash
cd web
npx tsc --noEmit
```

### Admin (TypeScript check)
```bash
cd admin
npx tsc --noEmit
```

### Mobile (TypeScript check)
```bash
cd mobile
npx tsc --noEmit
```

## Docker Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | App + Synapse databases |
| Redis | 6379 | Cache and rate limiting |
| MinIO | 9000 (API), 9001 (Console) | File storage |
| Mailpit | 1025 (SMTP), 8025 (UI) | Dev email |
| Synapse | 8008, 8448 | Matrix chat server |
| Jitsi Web | 8443 | Video calling |
| Ollama | 11434 | AI/LLM inference |

## Environment Variables

See `.env.example` for the full list with descriptions. Key groups:

- **Database**: PostgreSQL connection strings
- **Security**: JWT, Fernet, HMAC, CSRF keys (generate unique values!)
- **Services**: Redis, Matrix, Ollama, MinIO, Mailpit connection details
- **App**: URLs, CORS origins, environment mode

## License

Private repository. All rights reserved.
