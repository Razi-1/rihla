# SETUP_GUIDE.md — Complete Environment Setup Guide

This guide walks you through every step needed before running any Claude Code agent. Follow it in order.

---

## 1. Verify Prerequisites

Open a terminal and run each command. If any fails, install the missing tool.

### 1.1 Git
```bash
git --version
# Expected: git version 2.x.x
```

### 1.2 Python
```bash
python --version
# Expected: Python 3.12.x or higher
# If you have both python and python3, use whichever shows 3.12+

pip --version
# Expected: pip 24.x from ... (python 3.12)
```

### 1.3 Node.js
```bash
node --version
# Expected: v20.x.x or v22.x.x (LTS)

npm --version
# Expected: 10.x.x
```

### 1.4 Docker
```bash
docker --version
# Expected: Docker version 27.x.x or higher

docker compose version
# Expected: Docker Compose version v2.x.x
# Note: It's "docker compose" (with space), NOT "docker-compose" (with hyphen)
```
Make sure Docker Desktop is RUNNING (check system tray).

### 1.5 PostgreSQL (verify it's installed — Docker will run it, but you need the client tools)
```bash
psql --version
# Expected: psql (PostgreSQL) 16.x
```
You mentioned you already installed PostgreSQL locally and set the superuser password. For this project, PostgreSQL runs INSIDE Docker on **port 5433** (remapped to avoid conflicts with local PostgreSQL on 5432). If you want to free RAM, stop your local install:
```bash
# Windows (PowerShell as Admin):
Stop-Service postgresql-x64-16
# Or just disable it in Services app
```

### 1.6 DBeaver
Open DBeaver. We'll connect it to the Docker PostgreSQL later.

---

## 2. Install Missing Tools

### 2.1 Android Studio (Required for Expo Dev Client)

This is needed to build the mobile app's custom development client.

1. Download from: https://developer.android.com/studio
2. Run the installer. When prompted for components, ensure these are checked:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (AVD)
3. Complete the setup wizard. It will download ~2-3 GB of SDK files.
4. After installation, open Android Studio → More Actions → SDK Manager
5. In the SDK Platforms tab: check "Android 14 (API 34)" → Apply → Download
6. In the SDK Tools tab: check these are installed:
   - Android SDK Build-Tools 34
   - Android SDK Command-line Tools
   - Android Emulator
   - Android SDK Platform-Tools
7. Set environment variables. Add to your system PATH:
   ```
   # Windows: Add to System Environment Variables
   ANDROID_HOME = C:\Users\<YourUsername>\AppData\Local\Android\Sdk
   
   # Add to PATH:
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\tools\bin
   %ANDROID_HOME%\emulator
   ```
8. Verify:
   ```bash
   adb --version
   # Expected: Android Debug Bridge version 1.x.x
   ```

### 2.2 Create an Android Emulator (Optional — you can also use a physical phone)
1. Android Studio → More Actions → Virtual Device Manager
2. Create Device → Pick "Pixel 7" or similar → Next
3. Select "UpsideDownCake" (Android 14, API 34) → Download if needed → Next
4. Finish
5. Click the Play button to verify the emulator launches

### 2.3 Physical Android Device (Alternative to Emulator)
1. On your phone: Settings → About Phone → tap "Build Number" 7 times to enable Developer Options
2. Settings → Developer Options → Enable "USB Debugging"
3. Connect phone via USB
4. Verify: `adb devices` should show your device

### 2.4 mkcert (Local HTTPS certificates)
```bash
# Windows (using Chocolatey):
choco install mkcert
# OR using Scoop:
scoop install mkcert

# After install:
mkcert -install
# This installs a local CA (Certificate Authority) that your browser will trust
```

### 2.5 Expo CLI
```bash
npm install -g expo-cli@latest
npm install -g eas-cli@latest
```

---

## 3. Project Setup

### 3.1 Navigate to Project
```bash
cd path/to/rihla
```

### 3.2 Verify Git Remote
```bash
git remote -v
# Should show your GitHub repo URL
```

### 3.3 Generate Local HTTPS Certificates
```bash
mkdir mkcert
cd mkcert
mkcert localhost 127.0.0.1 ::1
# Creates: localhost+2.pem and localhost+2-key.pem
cd ..
```

### 3.4 Create .env File
Copy the template and fill in values:
```bash
cp .env.example .env
```

Then open `.env` and set these values:

```env
# === DATABASE ===
POSTGRES_USER=rihla
POSTGRES_PASSWORD=rihla_dev_password_2026
POSTGRES_DB=rihla
DATABASE_URL=postgresql+asyncpg://rihla:rihla_dev_password_2026@localhost:5433/rihla

# Synapse database (separate DB, same PostgreSQL server)
SYNAPSE_POSTGRES_USER=synapse
SYNAPSE_POSTGRES_PASSWORD=synapse_dev_password_2026
SYNAPSE_POSTGRES_DB=synapse

# === SECURITY KEYS ===
# Generate these by running: python -c "import secrets; print(secrets.token_hex(32))"
# Run the command 5 times to get 5 unique keys
JWT_SECRET_KEY=<paste-64-char-hex-here>
JWT_REFRESH_SECRET_KEY=<paste-64-char-hex-here>
HMAC_SECRET_KEY=<paste-64-char-hex-here>
CSRF_SECRET_KEY=<paste-64-char-hex-here>
JITSI_JWT_SECRET=<paste-64-char-hex-here>

# Generate Fernet key: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
FERNET_ENCRYPTION_KEY=<paste-fernet-key-here>

# === REDIS ===
REDIS_URL=redis://localhost:6379/0

# === MATRIX/SYNAPSE ===
MATRIX_HOMESERVER_URL=https://localhost:8448
MATRIX_SERVER_NAME=localhost
# This gets set after Synapse first boot — leave empty for now
MATRIX_ADMIN_TOKEN=

# === OLLAMA ===
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:e4b

# === MINIO ===
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=rihla-minio-admin
MINIO_SECRET_KEY=<paste-32-char-hex-here>
MINIO_BUCKET_PROFILES=profile-pictures
MINIO_BUCKET_MATERIALS=class-materials
MINIO_BUCKET_QR=qr-codes

# === MAILPIT ===
MAILPIT_SMTP_HOST=localhost
MAILPIT_SMTP_PORT=1025
MAILPIT_HTTP_PORT=8025

# === FIREBASE ===
# Set up later — create a Firebase project at https://console.firebase.google.com
FIREBASE_PROJECT_ID=
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json

# === APP CONFIG ===
APP_ENV=development
APP_URL=https://localhost:3000
ADMIN_URL=https://localhost:3001
API_URL=https://localhost:8000
CORS_ORIGINS=["https://localhost:3000","https://localhost:3001","http://localhost:3000","http://localhost:3001"]

# === JITSI ===
JITSI_URL=https://localhost:8443
# These are auto-generated by Jitsi's gen-passwords.sh
JICOFO_AUTH_PASSWORD=
JVB_AUTH_PASSWORD=
JITSI_INTERNAL_PASSWORD=
```

### 3.5 Generate Security Keys
Run this in your terminal to generate all required keys:
```bash
python -c "
import secrets
print('=== Copy these into your .env file ===')
print(f'JWT_SECRET_KEY={secrets.token_hex(32)}')
print(f'JWT_REFRESH_SECRET_KEY={secrets.token_hex(32)}')
print(f'HMAC_SECRET_KEY={secrets.token_hex(32)}')
print(f'CSRF_SECRET_KEY={secrets.token_hex(32)}')
print(f'JITSI_JWT_SECRET={secrets.token_hex(32)}')
print(f'MINIO_SECRET_KEY={secrets.token_hex(16)}')
"
```

And for the Fernet key:
```bash
python -c "from cryptography.fernet import Fernet; print(f'FERNET_ENCRYPTION_KEY={Fernet.generate_key().decode()}')"
```

If `cryptography` isn't installed yet: `pip install cryptography`

### 3.6 Create .gitignore
```
# Environment
.env
*.env.local

# Python
__pycache__/
*.py[cod]
*.egg-info/
dist/
build/
.venv/
venv/

# Node
node_modules/
.expo/
*.tsbuildinfo

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Certificates
mkcert/

# ML Models (generated, not committed)
backend/data/models/*.pkl

# Firebase credentials
firebase-credentials.json

# Docker volumes (local only)
docker-data/
```

---

## 4. Firebase Setup (For Push Notifications)

This is free and takes 10 minutes.

1. Go to https://console.firebase.google.com
2. Click "Add Project" → name it "rihla" → Continue
3. Disable Google Analytics (not needed) → Create Project
4. In the project dashboard: click the gear icon → Project Settings
5. Go to "Service Accounts" tab → Generate New Private Key → Download JSON
6. Rename the downloaded file to `firebase-credentials.json`
7. Place it in the `rihla/` project root (it's in .gitignore, won't be committed)
8. Copy the Project ID from the settings page → paste into `.env` as `FIREBASE_PROJECT_ID`
9. Go to "Cloud Messaging" tab → ensure "Cloud Messaging API (V1)" is enabled. If not, click the link to enable it in Google Cloud Console.

---

## 5. Docker First Boot

### 5.1 Start Core Services
The Claude Code agent will create the docker-compose.yml, but here's what to expect:

```bash
# Start all services
docker compose up -d

# Verify all containers are running
docker compose ps
# All should show "Up" status

# Check logs if anything fails
docker compose logs postgres
docker compose logs synapse
docker compose logs ollama
```

### 5.2 Pull Gemma 4 Model (First Time Only)
After the Ollama container is running:
```bash
docker exec -it rihla-ollama ollama pull gemma4:e4b
# This downloads ~5GB. Be patient.

# Verify it's loaded:
docker exec -it rihla-ollama ollama list
# Should show gemma4:e4b
```

### 5.3 Verify Services

| Service | How to Verify | URL |
|---------|--------------|-----|
| PostgreSQL | `docker exec -it rihla-postgres psql -U rihla -d rihla -c "SELECT 1"` | Port 5433 |
| Redis | `docker exec -it rihla-redis redis-cli ping` → PONG | Port 6379 |
| Synapse | Browser → http://localhost:8008/_matrix/client/versions (JSON response) | Port 8008 |
| Jitsi | Browser → https://localhost:8443 (Jitsi web UI) | Port 8443 |
| Ollama | `curl http://localhost:11434/api/tags` (JSON response) | Port 11434 |
| MinIO | Browser → http://localhost:9001 (MinIO console, login with MINIO_ACCESS_KEY/SECRET) | Port 9001 |
| Mailpit | Browser → http://localhost:8025 (email inbox UI) | Port 8025 |

### 5.4 Connect DBeaver to PostgreSQL
1. Open DBeaver → New Connection → PostgreSQL
2. Host: localhost, Port: 5433, Database: rihla
3. Username: rihla, Password: rihla_dev_password_2026 (from .env)
4. Test Connection → should succeed
5. Optionally: add a second connection for the `synapse` database

---

## 6. Python Virtual Environment

```bash
cd backend

# Create virtualenv
python -m venv venv

# Activate (Windows):
.\venv\Scripts\activate
# Activate (macOS/Linux):
source venv/bin/activate

# Verify:
which python
# Should show path inside venv/

# Install dependencies (after requirements.txt is created by agent):
pip install -r requirements.txt
```

---

## 7. Frontend Dev Servers

### 7.1 Web App
```bash
cd web
npm install
npm run dev
# Runs at http://localhost:3000 (or https://localhost:3000 with Vite HTTPS config)
```

### 7.2 Admin App
```bash
cd admin
npm install
npm run dev
# Runs at http://localhost:3001
```

### 7.3 Mobile App
```bash
cd mobile
npm install

# First time: build the dev client
npx expo run:android
# This takes 15-30 minutes on first build
# After build: it installs the dev client on your emulator/device

# Subsequent runs:
npx expo start --dev-client
# Scan QR code with the dev client app (NOT Expo Go)
```

**IMPORTANT for mobile:** The API URL in the mobile app's config must be your computer's local IP, not `localhost`. Find your IP:
```bash
# Windows:
ipconfig
# Look for "IPv4 Address" under your WiFi adapter (e.g., 192.168.1.100)

# macOS/Linux:
ifconfig | grep "inet "
```

Set `API_URL=https://192.168.1.100:8000` in the mobile app's environment config.

---

## 8. Running the Full Stack (Development)

Once everything is set up, the daily development workflow is:

```bash
# 1. Start Docker services (if not already running)
docker compose up -d

# 2. Start backend (in one terminal)
cd backend
.\venv\Scripts\activate  # Windows
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 3. Start web frontend (in another terminal)
cd web
npm run dev

# 4. Start admin frontend (in another terminal)
cd admin
npm run dev

# 5. Start mobile (in another terminal)
cd mobile
npx expo start --dev-client
```

---

## 9. Synapse Admin Token (After First Boot)

After Synapse starts for the first time, you need to register an admin user and get a token:

```bash
# Register admin user in Synapse
docker exec -it rihla-synapse register_new_matrix_user -c /data/homeserver.yaml -u rihla-admin -p <password> -a
# The -a flag makes it an admin user

# Get an access token (use the Matrix login API):
curl -X POST https://localhost:8448/_matrix/client/v3/login \
  -H "Content-Type: application/json" \
  -d '{"type":"m.login.password","user":"rihla-admin","password":"<password>"}'
# Response includes "access_token" — copy this

# Paste the token into .env:
MATRIX_ADMIN_TOKEN=<the-access-token>
```

---

## 10. Jitsi Password Generation

Jitsi needs internal passwords for its services to communicate:

```bash
# Clone Jitsi Docker repo (for the gen-passwords script):
git clone https://github.com/jitsi/docker-jitsi-meet.git /tmp/jitsi-docker
cd /tmp/jitsi-docker
cp env.example .env
./gen-passwords.sh
# This populates the .env with generated passwords

# Copy these values from /tmp/jitsi-docker/.env into your rihla/.env:
# JICOFO_AUTH_PASSWORD, JVB_AUTH_PASSWORD, JITSI_INTERNAL_PASSWORD
```

---

## 11. Useful Commands Reference

### Docker
```bash
docker compose up -d          # Start all services
docker compose down           # Stop all services
docker compose down -v        # Stop + delete all data (fresh start)
docker compose logs -f <svc>  # Follow logs for a service
docker compose ps             # Check service status
docker compose restart <svc>  # Restart a single service
```

### Database
```bash
# Run migrations
cd backend && alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Rollback one migration
alembic downgrade -1
```

### Testing
```bash
# All tests
cd backend && pytest -v

# Specific test file
pytest tests/unit/test_auth_service.py -v

# With coverage
pytest --cov=app --cov-report=html
```

### Git
```bash
git status                    # Check current state
git add -A                    # Stage all changes
git commit -m "feat: message" # Commit
git push origin <branch>      # Push to GitHub
git log --oneline -10         # View recent commits
```
