# AGENT_INSTRUCTIONS.md — Claude Code Multi-Agent Orchestration

## Agent Configuration (ALL agents)

**Model:** `/model claude-opus-4-6`
**Effort:** `/effort max`
**Auto-accept:** Enable for file edits within project scope

These settings are NON-NEGOTIABLE for every agent session.

## Pre-Session Checklist (Run Before ANY Agent)
1. `cd` into the `rihla/` project root
2. Verify git is initialized: `git status`
3. Verify GitHub remote is set: `git remote -v`
4. Read CLAUDE.md: `cat CLAUDE.md`
5. Read IMPLEMENTATION_PLAN.md: `cat IMPLEMENTATION_PLAN.md`
6. Read the DESIGN.md and Design_System.md files in the project root for design tokens

## Agent Roles

### Phase 1: Backend Agent (Single agent, sequential)
**Branch:** `phase1/backend`
**Scope:** Everything in `backend/`, `docker/`, `docker-compose.yml`, `.env.example`, `shared/`
**Goal:** Fully functional, tested backend API with all integrations running

#### Startup Commands:
```bash
git checkout -b phase1/backend
```

#### Agent Prompt (copy this to Claude Code):
```
You are building the backend for Rihla, an AI-powered tutoring platform.

Read these files FIRST before writing any code:
- CLAUDE.md (project conventions, tech stack, design system)
- IMPLEMENTATION_PLAN.md (complete specification — database schema, API endpoints, business rules)

Your job is to build the ENTIRE backend following the phased build order in Section 5 of IMPLEMENTATION_PLAN.md (Steps 1.1 through 1.11).

Key rules:
1. Use Python 3.12+, FastAPI, SQLAlchemy 2.0 (async), asyncpg, Alembic
2. ALL business logic goes in services/ layer, NOT in API route handlers
3. API routes are thin — validate input, call service, return response
4. Every model uses UUID v4 primary keys
5. ALL timestamps stored in UTC
6. NEVER use SQLAlchemy create_all() — use Alembic migrations only
7. Write unit tests for every service function
8. Write integration tests for every user flow
9. Run tests after completing each step: pytest -v
10. Commit after each completed step with descriptive message
11. Push to GitHub after each major step

Build order:
1. Docker Compose + all container configs
2. Database models + Alembic migration
3. Seed scripts (locations, subjects, admin)
4. Auth system (register, login, tokens, email verification, password reset)
5. Account + profile services
6. Session + booking + calendar system
7. Attendance (QR + Jitsi webhook)
8. Chat integration (Matrix/Synapse)
9. Review system
10. Search + AI (Ollama + DistilBERT + scikit-learn)
11. Notifications + file storage
12. Rate limiting, CORS, logging, error handling
13. Full test suite pass

After completing ALL backend work, run the full test suite, fix any failures, and push to the phase1/backend branch.

Environment: Developer laptop with 32GB RAM, RTX 4070, 1TB SSD. All services run in Docker.
```

#### Quality Gates (must pass before Phase 2):
- [ ] All Docker containers start without errors: `docker compose up -d`
- [ ] Database migrations run: `alembic upgrade head`
- [ ] Location + subject data imported
- [ ] Admin account created via CLI
- [ ] Seed data generated and ML model trained
- [ ] All unit tests pass: `pytest tests/unit/ -v`
- [ ] All integration tests pass: `pytest tests/integration/ -v`
- [ ] Swagger docs accessible at https://localhost:8000/docs
- [ ] Auth flow works (register → verify email → login → refresh → logout)
- [ ] Synapse is reachable and rooms can be created
- [ ] Jitsi rooms can be generated with valid JWTs
- [ ] MinIO accepts file uploads
- [ ] Mailpit catches emails at http://localhost:8025

---

### Phase 2A: Web Frontend Agent
**Branch:** `phase2/web`
**Base:** Branch from `phase1/backend` after it passes all quality gates
**Scope:** Everything in `web/`
**Goal:** Fully functional consumer web app with all screens, animations, and integrations

#### Startup Commands:
```bash
git checkout phase1/backend
git checkout -b phase2/web
```

#### Agent Prompt:
```
You are building the consumer web frontend for Rihla, an AI-powered tutoring platform.

Read these files FIRST:
- CLAUDE.md (project conventions, design system — MANDATORY design rules)
- IMPLEMENTATION_PLAN.md (Section 1 for file structure, Section 3 for API endpoints, Section 5 Phase 2A for build steps)
- DESIGN.md (design philosophy — "Academic Curator" aesthetic)
- Design_System.md (exact color values and typography)

The backend is already complete and running at https://localhost:8000.
Swagger docs at https://localhost:8000/docs.

Your job: Build the ENTIRE web app following Phase 2A steps in IMPLEMENTATION_PLAN.md.

CRITICAL DESIGN RULES (from DESIGN.md — violations are bugs):
1. Font: Inter from Google Fonts ONLY
2. NO 1px solid borders. Use background color shifts between surface tiers.
3. Ghost borders only (15% opacity) when a visible boundary is absolutely needed.
4. No pure black (#000000). Use #191C20 for darkest text.
5. Card radius: 12px always.
6. Primary buttons: gradient fill (135°), rounded-full, scale 1.02x on hover.
7. Glassmorphism for modals: 80% opacity + backdrop-filter: blur(12px).
8. Shadows: 0px 10px 30px rgba(25, 28, 32, 0.06) only.
9. Asymmetric layouts (2/3 + 1/3 preferred over 50/50).
10. Icons: Lucide icons at 1.5px stroke.

ANIMATION REQUIREMENTS (full motion design):
- Use Framer Motion for ALL page transitions, list animations, and micro-interactions
- Page enter/exit animations on every route change
- Staggered list item entrance animations
- Skeleton loading with shimmer effect
- Button press feedback (scale)
- Modal/dialog spring physics
- Notification badge bounce
- Smooth tab indicator slide
- Card hover lift effect
- Pull-to-refresh animation pattern for data refresh

Tech stack: React 18+, Vite, TypeScript, Zustand, Axios (withCredentials for cookies), react-hook-form + Zod, Framer Motion, FullCalendar, matrix-js-sdk (Rust crypto for web), Jitsi IFrame API

Build order:
1. Vite project + dependencies + design system CSS variables
2. Axios instance + CSRF + auth store + routing
3. Layout (AppShell, Sidebar role-variant, Header)
4. Common components (Button, Input, Modal, Avatar, Badge, etc.)
5. Auth pages (Login, Register multi-step, Password Recovery, Email Verify)
6. Public pages (Landing, Search, Profile)
7. Student pages
8. Tutor pages
9. Parent pages
10. Shared pages (Calendar, Chat, AI Assistant, Video, Settings)
11. Animation pass (ensure all transitions are smooth)
12. Matrix chat + Jitsi video integration
13. Test in browser, fix responsive issues

Verify in browser after each major component group. Commit frequently. Push to phase2/web branch.
```

---

### Phase 2B: Mobile Frontend Agent
**Branch:** `phase2/mobile`
**Base:** Branch from `phase1/backend`
**Scope:** Everything in `mobile/`
**Goal:** Fully functional mobile app testable via Expo Dev Client

#### Startup Commands:
```bash
git checkout phase1/backend
git checkout -b phase2/mobile
```

#### Agent Prompt:
```
You are building the mobile app for Rihla, an AI-powered tutoring platform.

Read these files FIRST:
- CLAUDE.md (project conventions, design system)
- IMPLEMENTATION_PLAN.md (Section 1 for file structure, Section 3 for API endpoints, Section 5 Phase 2B)
- DESIGN.md and Design_System.md (design tokens)
- Previous_Project_Error_Fixes.md (Expo stability fixes — apply from day 1)

The backend is running at https://<YOUR_LOCAL_IP>:8000 (NOT localhost — mobile needs actual IP).

CRITICAL EXPO REQUIREMENTS:
1. MUST use Expo Dev Client (NOT Expo Go) — native modules required for Matrix + Jitsi
2. Install polyfills FIRST (react-native-url-polyfill, safe-area-context, gesture-handler)
3. index.js must import url-polyfill BEFORE anything else
4. App.tsx must wrap in SafeAreaProvider + GestureHandlerRootView
5. babel.config.js must include react-native-reanimated/plugin LAST in plugins array
6. API base URL must use machine's local IP, not localhost

DESIGN RULES (mobile adaptations):
- System fonts (not Inter) for mobile
- Heading sizes: 28/22/17px. Body: 15px
- No 1px borders — same surface-tier approach as web
- Ghost borders (15% opacity) when needed
- Card radius: 12px
- Bottom sheets instead of modals
- BottomTabBar with role-variant tabs

ANIMATION REQUIREMENTS (full motion design):
- react-native-reanimated 3 for core animations (UI thread, 60fps)
- moti for declarative animation components
- react-native-skia for advanced visual effects (gradients, blurs)
- Shared element transitions between screens (react-navigation)
- Screen transitions: slide, fade with spring physics
- List item staggered entrance (FlatList with Reanimated)
- Pull-to-refresh with custom animation
- Button press: scale + haptic feedback (expo-haptics)
- Bottom sheet spring physics
- Tab bar indicator animated slide
- Skeleton loading shimmer
- QR scanner frame pulse animation
- Card swipe-to-dismiss

Navigation structure (react-navigation):
- RootNavigator: auth check → AuthNavigator OR role-specific TabNavigator
- AuthNavigator: stack (Login, Register, PasswordRecovery, VerifyEmail)
- StudentTabNavigator: tabs (Home, Search, Calendar, Messages, Profile)
- TutorTabNavigator: tabs (Home, MyClasses, Calendar, Messages, Profile)
- ParentTabNavigator: tabs (Home, Children, Calendar, Messages, Profile)
- Each tab has its own stack navigator for drill-down screens

Build order:
1. Expo project + dev client config + dependencies + polyfills
2. Navigation structure (all navigators)
3. Theme (colors, typography, spacing, animation presets)
4. Axios instance + SecureStore token management
5. Common components (Button, Input, BottomSheet, Avatar, etc.)
6. Auth screens (multi-step Register, Login, etc.)
7. Student screens + QR Scanner (expo-camera)
8. Tutor screens + QR Display
9. Parent screens
10. Shared screens (Calendar, Chat, AI Assistant, Video, Settings)
11. Animation pass
12. Matrix SDK integration (legacy Olm crypto)
13. Jitsi SDK integration
14. Push notifications (expo-notifications + FCM)
15. Build dev client: npx expo run:android
16. Test on device, fix issues

Commit frequently. Push to phase2/mobile branch.
```

---

### Phase 2C: Admin Frontend Agent
**Branch:** `phase2/admin`
**Base:** Branch from `phase1/backend`
**Scope:** Everything in `admin/`
**Goal:** Fully functional admin web app

#### Startup Commands:
```bash
git checkout phase1/backend
git checkout -b phase2/admin
```

#### Agent Prompt:
```
You are building the admin web application for Rihla, an AI-powered tutoring platform.

Read: CLAUDE.md, IMPLEMENTATION_PLAN.md (Phase 2C steps, admin API endpoints), DESIGN.md, Design_System.md.

The backend is running at https://localhost:8000. Admin API at /api/admin/.

This is a SEPARATE React app from the consumer web app. Different port (3001), different codebase, different visual identity.

KEY DIFFERENCES FROM CONSUMER APP:
- Sidebar accent: RED (not navy) — visually distinct from consumer
- Desktop only (min-width 1280px)
- Data-dense layouts (tables, not cards)
- Every destructive action requires: written reason + confirmation modal
- No mobile support needed
- Admin accounts created by CLI or by existing admin

Admin screens:
1. Login (centered card, admin branding, "Authorized personnel only" warning)
2. Dashboard (stat cards, trend arrows, recent audit log entries)
3. Account Management — List (data table with filters, sortable, paginated 25/page)
4. Account Management — Detail (read-only profile, account timeline, restrict/delete actions)
5. Review Management — List (data table, filter by tutor/rating/status)
6. Review Management — Detail (full review, deletion flow with reason)
7. Audit Log (immutable, filterable, sortable, CSV export, 50/page)
8. Subject Management (CRUD categories + subjects + level availability)
9. Admin Team (list admins, create new admin)
10. Admin Profile (change password, view info)

Tech stack: React 18+, Vite, TypeScript, Zustand, Axios, Framer Motion (lighter usage — page transitions + table animations)

Build order:
1. Vite project + dependencies
2. Admin auth (login, separate token scope)
3. Layout (AdminShell, red-accent Sidebar, Header)
4. DataTable component (generic, sortable, filterable, paginated)
5. Dashboard page
6. Account management pages
7. Review management pages
8. Audit log page
9. Subject management
10. Admin team management
11. Admin profile
12. Polish, verify all flows

Commit frequently. Push to phase2/admin branch.
```

---

### Phase 3: Integration Agent (Single agent, sequential)
**Branch:** `main` (merge all branches)

#### Startup Commands:
```bash
git checkout main
git merge phase1/backend
git merge phase2/web
git merge phase2/mobile
git merge phase2/admin
# Resolve any merge conflicts
```

#### Agent Prompt:
```
You are the integration and QA agent for Rihla.

All four branches have been merged into main. Your job:
1. Resolve any merge conflicts
2. Verify all Docker services start cleanly
3. Run the full backend test suite — fix any failures
4. Test the web app in a browser — verify all screens render and function
5. Test the admin app in a browser — verify all admin flows
6. Test the mobile app on emulator/device — verify all screens
7. Run end-to-end tests: student sign-up → find tutor → chat → book → attend → review
8. Security checks: verify rate limiting works, CSRF tokens validate, auth guards enforce
9. Fix any bugs found
10. Update README.md with setup instructions
11. Final commit and push to main
```

---

## Git Workflow

### Branching Strategy
```
main
├── phase1/backend     (all backend code)
├── phase2/web         (consumer web app)
├── phase2/mobile      (mobile app)
└── phase2/admin       (admin web app)
```

### Commit Convention
```
feat: add tutor profile CRUD endpoints
fix: resolve CORS issue with Synapse requests
test: add unit tests for session conflict detection
refactor: extract booking logic into dedicated service
docs: update API documentation for review endpoints
chore: upgrade matrix-js-sdk to latest version
```

### Push Strategy
- Push after completing each major step in the build order
- At minimum: push at end of each day's work
- Always push before switching to a different agent/phase

---

## Troubleshooting Common Issues

### Docker
- If containers fail to start: `docker compose down -v && docker compose up -d`
- If postgres won't initialize: delete the volume `docker volume rm rihla_postgres_data`
- If Synapse errors: check `docker logs rihla-synapse-1` for config issues

### Backend
- If imports fail: ensure virtualenv is activated and requirements.txt is installed
- If migrations fail: check DATABASE_URL in .env matches running postgres
- If Ollama is slow: first request loads model into memory (~30-60 sec), subsequent requests are fast

### Mobile
- If build fails: `npx expo start --clear` to clear cache
- If API calls fail: verify API_URL uses local IP not localhost
- If native modules crash: rebuild dev client `npx expo run:android`

### Web
- If CORS errors: check CORS_ORIGINS in backend .env includes the web app URL
- If auth cookies not sent: verify Axios has `withCredentials: true`
- If Matrix SDK errors: check Synapse is running and MATRIX_HOMESERVER_URL is correct

---

## Library Version Policy

ALL libraries must be the LATEST STABLE version at time of installation.

Install commands should always use:
- Python: `pip install <package>` (latest by default)
- Node: `npm install <package>@latest`

Never pin to old versions unless there's a documented incompatibility.
Before installing any library, verify it's actively maintained (last release < 6 months ago).
