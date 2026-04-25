# CLAUDE.md — Rihla Project Conventions

## Project Overview
Rihla is a cross-platform AI-powered tutoring platform connecting students, parents, and tutors. It features AI-powered search, encrypted chat, video calling, attendance tracking, and ML-based tutor ranking.

## Tech Stack
- **Backend:** Python 3.12+, FastAPI, SQLAlchemy 2.0 (async), asyncpg, Alembic, APScheduler
- **Web Frontend:** React 18+, Vite, TypeScript, Zustand, Axios, react-hook-form, Zod, Framer Motion, FullCalendar
- **Mobile Frontend:** React Native, Expo (Dev Client, NOT Expo Go), TypeScript, Reanimated 3, Moti, react-native-skia, react-native-calendars
- **Admin Frontend:** React 18+, Vite, TypeScript (separate app, different port)
- **Database:** PostgreSQL 16+ (two databases: app + Synapse)
- **Cache:** Redis 7+
- **Chat:** Matrix/Synapse (self-hosted), matrix-js-sdk with legacy Olm crypto on mobile
- **Video:** Jitsi Meet (self-hosted Docker: web, prosody, jicofo, jvb)
- **AI/LLM:** Ollama with Google Gemma 4 E4B model
- **Sentiment:** HuggingFace DistilBERT (loaded in-process)
- **Ranking:** scikit-learn model (serialized .pkl)
- **File Storage:** MinIO (S3-compatible, self-hosted)
- **Push Notifications:** Firebase Cloud Messaging (free tier) + Sygnal (Matrix push gateway)
- **Email:** Mailpit (development only)
- **HTTPS:** mkcert for local dev certificates
- **Containerization:** Docker + Docker Compose

## Repository Structure
```
rihla/
├── CLAUDE.md                  # This file
├── IMPLEMENTATION_PLAN.md     # Full project spec
├── AGENT_INSTRUCTIONS.md      # Multi-agent orchestration
├── SETUP_GUIDE.md             # Environment setup
├── docker-compose.yml         # Production compose
├── docker-compose.dev.yml     # Development overrides
├── .env.example               # Environment template
├── .gitignore
├── README.md
├── backend/                   # FastAPI Python backend
├── web/                       # React consumer web app
├── mobile/                    # React Native + Expo mobile app
├── admin/                     # React admin web app (separate)
├── shared/                    # Shared TypeScript types & constants
└── docker/                    # Service-specific Docker configs
```

## Current State of Progress
- [x] Git repository initialized
- [x] GitHub remote repository created
- [x] Docker Compose configuration
- [x] Backend API (FastAPI + SQLAlchemy models, services, tests — 70 tests passing)
- [x] Web frontend (React 18 + Vite + TypeScript — compiles and builds clean)
- [x] Mobile frontend (React Native + Expo Dev Client — TypeScript clean)
- [x] Admin frontend (React 18 + Vite + TypeScript — compiles and builds clean)
- [x] Security: Auth guards, rate limiting on login/register, JWT, Argon2, Fernet
- [ ] Environment setup (Docker services running, Alembic migrations applied)
- [ ] ML pipeline (model training and serving)
- [ ] Integration testing (full E2E flows with running services)

## Git Conventions
- **Branch naming:** `phase1/backend`, `phase2/web`, `phase2/mobile`, `phase2/admin`, `phase3/integration`
- **Commit messages:** Conventional Commits format: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- **Commit frequency:** Commit after each meaningful unit of work (completed endpoint, component, service)
- **Push frequency:** Push after each completed module or at end of session

## Coding Conventions

### Python (Backend)
- **Formatter:** Black (line length 88)
- **Linter:** Ruff
- **Type hints:** Required on all function signatures
- **Async:** All database operations and external service calls must be async
- **Docstrings:** Google-style on all public functions and classes
- **Imports:** stdlib → third-party → local, separated by blank lines
- **File naming:** snake_case for all Python files
- **Class naming:** PascalCase
- **Variable/function naming:** snake_case
- **Constants:** UPPER_SNAKE_CASE in a dedicated constants file
- **Error handling:** Custom exception classes in core/exceptions.py, caught by FastAPI exception handlers
- **Environment variables:** Loaded via Pydantic Settings class in config.py, NEVER hardcoded
- **Secrets:** NEVER committed. All secrets in .env (gitignored). Access only through config.py

### TypeScript (All Frontends)
- **Strict mode:** Enabled in tsconfig.json
- **Formatter:** Prettier (printWidth 100, singleQuote true, trailingComma all)
- **Linter:** ESLint with TypeScript plugin
- **File naming:** PascalCase for components (Button.tsx), camelCase for utilities (formatDate.ts)
- **Component pattern:** Functional components with hooks only, no class components
- **State management:** Zustand for global state, React hooks for local state
- **API calls:** Centralized in services/ directory, using typed Axios instance
- **Styles (web):** CSS variables from design system, Framer Motion for animations
- **Styles (mobile):** StyleSheet.create with theme constants, Reanimated for animations
- **Forms:** react-hook-form + Zod schemas on both web and mobile
- **Icons:** Lucide icons only (lucide-react on web, lucide-react-native on mobile)

### Database
- **ORM:** SQLAlchemy 2.0 declarative models with mapped_column
- **Migrations:** Alembic only. NEVER use create_all()
- **Naming:** snake_case for tables and columns
- **Primary keys:** UUID v4 (not auto-increment integers)
- **Timestamps:** Always UTC. Columns: created_at, updated_at (auto-managed)
- **Soft deletes:** Use is_deleted + deleted_at pattern where specified
- **Indexes:** Define for every query pattern. Use partial indexes where applicable
- **Constraints:** Define at database level, not just application level

### Testing
- **Backend:** pytest + pytest-asyncio + httpx (async test client)
- **Frontend:** Vitest + React Testing Library (web), Jest + React Native Testing Library (mobile)
- **Coverage target:** 80% for services, 60% for API routes, 40% for frontend components
- **Test file naming:** test_<module>.py (Python), <Component>.test.tsx (TypeScript)
- **Test data:** Use factories/fixtures, never hardcode test data inline

### API Design
- **Versioning:** /api/v1/ prefix on all consumer endpoints, /api/admin/ for admin endpoints
- **Response format:** Consistent JSON envelope: { data, message, errors }
- **Pagination:** Cursor-based for lists (not offset-based)
- **Error responses:** { detail: string, code: string, errors?: object }
- **Authentication:** JWT in HTTP-only cookie (web) or Authorization Bearer header (mobile)
- **CORS:** Configured per environment in config.py

## Design System (MANDATORY — Override All Defaults)

### IMPORTANT: This project uses a specific design system. Do NOT use default/generic styling.

### Colors (use CSS variables, reference by token name)
```
--color-primary-navy: #1B3A5C      /* Sidebar backgrounds, dark elements */
--color-primary-blue: #2E75B6      /* Buttons, links, active states */
--color-accent-blue: #1F6099       /* Hover states, secondary headings */
--color-light-blue: #D6E4F0        /* Callout backgrounds, focus rings */
--color-mid-blue: #BDD7EE          /* Dividers, borders (ghost only) */
--color-surface: #F8F9FF           /* Base background */
--color-surface-low: #F2F3F9       /* Section backgrounds */
--color-surface-card: #FFFFFF      /* Cards */
--color-surface-high: #E6E8EE      /* Elevated details */
--color-text-body: #344054         /* Body text (Gray-700) */
--color-text-heading: #101828      /* Headings (Gray-900) */
--color-success: #12B76A
--color-warning: #F79009
--color-error: #F04438
```

### Typography
- **Font:** Inter (Google Fonts) for web. System fonts for mobile.
- **Web headings:** 28px (h1), 24px (h2), 20px (h3). Body: 14px.
- **Mobile headings:** 28px (h1), 22px (h2), 17px (h3). Body: 15px.

### Design Rules (from DESIGN.md — must follow)
- **NO 1px solid borders for sectioning.** Use background color shifts between surface tiers.
- **Ghost borders only:** When borders are needed, use outline_variant at 15% opacity.
- **No pure black (#000000).** Use #191C20 (on_surface) for darkest text.
- **Card radius:** 12px (0.75rem) always.
- **Buttons:** Primary = gradient (primary → primary_container at 135°), rounded-full. Secondary = surface_container_high bg, no border.
- **Button hover:** Scale 1.02x transform, not just color change.
- **Avatars:** Always rounded-full.
- **Glassmorphism** for modals/floating elements: 80% opacity + backdrop-filter: blur(12px).
- **Shadows:** Extra-diffused only: box-shadow: 0px 10px 30px rgba(25, 28, 32, 0.06).
- **Spacing:** Use wider scale (12–16 units) for container margins. Asymmetric layouts preferred (2/3 + 1/3).
- **Icons:** Lucide icons at 1.5px stroke width.
- **Light mode only.** No dark mode.

## Environment Variables (Required)
```
# Database
DATABASE_URL=postgresql+asyncpg://rihla:password@localhost:5432/rihla
SYNAPSE_DATABASE_URL=postgresql://synapse:password@localhost:5432/synapse

# Security
JWT_SECRET_KEY=<generate-random-64-char>
JWT_REFRESH_SECRET_KEY=<generate-random-64-char>
FERNET_ENCRYPTION_KEY=<generate-fernet-key>
HMAC_SECRET_KEY=<generate-random-64-char>
CSRF_SECRET_KEY=<generate-random-64-char>
JITSI_JWT_SECRET=<generate-random-64-char>

# Services
REDIS_URL=redis://localhost:6379/0
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ADMIN_TOKEN=<synapse-admin-token>
OLLAMA_BASE_URL=http://localhost:11434
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=rihla-admin
MINIO_SECRET_KEY=<generate-random-32-char>
MAILPIT_SMTP_HOST=localhost
MAILPIT_SMTP_PORT=1025

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=<your-project-id>
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json

# App
APP_ENV=development
APP_URL=https://localhost:3000
ADMIN_URL=https://localhost:3001
API_URL=https://localhost:8000
CORS_ORIGINS=["https://localhost:3000","https://localhost:3001"]
```

## AUDIT MODE INSTRUCTIONS

### Current State
The codebase has been partially implemented but contains bugs, incomplete features, 
and deviations from the specification. Some bugs have been fixed locally but not pushed. 
DO NOT undo any existing bug fixes.

### Audit Protocol
Before making ANY changes, you must:

1. **READ the spec files first** — every single one, in this order:
   - IMPLEMENTATION_PLAN.md (complete spec: file structure, DB schema, API endpoints, business rules)
   - DESIGN.md (design philosophy, "Academic Curator" aesthetic)
   - Design_System.md (exact color values, typography rules)
   - Existing_Platform_Context.md (functional requirements, user flows, ALL business logic)
   - Previous_Project_Error_Fixes.md (known fixes — DO NOT revert these)
   - AGENT_INSTRUCTIONS.md (agent prompts with explicit design rules)

2. **Map what exists vs. what should exist** — create a checklist before writing code

3. **Never assume the existing code is correct** — verify every file against the spec

4. **Preserve working code** — if something already works correctly per spec, don't touch it

5. **Fix one system at a time** — complete each system fully before moving to the next

### What "Existing_Platform_Context.md" IS and IS NOT
- It IS: a reference for understanding business logic, user flows, and feature requirements
- It IS NOT: a codebase to copy from. It describes a PREVIOUS system. Rihla is a NEW build.
- DO NOT copy implementation patterns from it. Follow IMPLEMENTATION_PLAN.md for Rihla's architecture.
- DO NOT assume database column names, API routes, or file paths from it match Rihla's spec.
- ONLY use it to understand: what the feature should DO, not how it was coded before.


## Important Constraints
1. This is a LOCAL DEVELOPMENT setup. Server = developer's laptop (32GB RAM, RTX 4070).
2. Expo Go CANNOT be used. Must use Expo Dev Client (custom development builds).
3. All services run in Docker containers except the frontend dev servers.
4. Matrix Synapse requires its own PostgreSQL database (separate from app DB).
5. Government ID validation uses python-stdnum + custom Sri Lanka NIC validator.
6. E2EE chat: legacy Olm crypto on mobile (matrix-js-sdk), Rust crypto on web.
7. NO payment processing in the app. Prices are display-only.
8. English only. No i18n infrastructure needed.
9. NEVER expose ML scores (reliability, sentiment numeric) to any frontend.
10. Profile pictures, class materials → MinIO. Chat media → Synapse media store.
