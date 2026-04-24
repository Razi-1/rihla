# IMPLEMENTATION_PLAN.md — Rihla Complete Project Specification

## Table of Contents
1. [Complete File Structure](#1-complete-file-structure)
2. [Database Schema](#2-database-schema)
3. [API Endpoint Map](#3-api-endpoint-map)
4. [Docker Compose Configuration](#4-docker-compose-configuration)
5. [Phased Build Order](#5-phased-build-order)
6. [Integration Specifications](#6-integration-specifications)
7. [Edge Cases & Business Rules](#7-edge-cases--business-rules)

---

## 1. Complete File Structure

```
rihla/
├── CLAUDE.md
├── IMPLEMENTATION_PLAN.md
├── AGENT_INSTRUCTIONS.md
├── SETUP_GUIDE.md
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── .env                           # gitignored
├── .gitignore
├── README.md
├── mkcert/                        # Local SSL certs (gitignored)
│   ├── localhost+2.pem
│   └── localhost+2-key.pem
│
├── backend/
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── Dockerfile
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/              # Migration files auto-generated
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI app factory, lifespan, middleware
│   │   ├── config.py              # Pydantic Settings, env var loading
│   │   ├── database.py            # Async engine, session factory
│   │   ├── dependencies.py        # Dependency injection (get_db, get_current_user)
│   │   │
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── security.py        # JWT encode/decode, Argon2 hash/verify, Fernet encrypt/decrypt, HMAC
│   │   │   ├── auth.py            # Auth middleware, role checking, CSRF validation
│   │   │   ├── rate_limiter.py    # Redis-based rate limiting
│   │   │   ├── logging_config.py  # Structured logging setup
│   │   │   └── exceptions.py      # Custom exception classes + handlers
│   │   │
│   │   ├── models/                # SQLAlchemy ORM models
│   │   │   ├── __init__.py        # Base model class, imports all models
│   │   │   ├── base.py            # DeclarativeBase with common mixins (id, timestamps)
│   │   │   ├── account.py         # Account (all roles share this)
│   │   │   ├── student.py         # StudentProfile, StudentSubject
│   │   │   ├── tutor.py           # TutorProfile, TutorSubject, TutorWorkingHours, TutorContact
│   │   │   ├── parent.py          # ParentProfile, ParentStudentLink, ParentInviteToken, ParentTutorPermission
│   │   │   ├── admin.py           # AdminProfile
│   │   │   ├── subject.py         # SubjectCategory, Subject, EducationLevel, SubjectLevelAvailability
│   │   │   ├── session.py         # Session, RecurrenceRule, OccurrenceException
│   │   │   ├── invite.py          # SessionInvite
│   │   │   ├── enrolment.py       # Enrolment
│   │   │   ├── attendance.py      # AttendanceRecord, QRToken
│   │   │   ├── review.py          # Review, ReviewAuthorship, ReviewDurationSignal
│   │   │   ├── ml.py              # TutorSentiment, TutorMLVectors
│   │   │   ├── chat.py            # ChatRoomMapping, JitsiRoom
│   │   │   ├── notification.py    # Notification, EmailLog
│   │   │   ├── audit.py           # AdminAuditLog
│   │   │   ├── location.py        # Country, Region, City
│   │   │   └── token.py           # RefreshToken, PasswordResetToken, EmailVerificationToken
│   │   │
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   │   ├── __init__.py
│   │   │   ├── auth.py            # LoginRequest, RegisterRequest, TokenResponse, PasswordResetRequest
│   │   │   ├── account.py         # AccountResponse, AccountUpdateRequest, SettingsUpdateRequest
│   │   │   ├── student.py         # StudentProfileResponse, StudentProfileUpdateRequest
│   │   │   ├── tutor.py           # TutorProfileResponse, TutorProfileUpdateRequest, TutorCardResponse, WorkingHoursRequest
│   │   │   ├── parent.py          # ParentDashboardResponse, PermissionToggleRequest, LinkChildRequest
│   │   │   ├── admin.py           # AdminDashboardResponse, RestrictAccountRequest, CreateAdminRequest
│   │   │   ├── subject.py         # SubjectCategoryResponse, SubjectResponse, EducationLevelResponse
│   │   │   ├── session.py         # SessionCreateRequest, SessionResponse, RecurrenceRequest
│   │   │   ├── invite.py          # InviteResponse, InviteActionRequest
│   │   │   ├── enrolment.py       # EnrolmentResponse
│   │   │   ├── review.py          # ReviewCreateRequest, ReviewResponse, ReviewUpdateRequest
│   │   │   ├── attendance.py      # AttendanceResponse, QRValidateRequest
│   │   │   ├── notification.py    # NotificationResponse
│   │   │   ├── search.py          # SearchFilters, AISearchRequest, SearchResultResponse
│   │   │   ├── chat.py            # CreateRoomRequest, RoomResponse
│   │   │   ├── calendar.py        # CalendarEventResponse
│   │   │   └── common.py          # PaginatedResponse, ErrorResponse, SuccessResponse
│   │   │
│   │   ├── api/                   # Route handlers (thin — delegate to services)
│   │   │   ├── __init__.py
│   │   │   ├── v1/
│   │   │   │   ├── __init__.py    # v1 router with all sub-routers
│   │   │   │   ├── auth.py        # POST /register, /login, /logout, /refresh, /verify-email, /resend-verification, /forgot-password, /reset-password, /recover-email
│   │   │   │   ├── accounts.py    # GET/PUT /me, PUT /me/password, DELETE /me, POST /me/cancel-deletion, GET /me/settings, PUT /me/settings
│   │   │   │   ├── students.py    # GET/PUT /students/me/profile
│   │   │   │   ├── tutors.py      # GET /tutors (public list), GET /tutors/{id} (public profile), GET /tutors/{id}/auth (authenticated profile), PUT /tutors/me/profile, PUT /tutors/me/working-hours, PUT /tutors/me/pricing, GET /tutors/me/preview, GET /tutors/{id}/classes (public group classes)
│   │   │   │   ├── parents.py     # GET /parents/me/dashboard, POST /parents/me/link-child, GET /parents/me/children, GET /parents/me/children/{id}, PUT /parents/me/children/{student_id}/permissions/{tutor_id}
│   │   │   │   ├── sessions.py    # POST /sessions, PUT /sessions/{id}, DELETE /sessions/{id}, GET /sessions/{id}
│   │   │   │   ├── invites.py     # GET /invites, GET /invites/{id}, POST /invites/{id}/respond
│   │   │   │   ├── enrolments.py  # GET /enrolments, POST /enrolments/{id}/opt-out
│   │   │   │   ├── attendance.py  # POST /attendance/generate-qr, POST /attendance/validate-qr, POST /attendance/jitsi-webhook
│   │   │   │   ├── reviews.py     # POST /reviews, GET /reviews/tutor/{id}, GET /reviews/me/{tutor_id}, PUT /reviews/{id}, DELETE /reviews/{id}
│   │   │   │   ├── chat.py        # POST /chat/rooms/dm, GET /chat/rooms, GET /chat/contacts, POST /chat/rooms/broadcast
│   │   │   │   ├── notifications.py # GET /notifications, PUT /notifications/mark-read, PUT /notifications/{id}/read
│   │   │   │   ├── search.py      # GET /search/tutors (structured), POST /search/tutors/ai (AI search)
│   │   │   │   ├── ai.py          # POST /ai/assistant/message (student/tutor AI chat)
│   │   │   │   ├── calendar.py    # GET /calendar/events
│   │   │   │   ├── subjects.py    # GET /subjects/categories, GET /subjects, GET /education-levels
│   │   │   │   ├── locations.py   # GET /locations/countries, GET /locations/regions/{country_id}, GET /locations/cities/{region_id}
│   │   │   │   └── files.py       # POST /files/upload, GET /files/{key}
│   │   │   └── admin/
│   │   │       ├── __init__.py    # Admin router with admin auth middleware
│   │   │       ├── auth.py        # POST /admin/login, POST /admin/logout
│   │   │       ├── dashboard.py   # GET /admin/dashboard
│   │   │       ├── accounts.py    # GET /admin/accounts, GET /admin/accounts/{id}, POST /admin/accounts/{id}/restrict, POST /admin/accounts/{id}/unrestrict, DELETE /admin/accounts/{id}
│   │   │       ├── reviews.py     # GET /admin/reviews, GET /admin/reviews/{id}, DELETE /admin/reviews/{id}
│   │   │       ├── audit.py       # GET /admin/audit-log, GET /admin/audit-log/export
│   │   │       ├── subjects.py    # POST /admin/subjects/categories, POST /admin/subjects, PUT /admin/subjects/{id}, DELETE /admin/subjects/{id}
│   │   │       └── admins.py      # GET /admin/team, POST /admin/team/create
│   │   │
│   │   ├── services/              # Business logic layer (all logic lives here)
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py    # Register, login, token lifecycle, password reset, email verification
│   │   │   ├── account_service.py # Profile CRUD, settings, deletion lifecycle
│   │   │   ├── tutor_service.py   # Tutor profile, working hours, pricing, profile completeness
│   │   │   ├── student_service.py # Student profile, subject management
│   │   │   ├── parent_service.py  # Child linking, permission management, invite flow
│   │   │   ├── session_service.py # Session CRUD, conflict detection, 48-hour rule, type toggling
│   │   │   ├── invite_service.py  # Invite creation, conflict snapshot, response handling
│   │   │   ├── enrolment_service.py # Enrolment creation, opt-out, calendar population
│   │   │   ├── attendance_service.py # QR generation/validation, Jitsi webhook processing
│   │   │   ├── review_service.py  # Review CRUD, eligibility check, orphaning on deletion
│   │   │   ├── chat_service.py    # Matrix room creation, contact management, broadcast rooms
│   │   │   ├── notification_service.py # Create notifications, FCM push, email dispatch
│   │   │   ├── search_service.py  # Structured search (weighted scoring), AI search orchestration
│   │   │   ├── calendar_service.py # Calendar event aggregation per role
│   │   │   ├── file_service.py    # MinIO upload/download/delete
│   │   │   ├── email_service.py   # SMTP email sending via Mailpit
│   │   │   └── admin_service.py   # Admin operations, restriction, audit logging
│   │   │
│   │   ├── ml/                    # Machine learning pipeline
│   │   │   ├── __init__.py
│   │   │   ├── sentiment.py       # DistilBERT: load model, process reviews, produce summary + score
│   │   │   ├── ranking.py         # scikit-learn: load .pkl, score tutors, confidence weighting
│   │   │   ├── nlp_extractor.py   # Gemma 4 via Ollama: extract structured params from NL query
│   │   │   ├── reliability.py     # Compute reliability vectors from session/attendance data
│   │   │   └── vectors.py         # Vector update orchestration, recomputation triggers
│   │   │
│   │   ├── integrations/          # External service clients
│   │   │   ├── __init__.py
│   │   │   ├── matrix_client.py   # Synapse Admin API: create users, rooms, manage membership, power levels
│   │   │   ├── jitsi_client.py    # Generate Jitsi JWTs, room name generation
│   │   │   ├── ollama_client.py   # HTTP client for Ollama REST API
│   │   │   ├── minio_client.py    # S3 client for MinIO: upload, download, presigned URLs
│   │   │   ├── firebase_client.py # FCM push notification sending
│   │   │   └── sygnal_client.py   # Sygnal push gateway configuration
│   │   │
│   │   ├── tasks/                 # APScheduler background jobs
│   │   │   ├── __init__.py
│   │   │   ├── scheduler.py       # APScheduler setup, job registration
│   │   │   ├── age_restriction.py # Daily: lift restrictions on 15th birthday
│   │   │   ├── session_generation.py # Daily: pre-generate recurring occurrences (3-month horizon)
│   │   │   ├── ml_recomputation.py   # Daily: recalculate reliability vectors for active tutors
│   │   │   ├── account_deletion.py   # Daily: process accounts past 7-day grace period
│   │   │   └── cleanup.py         # Daily: expire old tokens, clean temp files
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── id_validation.py   # python-stdnum integration + Sri Lanka NIC validator
│   │       ├── phone_validation.py # python-phonenumbers wrapper
│   │       ├── qr_generator.py    # QR code image generation from signed JWTs
│   │       ├── password_strength.py # Password requirements checker + strength scorer
│   │       └── timezone_utils.py  # Timezone conversion helpers
│   │
│   ├── scripts/                   # One-time management scripts
│   │   ├── create_admin.py        # CLI: create first admin account
│   │   ├── seed_data.py           # Generate synthetic tutors, students, reviews, sessions
│   │   ├── train_model.py         # Train scikit-learn ranking model from seed data
│   │   ├── import_locations.py    # Import GeoNames data into locations tables
│   │   ├── import_subjects.py     # Import predefined subject hierarchy
│   │   └── generate_keys.py      # Generate all required secret keys
│   │
│   ├── data/
│   │   ├── subjects.json          # Predefined subject hierarchy (category → subject → levels)
│   │   ├── common_passwords.txt   # Top 1000 common passwords for validation
│   │   └── models/
│   │       └── ranking_model.pkl  # Trained scikit-learn model (gitignored, generated by train_model.py)
│   │
│   └── tests/
│       ├── conftest.py            # Test fixtures, async test client, test DB setup
│       ├── factories.py           # Factory classes for generating test data
│       ├── unit/
│       │   ├── test_id_validation.py
│       │   ├── test_phone_validation.py
│       │   ├── test_password_strength.py
│       │   ├── test_security.py
│       │   ├── test_auth_service.py
│       │   ├── test_session_service.py
│       │   ├── test_review_service.py
│       │   ├── test_invite_service.py
│       │   ├── test_search_service.py
│       │   ├── test_attendance_service.py
│       │   └── test_parent_service.py
│       ├── integration/
│       │   ├── test_auth_flow.py
│       │   ├── test_booking_flow.py
│       │   ├── test_review_flow.py
│       │   ├── test_parent_link_flow.py
│       │   ├── test_class_lifecycle.py
│       │   └── test_search_flow.py
│       └── e2e/
│           ├── test_student_journey.py
│           └── test_tutor_journey.py
│
├── web/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── index.html
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── main.tsx               # React DOM render, router setup
│       ├── App.tsx                # Root component, route definitions
│       ├── vite-env.d.ts
│       ├── styles/
│       │   ├── globals.css        # Reset, CSS variables (design system), base styles
│       │   ├── animations.css     # Framer Motion keyframes, transition presets
│       │   └── fonts.css          # Inter font import from Google Fonts
│       ├── lib/
│       │   ├── axios.ts           # Axios instance with interceptors, withCredentials, CSRF
│       │   ├── matrix.ts          # matrix-js-sdk client initialization (web, Rust crypto)
│       │   └── jitsi.ts           # Jitsi IFrame API wrapper
│       ├── store/
│       │   ├── authStore.ts       # User, tokens, login/logout, role
│       │   └── notificationStore.ts # Unread count, notification list
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useChat.ts         # Matrix message send/receive
│       │   ├── useNotifications.ts
│       │   ├── useCalendar.ts
│       │   ├── useAnimations.ts   # Shared Framer Motion animation variants
│       │   └── useDebounce.ts
│       ├── services/
│       │   ├── authService.ts
│       │   ├── tutorService.ts
│       │   ├── studentService.ts
│       │   ├── parentService.ts
│       │   ├── sessionService.ts
│       │   ├── reviewService.ts
│       │   ├── searchService.ts
│       │   ├── calendarService.ts
│       │   ├── notificationService.ts
│       │   ├── chatService.ts
│       │   ├── fileService.ts
│       │   ├── locationService.ts
│       │   └── subjectService.ts
│       ├── types/
│       │   ├── auth.ts
│       │   ├── tutor.ts
│       │   ├── student.ts
│       │   ├── parent.ts
│       │   ├── session.ts
│       │   ├── review.ts
│       │   ├── chat.ts
│       │   ├── calendar.ts
│       │   ├── notification.ts
│       │   └── common.ts
│       ├── utils/
│       │   ├── formatters.ts      # Date, currency, timezone formatting
│       │   ├── validators.ts      # Zod schemas shared across forms
│       │   └── constants.ts       # Session durations, education levels, etc.
│       ├── components/
│       │   ├── common/
│       │   │   ├── Button.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── TextArea.tsx
│       │   │   ├── Select.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── ConfirmDialog.tsx
│       │   │   ├── Avatar.tsx
│       │   │   ├── Badge.tsx
│       │   │   ├── Chip.tsx
│       │   │   ├── StarRating.tsx
│       │   │   ├── PasswordStrengthMeter.tsx
│       │   │   ├── PhoneInput.tsx
│       │   │   ├── CountrySelect.tsx
│       │   │   ├── SubjectSelect.tsx
│       │   │   ├── EducationLevelSelect.tsx
│       │   │   ├── Skeleton.tsx
│       │   │   ├── LoadMoreButton.tsx
│       │   │   ├── EmptyState.tsx
│       │   │   ├── ErrorBoundary.tsx
│       │   │   ├── ProtectedRoute.tsx
│       │   │   └── PageTransition.tsx # Framer Motion page wrapper
│       │   ├── layout/
│       │   │   ├── AppShell.tsx    # Sidebar + header + content area
│       │   │   ├── Sidebar.tsx     # Role-variant navigation
│       │   │   ├── Header.tsx      # Page title, notification bell, search
│       │   │   ├── Footer.tsx      # Public pages only
│       │   │   └── PublicLayout.tsx # Layout for unauthenticated pages
│       │   ├── auth/
│       │   │   ├── AccountTypeSelector.tsx
│       │   │   ├── RegisterForm.tsx
│       │   │   ├── LoginForm.tsx
│       │   │   ├── PasswordRecoveryForm.tsx
│       │   │   ├── ParentLinkStep.tsx
│       │   │   └── EmailVerificationBanner.tsx
│       │   ├── search/
│       │   │   ├── FilterPanel.tsx
│       │   │   ├── AISearchBar.tsx
│       │   │   ├── TutorCard.tsx
│       │   │   ├── TutorCardCompact.tsx
│       │   │   ├── SearchResults.tsx
│       │   │   └── BudgetBanner.tsx
│       │   ├── tutor/
│       │   │   ├── ProfileHeader.tsx
│       │   │   ├── ProfileBio.tsx
│       │   │   ├── WorkingHoursGrid.tsx
│       │   │   ├── GroupClassCard.tsx
│       │   │   ├── SentimentSummary.tsx
│       │   │   ├── ReviewList.tsx
│       │   │   ├── RatingDistribution.tsx
│       │   │   ├── ProfileCompletionSteps.tsx
│       │   │   ├── EditProfileForm.tsx
│       │   │   ├── PricingForm.tsx
│       │   │   └── WorkingHoursEditor.tsx
│       │   ├── student/
│       │   │   ├── DashboardCards.tsx
│       │   │   ├── ClassList.tsx
│       │   │   ├── InviteCard.tsx
│       │   │   ├── ClassDetailTabs.tsx
│       │   │   ├── ReviewForm.tsx
│       │   │   └── ReviewDurationPrompt.tsx
│       │   ├── parent/
│       │   │   ├── ChildCard.tsx
│       │   │   ├── PermissionToggle.tsx
│       │   │   ├── LinkChildForm.tsx
│       │   │   └── ChildCalendarLegend.tsx
│       │   ├── session/
│       │   │   ├── CreateClassForm.tsx
│       │   │   ├── RecurrenceEditor.tsx
│       │   │   ├── StudentInviteSelector.tsx
│       │   │   ├── ClassSpaceTabs.tsx
│       │   │   ├── MembersTab.tsx
│       │   │   ├── BroadcastTab.tsx
│       │   │   ├── AttendanceTab.tsx
│       │   │   └── ConflictWarning.tsx
│       │   ├── calendar/
│       │   │   ├── CalendarView.tsx # FullCalendar wrapper
│       │   │   ├── EventBlock.tsx
│       │   │   ├── EventDetail.tsx
│       │   │   └── CalendarFilters.tsx
│       │   ├── chat/
│       │   │   ├── ChatList.tsx
│       │   │   ├── ChatConversation.tsx
│       │   │   ├── MessageBubble.tsx
│       │   │   ├── ChatInput.tsx
│       │   │   ├── FileAttachment.tsx
│       │   │   ├── BookingCard.tsx  # In-chat booking negotiation
│       │   │   ├── AIAssistantChat.tsx
│       │   │   └── TypingIndicator.tsx
│       │   ├── notification/
│       │   │   ├── NotificationBell.tsx
│       │   │   ├── NotificationDropdown.tsx
│       │   │   └── NotificationRow.tsx
│       │   └── settings/
│       │       ├── SettingsForm.tsx
│       │       ├── ChangePasswordForm.tsx
│       │       └── DeleteAccountFlow.tsx
│       └── pages/
│           ├── public/
│           │   ├── Landing.tsx
│           │   ├── Login.tsx
│           │   ├── Register.tsx
│           │   ├── PasswordRecovery.tsx
│           │   ├── TutorSearchPublic.tsx
│           │   ├── TutorProfilePublic.tsx
│           │   ├── TermsPrivacy.tsx
│           │   └── VerifyEmail.tsx
│           ├── student/
│           │   ├── Dashboard.tsx
│           │   ├── TutorSearch.tsx
│           │   ├── TutorProfile.tsx
│           │   ├── Profile.tsx
│           │   ├── ClassInvite.tsx
│           │   └── ClassDetail.tsx
│           ├── tutor/
│           │   ├── Dashboard.tsx
│           │   ├── EditProfile.tsx
│           │   ├── ProfilePreview.tsx
│           │   ├── CreateClass.tsx
│           │   └── ClassSpace.tsx
│           ├── parent/
│           │   ├── Dashboard.tsx
│           │   ├── ChildOverview.tsx
│           │   ├── Profile.tsx
│           │   └── LinkChild.tsx
│           └── shared/
│               ├── Calendar.tsx
│               ├── ChatList.tsx
│               ├── ChatConversation.tsx
│               ├── VideoCall.tsx
│               ├── Settings.tsx
│               ├── Notifications.tsx
│               └── HelpSupport.tsx
│
├── mobile/
│   ├── package.json
│   ├── app.json                   # Expo config (dev-client, not Expo Go)
│   ├── tsconfig.json
│   ├── babel.config.js            # Reanimated plugin
│   ├── metro.config.js
│   ├── index.js                   # Polyfills: react-native-url-polyfill FIRST
│   ├── App.tsx                    # SafeAreaProvider + GestureHandlerRootView
│   ├── eas.json                   # EAS Build config for dev client
│   └── src/
│       ├── theme/
│       │   ├── colors.ts          # Design system color tokens
│       │   ├── typography.ts      # Font sizes, weights
│       │   ├── spacing.ts         # Spacing scale
│       │   └── animations.ts      # Reanimated/Moti presets
│       ├── lib/
│       │   ├── axios.ts           # Axios with Bearer token from SecureStore
│       │   ├── matrix.ts          # matrix-js-sdk client (legacy Olm crypto)
│       │   ├── secureStore.ts     # expo-secure-store wrapper
│       │   └── notifications.ts   # expo-notifications + FCM setup
│       ├── store/
│       │   ├── authStore.ts
│       │   └── notificationStore.ts
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useChat.ts
│       │   └── useNotifications.ts
│       ├── services/              # Mirror of web/src/services/
│       │   └── (same service files as web)
│       ├── types/                 # Mirror of web/src/types/
│       │   └── (same type files as web)
│       ├── utils/
│       │   └── (same util files as web)
│       ├── navigation/
│       │   ├── RootNavigator.tsx   # Auth check → AuthNavigator or MainNavigator
│       │   ├── AuthNavigator.tsx   # Login, Register, PasswordRecovery, VerifyEmail
│       │   ├── StudentTabNavigator.tsx  # Home, Search, Calendar, Messages, Profile
│       │   ├── TutorTabNavigator.tsx    # Home, MyClasses, Calendar, Messages, Profile
│       │   ├── ParentTabNavigator.tsx   # Home, Children, Calendar, Messages, Profile
│       │   └── types.ts           # Navigation type definitions
│       ├── components/
│       │   ├── common/            # Mobile versions of shared components
│       │   │   ├── Button.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── BottomSheet.tsx # Replaces Modal for mobile
│       │   │   ├── Avatar.tsx
│       │   │   ├── Badge.tsx
│       │   │   ├── StarRating.tsx
│       │   │   ├── PhoneInput.tsx
│       │   │   ├── Skeleton.tsx
│       │   │   ├── AnimatedCard.tsx # Moti-powered card with entrance animation
│       │   │   └── PullToRefresh.tsx
│       │   ├── (same domain folders as web, with mobile-specific implementations)
│       │   └── qr/
│       │       ├── QRScanner.tsx   # expo-camera QR scanner
│       │       └── QRDisplay.tsx   # QR code display with countdown
│       └── screens/
│           ├── public/
│           ├── student/
│           ├── tutor/
│           ├── parent/
│           └── shared/
│
├── admin/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── styles/
│       │   └── globals.css        # Admin-specific: red accent sidebar
│       ├── lib/
│       │   └── axios.ts
│       ├── store/
│       │   └── authStore.ts
│       ├── services/
│       │   ├── adminAuthService.ts
│       │   ├── accountService.ts
│       │   ├── reviewService.ts
│       │   ├── auditService.ts
│       │   └── subjectService.ts
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AdminShell.tsx
│       │   │   ├── AdminSidebar.tsx # Red accent, distinct from consumer navy
│       │   │   └── AdminHeader.tsx
│       │   ├── common/
│       │   │   ├── DataTable.tsx   # Sortable, filterable, paginated table
│       │   │   ├── ConfirmAction.tsx # Reason + confirmation flow
│       │   │   └── StatCard.tsx
│       │   ├── accounts/
│       │   │   ├── AccountFilters.tsx
│       │   │   ├── AccountRow.tsx
│       │   │   └── AccountTimeline.tsx
│       │   ├── reviews/
│       │   │   ├── ReviewFilters.tsx
│       │   │   └── ReviewRow.tsx
│       │   └── audit/
│       │       ├── AuditFilters.tsx
│       │       └── AuditRow.tsx
│       └── pages/
│           ├── Login.tsx
│           ├── Dashboard.tsx
│           ├── AccountList.tsx
│           ├── AccountDetail.tsx
│           ├── ReviewList.tsx
│           ├── ReviewDetail.tsx
│           ├── AuditLog.tsx
│           ├── SubjectManagement.tsx
│           ├── AdminTeam.tsx
│           └── AdminProfile.tsx
│
├── shared/
│   ├── constants/
│   │   ├── sessionTypes.ts        # BOOKING_MEETING, INDIVIDUAL_CLASS, GROUP_CLASS
│   │   ├── sessionModes.ts        # ONLINE, PHYSICAL, HYBRID
│   │   ├── accountTypes.ts        # STUDENT, TUTOR, PARENT, ADMIN
│   │   ├── durations.ts           # [30, 45, 60, 90, 120]
│   │   ├── inviteStatuses.ts      # PENDING, ACCEPTED, DECLINED
│   │   └── notificationTypes.ts   # All notification event types
│   └── types/
│       └── api.ts                 # Shared API response types
│
└── docker/
    ├── backend/
    │   └── Dockerfile
    ├── synapse/
    │   ├── homeserver.yaml        # Synapse configuration
    │   └── log.config             # Synapse logging config
    ├── jitsi/
    │   └── .env                   # Jitsi-specific env vars
    ├── sygnal/
    │   └── sygnal.yaml            # Push gateway config
    ├── minio/
    │   └── init-buckets.sh        # Create default buckets on startup
    └── nginx/
        └── nginx.conf             # Reverse proxy (optional, for unified HTTPS)
```

---

## 2. Database Schema

All tables use UUID v4 primary keys. All timestamps are UTC. Common columns (id, created_at, updated_at) are inherited from a base mixin.

### 2.1 Core Identity

#### accounts
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid4 | |
| email | VARCHAR(255) | NOT NULL | |
| account_type | VARCHAR(20) | NOT NULL, CHECK IN ('student','tutor','parent','admin') | |
| password_hash | VARCHAR(255) | NOT NULL | Argon2 |
| government_id_encrypted | TEXT | NOT NULL | Fernet AES-256 |
| government_id_hmac | VARCHAR(64) | NOT NULL | HMAC-SHA256 |
| id_country_code | VARCHAR(3) | NOT NULL | Country of ID issuance |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| date_of_birth | DATE | NOT NULL | Validated: age 7-100 |
| gender | VARCHAR(20) | NULL | Auto-extracted where possible |
| phone_number | VARCHAR(20) | NULL | E.164 format |
| phone_country_code | VARCHAR(5) | NULL | e.g., +94, +92 |
| profile_picture_url | VARCHAR(500) | NULL | MinIO URL |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | FALSE = soft deleted |
| is_restricted | BOOLEAN | NOT NULL, DEFAULT FALSE | Admin moderation |
| is_email_verified | BOOLEAN | NOT NULL, DEFAULT FALSE | |
| is_age_restricted | BOOLEAN | NOT NULL, DEFAULT FALSE | Under-15 flag |
| deletion_requested_at | TIMESTAMP | NULL | |
| deletion_scheduled_for | TIMESTAMP | NULL | requested_at + 7 days |
| last_login_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Auto-update trigger |

**Constraints:**
- UNIQUE (government_id_hmac, email, account_type) — composite uniqueness key
- UNIQUE (email, account_type) — prevents same email for same role

**Indexes:**
- idx_accounts_email_type ON (email, account_type)
- idx_accounts_age_restricted ON (id) WHERE is_age_restricted = TRUE (partial, for daily birthday job)
- idx_accounts_pending_deletion ON (id) WHERE deletion_scheduled_for IS NOT NULL (partial)
- idx_accounts_active ON (id) WHERE is_active = TRUE (partial)

### 2.2 Role Profiles

#### student_profiles
| Column | Type | Constraints |
|--------|------|-------------|
| account_id | UUID | PK, FK → accounts.id ON DELETE CASCADE |
| education_level_id | UUID | NULL, FK → education_levels.id |
| bio | TEXT | NULL |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

#### tutor_profiles
| Column | Type | Constraints |
|--------|------|-------------|
| account_id | UUID | PK, FK → accounts.id ON DELETE CASCADE |
| bio | TEXT | NULL |
| mode_of_tuition | VARCHAR(20) | NULL, CHECK IN ('online','physical','hybrid') |
| country_id | UUID | NULL, FK → countries.id |
| region_id | UUID | NULL, FK → regions.id |
| city_id | UUID | NULL, FK → cities.id |
| individual_rate | DECIMAL(10,2) | NULL |
| group_rate | DECIMAL(10,2) | NULL |
| currency | VARCHAR(3) | NULL | ISO 4217 (LKR, PKR, USD, etc.) |
| is_profile_complete | BOOLEAN | NOT NULL, DEFAULT FALSE |
| timezone | VARCHAR(50) | NULL | e.g., Asia/Colombo |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

**Profile completeness requires:** ≥1 tutor_subject, mode_of_tuition set, individual_rate OR group_rate set. Computed on each profile update.

#### parent_profiles
| Column | Type | Constraints |
|--------|------|-------------|
| account_id | UUID | PK, FK → accounts.id ON DELETE CASCADE |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

#### admin_profiles
| Column | Type | Constraints |
|--------|------|-------------|
| account_id | UUID | PK, FK → accounts.id ON DELETE CASCADE |
| must_change_password | BOOLEAN | NOT NULL, DEFAULT TRUE | First-login flag |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

### 2.3 Subject Hierarchy

#### subject_categories
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL, UNIQUE |
| display_order | INTEGER | NOT NULL, DEFAULT 0 |

#### subjects
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| category_id | UUID | NOT NULL, FK → subject_categories.id ON DELETE CASCADE |
| name | VARCHAR(100) | NOT NULL |
| display_order | INTEGER | NOT NULL, DEFAULT 0 |
| UNIQUE (category_id, name) |

#### education_levels
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(50) | NOT NULL, UNIQUE | Primary, Lower Secondary, O-Level, A-Level, University |
| display_order | INTEGER | NOT NULL |
| min_age | INTEGER | NULL | Suggested min age |
| max_age | INTEGER | NULL | Suggested max age |

#### subject_level_availability
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| subject_id | UUID | NOT NULL, FK → subjects.id ON DELETE CASCADE |
| education_level_id | UUID | NOT NULL, FK → education_levels.id ON DELETE CASCADE |
| UNIQUE (subject_id, education_level_id) |

### 2.4 Tutor Details

#### tutor_subjects
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| tutor_id | UUID | NOT NULL, FK → accounts.id ON DELETE CASCADE |
| subject_id | UUID | NOT NULL, FK → subjects.id |
| education_level_id | UUID | NOT NULL, FK → education_levels.id |
| UNIQUE (tutor_id, subject_id, education_level_id) |

#### tutor_working_hours
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| tutor_id | UUID | NOT NULL, FK → accounts.id ON DELETE CASCADE |
| day_of_week | INTEGER | NOT NULL, CHECK 0-6 | 0=Mon, 6=Sun |
| start_time | TIME | NOT NULL |
| end_time | TIME | NOT NULL |
| is_working | BOOLEAN | NOT NULL, DEFAULT TRUE |
| timezone | VARCHAR(50) | NOT NULL | Anchored to tutor's registered location |
| UNIQUE (tutor_id, day_of_week) |

#### tutor_contacts
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| tutor_id | UUID | NOT NULL, FK → accounts.id |
| contact_account_id | UUID | NOT NULL, FK → accounts.id |
| contact_type | VARCHAR(20) | NOT NULL, CHECK IN ('student','parent') |
| created_at | TIMESTAMP | NOT NULL |
| UNIQUE (tutor_id, contact_account_id) |

### 2.5 Student Details

#### student_subjects
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| student_id | UUID | NOT NULL, FK → accounts.id ON DELETE CASCADE |
| subject_id | UUID | NOT NULL, FK → subjects.id |
| education_level_id | UUID | NOT NULL, FK → education_levels.id |
| UNIQUE (student_id, subject_id, education_level_id) |

### 2.6 Parent System

#### parent_student_links
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| parent_id | UUID | NOT NULL, FK → accounts.id ON DELETE CASCADE |
| student_id | UUID | NOT NULL, FK → accounts.id ON DELETE CASCADE |
| status | VARCHAR(20) | NOT NULL, CHECK IN ('pending','active'), DEFAULT 'pending' |
| created_at | TIMESTAMP | NOT NULL |
| UNIQUE (parent_id, student_id) |

#### parent_invite_tokens
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| student_id | UUID | NOT NULL, FK → accounts.id ON DELETE CASCADE |
| parent_email | VARCHAR(255) | NOT NULL |
| token_hash | VARCHAR(64) | NOT NULL | HMAC-SHA256 |
| is_used | BOOLEAN | NOT NULL, DEFAULT FALSE |
| expires_at | TIMESTAMP | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

#### parent_tutor_permissions
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| parent_id | UUID | NOT NULL, FK → accounts.id |
| student_id | UUID | NOT NULL, FK → accounts.id |
| tutor_id | UUID | NOT NULL, FK → accounts.id |
| status | VARCHAR(20) | NOT NULL, CHECK IN ('pending','granted','denied'), DEFAULT 'pending' |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |
| UNIQUE (parent_id, student_id, tutor_id) |

### 2.7 Auth Tokens

#### refresh_tokens
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| account_id | UUID | NOT NULL, FK → accounts.id ON DELETE CASCADE |
| token_hash | VARCHAR(64) | NOT NULL | HMAC-SHA256 of raw token |
| expires_at | TIMESTAMP | NOT NULL |
| is_revoked | BOOLEAN | NOT NULL, DEFAULT FALSE |
| created_at | TIMESTAMP | NOT NULL |

#### password_reset_tokens
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| account_id | UUID | NOT NULL, FK → accounts.id ON DELETE CASCADE |
| token_hash | VARCHAR(64) | NOT NULL |
| is_used | BOOLEAN | NOT NULL, DEFAULT FALSE |
| expires_at | TIMESTAMP | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

#### email_verification_tokens
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| account_id | UUID | NOT NULL, FK → accounts.id ON DELETE CASCADE |
| token_hash | VARCHAR(64) | NOT NULL |
| is_used | BOOLEAN | NOT NULL, DEFAULT FALSE |
| expires_at | TIMESTAMP | NOT NULL | 24 hours from creation |
| created_at | TIMESTAMP | NOT NULL |

### 2.8 Sessions

#### sessions
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| tutor_id | UUID | NOT NULL, FK → accounts.id |
| title | VARCHAR(200) | NOT NULL |
| session_type | VARCHAR(20) | NOT NULL, CHECK IN ('booking_meeting','individual_class','group_class') |
| mode | VARCHAR(20) | NOT NULL, CHECK IN ('online','physical','hybrid') |
| status | VARCHAR(20) | NOT NULL, CHECK IN ('draft','active','completed','cancelled'), DEFAULT 'draft' |
| location_address | TEXT | NULL | Full address (visible after invite acceptance) |
| location_city | VARCHAR(100) | NULL | City name (visible in invite preview) |
| location_region | VARCHAR(100) | NULL |
| location_country | VARCHAR(100) | NULL |
| duration_minutes | INTEGER | NOT NULL, CHECK IN (30,45,60,90,120) |
| start_time | TIMESTAMP | NOT NULL | UTC |
| end_time | TIMESTAMP | NOT NULL | UTC (computed from start + duration) |
| series_root_id | UUID | NULL, FK → sessions.id | Points to root for recurring occurrences |
| max_group_size | INTEGER | NULL | Tutor-defined cap for group classes |
| jitsi_room_name | VARCHAR(100) | NULL | Generated for online sessions |
| individual_rate_override | DECIMAL(10,2) | NULL | Per-class price override |
| group_rate_override | DECIMAL(10,2) | NULL |
| currency_override | VARCHAR(3) | NULL |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

**Indexes:**
- idx_sessions_tutor ON (tutor_id)
- idx_sessions_start_time ON (start_time)
- idx_sessions_series_root ON (series_root_id) WHERE series_root_id IS NOT NULL
- idx_sessions_active ON (id) WHERE status = 'active'

#### recurrence_rules
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| session_id | UUID | NOT NULL, FK → sessions.id ON DELETE CASCADE, UNIQUE |
| frequency | VARCHAR(20) | NOT NULL, CHECK IN ('weekly','biweekly','monthly') |
| days_of_week | JSONB | NOT NULL | Array of integers [0-6] |
| start_date | DATE | NOT NULL |
| end_date | DATE | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

#### occurrence_exceptions
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| series_root_id | UUID | NOT NULL, FK → sessions.id |
| original_start_time | TIMESTAMP | NOT NULL |
| new_start_time | TIMESTAMP | NULL | NULL if cancelled |
| new_end_time | TIMESTAMP | NULL |
| is_cancelled | BOOLEAN | NOT NULL, DEFAULT FALSE |
| reason | TEXT | NULL |
| created_at | TIMESTAMP | NOT NULL |
| UNIQUE (series_root_id, original_start_time) |

### 2.9 Invites & Enrolments

#### session_invites
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| session_id | UUID | NOT NULL, FK → sessions.id ON DELETE CASCADE |
| student_id | UUID | NOT NULL, FK → accounts.id |
| status | VARCHAR(20) | NOT NULL, CHECK IN ('pending','accepted','declined'), DEFAULT 'pending' |
| conflict_details | JSONB | NULL | Snapshot of conflicting events at invite time |
| declined_note | TEXT | NULL |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |
| UNIQUE (session_id, student_id) |

#### enrolments
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| session_id | UUID | NOT NULL, FK → sessions.id | Points to series root for recurring |
| student_id | UUID | NOT NULL, FK → accounts.id |
| status | VARCHAR(20) | NOT NULL, CHECK IN ('active','opted_out'), DEFAULT 'active' |
| enrolled_at | TIMESTAMP | NOT NULL |
| opted_out_at | TIMESTAMP | NULL |
| UNIQUE (session_id, student_id) |

### 2.10 Attendance

#### qr_tokens
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| session_id | UUID | NOT NULL, FK → sessions.id |
| token_hash | VARCHAR(64) | NOT NULL |
| valid_from | TIMESTAMP | NOT NULL |
| valid_until | TIMESTAMP | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

#### attendance_records
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| session_id | UUID | NOT NULL, FK → sessions.id |
| student_id | UUID | NOT NULL, FK → accounts.id |
| method | VARCHAR(20) | NOT NULL, CHECK IN ('qr_scan','jitsi_webhook') |
| recorded_at | TIMESTAMP | NOT NULL |
| UNIQUE (session_id, student_id) |

### 2.11 Reviews

#### reviews
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| tutor_id | UUID | NOT NULL, FK → accounts.id |
| rating | INTEGER | NOT NULL, CHECK 1-5 |
| text | TEXT | NOT NULL, CHECK length ≤ 5000 |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT FALSE |
| deleted_at | TIMESTAMP | NULL |
| deleted_by_admin_id | UUID | NULL, FK → accounts.id |
| admin_deletion_reason | TEXT | NULL, CHECK (is_deleted = FALSE OR admin_deletion_reason IS NOT NULL) |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

**Index:** idx_reviews_tutor_active ON (tutor_id) WHERE is_deleted = FALSE (partial)

#### review_authorships
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| review_id | UUID | NOT NULL, FK → reviews.id ON DELETE CASCADE, UNIQUE |
| student_id | UUID | NOT NULL, FK → accounts.id ON DELETE CASCADE |
| tutor_id | UUID | NOT NULL, FK → accounts.id |
| UNIQUE (student_id, tutor_id) | One review per student per tutor |

#### review_duration_signals
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| review_id | UUID | NOT NULL, FK → reviews.id ON DELETE CASCADE, UNIQUE |
| sessions_attended | INTEGER | NOT NULL |
| approximate_duration_weeks | INTEGER | NOT NULL |

### 2.12 ML Vectors

#### tutor_sentiment
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| tutor_id | UUID | NOT NULL, FK → accounts.id, UNIQUE |
| summary_text | TEXT | NULL | Human-readable, publicly visible |
| sentiment_score | DECIMAL(5,4) | NULL | 0.0000–1.0000, hidden |
| review_count | INTEGER | NOT NULL, DEFAULT 0 |
| last_computed_at | TIMESTAMP | NULL |

#### tutor_ml_vectors
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| tutor_id | UUID | NOT NULL, FK → accounts.id, UNIQUE |
| reliability_score | DECIMAL(5,4) | NULL | 0.0000–1.0000 |
| cancellation_rate_48h | DECIMAL(5,4) | NULL |
| reschedule_rate_48h | DECIMAL(5,4) | NULL |
| sessions_per_week_avg | DECIMAL(5,2) | NULL |
| total_students_taught | INTEGER | NOT NULL, DEFAULT 0 |
| total_sessions_completed | INTEGER | NOT NULL, DEFAULT 0 |
| last_computed_at | TIMESTAMP | NULL |

### 2.13 Chat & Video Mappings

#### chat_room_mappings
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| matrix_room_id | VARCHAR(255) | NOT NULL, UNIQUE |
| room_type | VARCHAR(20) | NOT NULL, CHECK IN ('dm','broadcast') |
| account_id_1 | UUID | NULL, FK → accounts.id | For DMs (lexicographically smaller UUID) |
| account_id_2 | UUID | NULL, FK → accounts.id | For DMs |
| session_id | UUID | NULL, FK → sessions.id | For broadcast rooms |
| created_at | TIMESTAMP | NOT NULL |
| UNIQUE (account_id_1, account_id_2) WHERE room_type = 'dm' |

#### jitsi_rooms
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| session_id | UUID | NOT NULL, FK → sessions.id |
| room_name | VARCHAR(100) | NOT NULL, UNIQUE |
| created_at | TIMESTAMP | NOT NULL |

### 2.14 System

#### notifications
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| account_id | UUID | NOT NULL, FK → accounts.id ON DELETE CASCADE |
| title | VARCHAR(200) | NOT NULL |
| body | TEXT | NULL |
| notification_type | VARCHAR(50) | NOT NULL |
| related_entity_id | UUID | NULL | Polymorphic (no FK) |
| related_entity_type | VARCHAR(50) | NULL |
| is_read | BOOLEAN | NOT NULL, DEFAULT FALSE |
| created_at | TIMESTAMP | NOT NULL |

**Index:** idx_notifications_unread ON (account_id) WHERE is_read = FALSE (partial)

#### email_logs
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| recipient_email | VARCHAR(255) | NOT NULL |
| subject | VARCHAR(500) | NOT NULL |
| notification_type | VARCHAR(50) | NOT NULL |
| status | VARCHAR(20) | NOT NULL, CHECK IN ('sent','failed') |
| error_message | TEXT | NULL |
| sent_at | TIMESTAMP | NOT NULL |

#### admin_audit_log
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| admin_id | UUID | NOT NULL, FK → accounts.id ON DELETE RESTRICT |
| action_type | VARCHAR(50) | NOT NULL |
| target_entity_id | UUID | NULL |
| target_entity_type | VARCHAR(50) | NULL |
| reason | TEXT | NOT NULL, CHECK length > 0 |
| outcome | VARCHAR(20) | NOT NULL, DEFAULT 'success' |
| created_at | TIMESTAMP | NOT NULL |

**Immutable:** No UPDATE or DELETE permitted. ON DELETE RESTRICT on admin FK.

### 2.15 Location Data

#### countries
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| code | VARCHAR(3) | NOT NULL, UNIQUE | ISO 3166-1 alpha-2 |
| name | VARCHAR(100) | NOT NULL |

#### regions
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| country_id | UUID | NOT NULL, FK → countries.id |
| code | VARCHAR(20) | NOT NULL |
| name | VARCHAR(100) | NOT NULL |
| UNIQUE (country_id, code) |

#### cities
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| region_id | UUID | NOT NULL, FK → regions.id |
| name | VARCHAR(100) | NOT NULL |
| population | INTEGER | NULL |
| latitude | DECIMAL(9,6) | NULL |
| longitude | DECIMAL(9,6) | NULL |

---

## 3. API Endpoint Map

### 3.1 Authentication (Public)
```
POST   /api/v1/auth/register              # Multi-step registration
POST   /api/v1/auth/login                  # Email + account_type + password → tokens
POST   /api/v1/auth/logout                 # Revoke refresh token, clear cookie
POST   /api/v1/auth/refresh                # Refresh token → new access token
POST   /api/v1/auth/verify-email           # Token from email link
POST   /api/v1/auth/resend-verification    # Resend verification email
POST   /api/v1/auth/forgot-password        # Email + account_type → reset link
POST   /api/v1/auth/reset-password         # Token + new password
POST   /api/v1/auth/recover-email          # Gov ID + password + type → masked email
```

### 3.2 Account (Authenticated)
```
GET    /api/v1/accounts/me                 # Current user profile
PUT    /api/v1/accounts/me                 # Update display name, profile picture
PUT    /api/v1/accounts/me/password        # Change password (requires current)
DELETE /api/v1/accounts/me                 # Request account deletion (7-day grace)
POST   /api/v1/accounts/me/cancel-deletion # Cancel pending deletion
GET    /api/v1/accounts/me/settings        # Notification preferences, timezone
PUT    /api/v1/accounts/me/settings        # Update settings
```

### 3.3 Students (Authenticated, role=student)
```
GET    /api/v1/students/me/profile         # Student profile with education level, subjects
PUT    /api/v1/students/me/profile         # Update education level, subjects, bio
GET    /api/v1/students/me/dashboard       # Dashboard data (next session, stats, classes, invites)
GET    /api/v1/students/me/classes         # Active + past classes toggle
```

### 3.4 Tutors
```
GET    /api/v1/tutors                      # Public tutor list (search with filters)
GET    /api/v1/tutors/{id}                 # Public tutor profile (price blurred if unauth)
GET    /api/v1/tutors/{id}/authenticated   # Authenticated profile (exact price, contact button)
GET    /api/v1/tutors/{id}/classes         # Public group classes for this tutor
PUT    /api/v1/tutors/me/profile           # Update bio, mode, location, subjects
PUT    /api/v1/tutors/me/working-hours     # Update working hours grid
PUT    /api/v1/tutors/me/pricing           # Update rates + currency
GET    /api/v1/tutors/me/preview           # Profile as others see it
GET    /api/v1/tutors/me/dashboard         # Dashboard data
GET    /api/v1/tutors/me/contacts          # Students/parents who've contacted
GET    /api/v1/tutors/me/classes           # Active + past classes
GET    /api/v1/tutors/me/stats             # Cancellation rate (self-awareness only)
```

### 3.5 Parents (Authenticated, role=parent)
```
GET    /api/v1/parents/me/dashboard        # Children cards, upcoming sessions, pending permissions
POST   /api/v1/parents/me/link-child       # Send link request to child's email
GET    /api/v1/parents/me/children         # List linked children
GET    /api/v1/parents/me/children/{student_id}  # Child detail + tutor permissions
PUT    /api/v1/parents/me/permissions/{id} # Grant/deny/revoke tutor permission
```

### 3.6 Sessions (Authenticated)
```
POST   /api/v1/sessions                    # Create session (tutor only)
GET    /api/v1/sessions/{id}               # Session detail
PUT    /api/v1/sessions/{id}               # Update session (tutor only, with scope: single/all-future)
DELETE /api/v1/sessions/{id}               # Cancel/delete session (tutor only, 48h rule applies)
POST   /api/v1/sessions/{id}/end-series    # End recurring series (tutor only)
```

### 3.7 Invites (Authenticated)
```
GET    /api/v1/invites                     # List pending invites for current student
GET    /api/v1/invites/{id}                # Invite detail with conflict info
POST   /api/v1/invites/{id}/accept         # Accept invite → create enrolment
POST   /api/v1/invites/{id}/decline        # Decline invite with optional note
POST   /api/v1/sessions/{id}/request-join  # Student requests to join group class
```

### 3.8 Enrolments (Authenticated)
```
GET    /api/v1/enrolments                  # List active enrolments
POST   /api/v1/enrolments/{id}/opt-out     # Opt out of class series
```

### 3.9 Attendance (Authenticated)
```
POST   /api/v1/attendance/generate-qr      # Tutor generates QR for a session
POST   /api/v1/attendance/validate-qr      # Student scans QR → validate → record
POST   /api/v1/attendance/jitsi-webhook    # Jitsi webhook → record attendance (server-to-server)
GET    /api/v1/attendance/session/{id}     # Attendance records for a session (tutor)
GET    /api/v1/attendance/class/{id}       # Attendance grid for a class (tutor)
GET    /api/v1/attendance/my/{session_id}  # Student's own attendance for a class
```

### 3.10 Reviews (Authenticated)
```
POST   /api/v1/reviews                     # Create review (student, eligibility checked)
GET    /api/v1/reviews/tutor/{tutor_id}    # List reviews for a tutor (public, paginated)
GET    /api/v1/reviews/mine/{tutor_id}     # Get own review for a tutor
PUT    /api/v1/reviews/{id}                # Update own review
DELETE /api/v1/reviews/{id}                # Delete own review
```

### 3.11 Chat (Authenticated)
```
POST   /api/v1/chat/rooms/dm               # Create or get DM room (creates contact visibility)
GET    /api/v1/chat/rooms                   # List all chat rooms for current user
GET    /api/v1/chat/contacts                # List contacts (tutors see students who contacted)
POST   /api/v1/chat/rooms/broadcast         # Create broadcast room for a class (tutor only)
```

### 3.12 Search (Mixed auth)
```
GET    /api/v1/search/tutors               # Structured filter search (public + auth)
POST   /api/v1/search/tutors/ai            # AI-powered search (authenticated students only)
```

### 3.13 AI Assistant (Authenticated)
```
POST   /api/v1/ai/assistant/message         # Send message to AI assistant, get response
```

### 3.14 Calendar (Authenticated)
```
GET    /api/v1/calendar/events             # Calendar events for date range, role-aware
GET    /api/v1/calendar/available-slots/{tutor_id}  # Available booking slots for a tutor
```

### 3.15 Reference Data (Public)
```
GET    /api/v1/subjects/categories         # Subject category list
GET    /api/v1/subjects                    # Full subject hierarchy (category → subject → levels)
GET    /api/v1/education-levels            # Education level list
GET    /api/v1/locations/countries          # Country list
GET    /api/v1/locations/regions/{country_id}   # Regions for a country
GET    /api/v1/locations/cities/{region_id}     # Cities for a region
```

### 3.16 Files (Authenticated)
```
POST   /api/v1/files/upload                # Upload file to MinIO → return URL
GET    /api/v1/files/{key}                 # Get presigned download URL
```

### 3.17 Notifications (Authenticated)
```
GET    /api/v1/notifications               # List notifications (paginated, newest first)
PUT    /api/v1/notifications/mark-all-read # Mark all as read
PUT    /api/v1/notifications/{id}/read     # Mark single as read
```

### 3.18 Admin Endpoints (Admin auth only, /api/admin/ prefix)
```
POST   /api/admin/auth/login               # Admin login (separate token scope)
POST   /api/admin/auth/logout              # Admin logout
GET    /api/admin/dashboard                # Stats: account counts, trends, pending actions
GET    /api/admin/accounts                 # Paginated account list with filters
GET    /api/admin/accounts/{id}            # Account detail (no gov ID shown)
POST   /api/admin/accounts/{id}/restrict   # Restrict account (reason required)
POST   /api/admin/accounts/{id}/unrestrict # Remove restriction
DELETE /api/admin/accounts/{id}            # Admin-initiated deletion (reason required)
GET    /api/admin/reviews                  # Review list with filters
GET    /api/admin/reviews/{id}             # Review detail
DELETE /api/admin/reviews/{id}             # Soft-delete review (reason required)
GET    /api/admin/audit-log                # Immutable audit log with filters
GET    /api/admin/audit-log/export         # CSV export
POST   /api/admin/subjects/categories      # Create subject category
POST   /api/admin/subjects                 # Create subject
PUT    /api/admin/subjects/{id}            # Update subject
DELETE /api/admin/subjects/{id}            # Delete subject
GET    /api/admin/team                     # List admin accounts
POST   /api/admin/team/create              # Create new admin account
GET    /api/admin/profile                  # Own admin profile
PUT    /api/admin/profile                  # Update own profile
PUT    /api/admin/profile/password         # Change own password
```

---

## 4. Docker Compose Configuration

### Services (13 containers):

| Service | Image | Ports | RAM Estimate |
|---------|-------|-------|-------------|
| postgres | postgres:16 | 5432 | ~1 GB |
| redis | redis:7-alpine | 6379 | ~256 MB |
| synapse | matrixdotorg/synapse | 8008, 8448 | ~1.5 GB |
| jitsi-web | jitsi/web | 8443 | ~200 MB |
| jitsi-prosody | jitsi/prosody | (internal) | ~200 MB |
| jitsi-jicofo | jitsi/jicofo | (internal) | ~300 MB |
| jitsi-jvb | jitsi/jvb | 10000/udp | ~500 MB |
| ollama | ollama/ollama | 11434 | ~8 GB (Gemma 4 E4B) |
| minio | minio/minio | 9000, 9001 | ~500 MB |
| mailpit | axllent/mailpit | 1025, 8025 | ~50 MB |
| sygnal | matrixdotorg/sygnal | 5000 | ~100 MB |
| backend | custom (Dockerfile) | 8000 | ~1 GB (includes DistilBERT) |
| nginx | nginx:alpine | 443, 80 | ~50 MB |

**Total estimated RAM: ~13.5 GB** (leaves ~18 GB for OS + dev tools + frontends)

### docker-compose.yml structure:
```yaml
# Key configuration notes:
# - PostgreSQL runs TWO databases: rihla (app) + synapse
# - Synapse registration disabled (backend creates users via Admin API)
# - Jitsi JWT auth enabled (ENABLE_AUTH=1, AUTH_TYPE=jwt)
# - Ollama GPU passthrough (deploy.resources.reservations.devices)
# - MinIO creates buckets on startup via init script
# - Sygnal configured for FCM push gateway
# - nginx reverse proxy for unified HTTPS endpoint
# - All services on shared Docker network
# - Persistent volumes for: postgres data, synapse data, minio data, ollama models, redis data
```

---

## 5. Phased Build Order

### Phase 1: Infrastructure + Backend (1 agent, sequential)

**Step 1.1 — Project Scaffolding (Day 1)**
- Initialize monorepo structure
- Create all directories
- Generate .gitignore, .env.example
- Write docker-compose.yml and docker-compose.dev.yml
- Configure mkcert for local HTTPS
- Write all Dockerfiles
- Verify all containers start successfully

**Step 1.2 — Database Foundation (Day 2)**
- Set up Python virtualenv, install dependencies
- Configure SQLAlchemy async engine + session factory
- Write all SQLAlchemy models (base mixin, then every table)
- Configure Alembic, generate initial migration
- Run migration, verify schema in DBeaver
- Write import_locations.py script → import GeoNames data
- Write import_subjects.py script → import subject hierarchy
- Create create_admin.py CLI script

**Step 1.3 — Core Backend: Auth + Security (Day 3-4)**
- Implement config.py (Pydantic Settings)
- Implement core/security.py (JWT, Argon2, Fernet, HMAC, CSRF)
- Implement core/auth.py (middleware, role guards)
- Implement core/rate_limiter.py (Redis-based)
- Implement core/exceptions.py (custom exceptions + handlers)
- Implement utils/id_validation.py (python-stdnum + Sri Lanka NIC)
- Implement utils/phone_validation.py
- Implement utils/password_strength.py
- Implement auth_service.py (register, login, token lifecycle, email verification, password reset)
- Implement auth API routes
- Write unit tests for all security functions
- Write integration tests for auth flows

**Step 1.4 — Account & Profile Services (Day 5-6)**
- Implement account_service.py (CRUD, settings, deletion lifecycle)
- Implement tutor_service.py (profile, working hours, pricing, completeness)
- Implement student_service.py (profile, subjects)
- Implement parent_service.py (linking, permissions)
- Implement admin_service.py (restrict, audit logging)
- Implement all corresponding API routes
- Write tests

**Step 1.5 — Session & Booking System (Day 7-9)**
- Implement session_service.py (CRUD, conflict detection, 48h rule, recurring)
- Implement invite_service.py (creation, conflict snapshot, accept/decline, group join request)
- Implement enrolment_service.py (enrolment, opt-out, calendar population)
- Implement calendar_service.py (event aggregation per role)
- Implement background tasks (session pre-generation, age restriction check, deletion processing)
- Implement all corresponding API routes
- Write tests

**Step 1.6 — Attendance + Video (Day 10)**
- Implement attendance_service.py (QR generation/validation, Jitsi webhook)
- Implement jitsi_client.py (JWT generation, room names)
- Implement utils/qr_generator.py
- Implement attendance API routes
- Write tests

**Step 1.7 — Chat Integration (Day 11-12)**
- Configure Synapse via homeserver.yaml
- Implement matrix_client.py (Admin API: create users, rooms, manage membership)
- Implement chat_service.py (DM rooms, broadcast rooms, contact visibility)
- Implement chat API routes
- Configure Sygnal for push notifications
- Write tests

**Step 1.8 — Review System (Day 13)**
- Implement review_service.py (CRUD, eligibility, anonymity, soft delete, orphaning)
- Implement review API routes
- Write tests

**Step 1.9 — Search + AI (Day 14-15)**
- Implement ollama_client.py (HTTP client for Gemma 4)
- Implement ml/nlp_extractor.py (structured JSON extraction from NL queries)
- Implement ml/sentiment.py (DistilBERT loading, review processing)
- Implement ml/reliability.py (vector computation)
- Implement ml/ranking.py (scikit-learn model loading + scoring + confidence weighting)
- Implement search_service.py (structured search + AI search orchestration)
- Implement AI assistant endpoint
- Write seed_data.py and train_model.py scripts
- Run seed data + train model
- Write tests

**Step 1.10 — Notifications + Files (Day 16)**
- Implement notification_service.py (create, FCM push, in-app)
- Implement firebase_client.py
- Implement email_service.py (Mailpit SMTP)
- Implement file_service.py (MinIO upload/download)
- Implement minio_client.py
- Implement API routes
- Write tests

**Step 1.11 — Backend Polish (Day 17-18)**
- Rate limiting on all endpoints
- CORS configuration
- Request/response logging
- Error handling edge cases
- Swagger documentation review
- Run full test suite, fix failures
- Git push to backend branch

### Phase 2: Frontends (3 agents, parallel branches)

All three agents start from the completed backend branch. Each works on its own branch.

**Phase 2A — Web Frontend Agent (Day 19-28)**
- Step 2A.1: Project setup (Vite, TypeScript, dependencies, design system CSS vars)
- Step 2A.2: Axios instance, auth store, protected routes, CSRF
- Step 2A.3: Layout components (AppShell, Sidebar, Header, PublicLayout)
- Step 2A.4: Common components (Button, Input, Modal, Avatar, Badge, etc.)
- Step 2A.5: Auth pages (Login, Register multi-step, Password Recovery, Email Verify)
- Step 2A.6: Public pages (Landing, Tutor Search public, Tutor Profile public)
- Step 2A.7: Student pages (Dashboard, Search + AI, Profile, Class Invite, Class Detail, Review Form)
- Step 2A.8: Tutor pages (Dashboard, Edit Profile, Create Class, Class Space)
- Step 2A.9: Parent pages (Dashboard, Child Overview, Link Child)
- Step 2A.10: Shared pages (Calendar, Chat List + Conversation, AI Assistant, Video Call, Settings)
- Step 2A.11: Animations (Framer Motion page transitions, list animations, micro-interactions)
- Step 2A.12: Matrix SDK integration (chat), Jitsi IFrame integration (video)
- Step 2A.13: Polish, responsive, test

**Phase 2B — Mobile Frontend Agent (Day 19-30)**
- Step 2B.1: Expo Dev Client setup, dependencies, polyfills (index.js with URL polyfill)
- Step 2B.2: Navigation structure (Root, Auth, Student/Tutor/Parent tab navigators)
- Step 2B.3: Theme setup (colors, typography, spacing, animation presets)
- Step 2B.4: Axios instance with SecureStore tokens, auth store
- Step 2B.5: Common components (mobile versions, BottomSheet instead of Modal)
- Step 2B.6: Auth screens
- Step 2B.7: Student screens + QR Scanner (expo-camera)
- Step 2B.8: Tutor screens + QR Display
- Step 2B.9: Parent screens
- Step 2B.10: Shared screens (Calendar, Chat, AI Assistant, Video Call, Settings)
- Step 2B.11: Animations (Reanimated, Moti, shared element transitions, gesture handlers)
- Step 2B.12: Matrix SDK integration (legacy Olm), Jitsi SDK integration
- Step 2B.13: Push notifications (expo-notifications + FCM)
- Step 2B.14: Build dev client, test on device

**Phase 2C — Admin Frontend Agent (Day 19-25)**
- Step 2C.1: Project setup (Vite, TypeScript, admin-specific design: red accent)
- Step 2C.2: Auth (admin login, separate token scope)
- Step 2C.3: Layout (AdminShell, AdminSidebar red accent, AdminHeader)
- Step 2C.4: DataTable component (sortable, filterable, paginated)
- Step 2C.5: Dashboard page (stats, charts, recent actions)
- Step 2C.6: Account Management (list + detail + restrict/delete flows)
- Step 2C.7: Review Management (list + detail + soft delete)
- Step 2C.8: Audit Log (immutable, filterable, CSV export)
- Step 2C.9: Subject Management (CRUD categories + subjects)
- Step 2C.10: Admin Team (list + create)
- Step 2C.11: Admin Profile + Change Password
- Step 2C.12: Polish, test

### Phase 3: Integration + QA (1 agent, sequential)

**Step 3.1:** Merge all frontend branches into main
**Step 3.2:** End-to-end testing (student journey, tutor journey, parent journey)
**Step 3.3:** Cross-platform consistency check (web ↔ mobile feature parity)
**Step 3.4:** Performance profiling (API response times, frontend bundle sizes)
**Step 3.5:** Security audit (rate limiting verification, auth edge cases, CSRF)
**Step 3.6:** Bug fixes from all testing
**Step 3.7:** Final README and documentation
**Step 3.8:** Git push to main

---

## 6. Integration Specifications

### 6.1 Matrix/Synapse Setup
- Synapse homeserver.yaml: registration disabled, enable admin API, configure PostgreSQL connection
- Backend creates Matrix users when app accounts are created (via Admin API)
- Matrix user IDs: @{account_id}:localhost
- DM room creation: backend creates room, adds both users, sets power levels
- Broadcast room: tutor has power level 50 (can send), students have power level 0 (read-only)
- Media storage: Synapse default (filesystem at /data/synapse/media_store)

### 6.2 Jitsi Setup
- JWT authentication enabled (AUTH_TYPE=jwt)
- JWT secret shared between backend and Jitsi Prosody
- Room names: rihla-{session_id_short}-{random_suffix}
- JWT claims: room (room name), sub (user display name), iss (rihla), aud (jitsi)
- Webhook: Jitsi sends participant-joined events to backend webhook endpoint

### 6.3 Ollama + Gemma 4 E4B
- Model pulled on first startup: ollama pull gemma4:e4b
- NLP extraction prompt: forces JSON output with fields: subject, topic, gender_preference, mode, availability, budget, qualitative_notes
- AI assistant system prompts: student (Socratic, no direct answers) vs tutor (general helper)
- Temperature: 0.1 for NLP extraction (deterministic), 0.7 for assistant (conversational)

### 6.4 MinIO
- Buckets: profile-pictures, class-materials, qr-codes
- Object naming: {bucket}/{entity_id}/{timestamp}_{filename}
- Presigned URLs: 1-hour expiry for downloads
- Max upload: 50MB per file
- Allowed MIME types: images (jpeg, png, gif, webp), documents (pdf, doc, docx, ppt, pptx, xls, xlsx), video (mp4, mov, webm)

### 6.5 Firebase Cloud Messaging
- Server-side: google-auth + HTTP v1 API for sending push notifications
- Mobile: expo-notifications handles token registration
- Notification payload: { title, body, data: { type, entity_id, entity_type } }

---

## 7. Edge Cases & Business Rules

### 7.1 Under-15 + Group Class Join Flow
1. Under-15 student (no parent permission for this tutor) clicks "Request to Join"
2. System creates join request (status: pending_tutor)
3. System sends parent permission request automatically
4. Tutor can accept join request immediately (no chat needed for groups)
5. If tutor accepts → student enrolled, added to broadcast room
6. Parent permission resolves independently: granted → student can DM tutor; denied → parent is intermediary
7. If tutor declines → parent permission request auto-cancelled

### 7.2 Account Deletion Cascade
1. User requests deletion → deletion_requested_at set, deletion_scheduled_for = +7 days
2. Account NOT deactivated during grace period (user can still use the app and cancel)
3. Daily job checks deletion_scheduled_for < NOW()
4. On processing: is_active = FALSE, review authorships CASCADE deleted (reviews become orphaned), refresh tokens revoked, Matrix account deactivated (messages persist for other party), enrolments marked opted_out, future sessions cancelled (with notifications to affected users)

### 7.3 Profile Completeness Gate
Tutor appears in search ONLY when is_profile_complete = TRUE. Requires:
- At least 1 subject + education level pair in tutor_subjects
- mode_of_tuition is set
- individual_rate OR group_rate is set (at least one)
Computed on every profile update. Dashboard shows completion steps with progress.

### 7.4 Confidence-Weighted ML Scoring
```
effective_sentiment = sentiment_score * min(1.0, review_count / 10)
effective_reliability = reliability_score * min(1.0, total_sessions / 20)
```
Below threshold: signal dampened toward neutral 0.5. Above: full weight.

### 7.5 Session 48-Hour Rule
Computed at READ TIME, not stored. Query: "Is session.start_time - NOW() < 48 hours?" If yes AND session has accepted students, cancellation/reschedule increments counters for reliability computation. Booking meetings exempt.

### 7.6 Email Verification Gating
Unverified accounts can: log in, browse, view profiles, update own profile. Cannot: initiate chat, book sessions, create classes, leave reviews, appear in search (tutors). Banner shown on every page until verified.

### 7.7 Working Hours Warning (Not Block)
When tutor creates session outside stated working hours: API returns warning in response body. Frontend shows modal: "This class is outside your working hours. Students searching for this time slot won't find you. Proceed anyway?" Tutor confirms or cancels. No database enforcement.

### 7.8 Restricted Account Capabilities
- Restricted tutor: hidden from search (is_profile_complete overridden to FALSE in queries), cannot create new classes, existing classes continue, can still chat
- Restricted student: cannot book new sessions, can attend existing, cannot leave new reviews, can still chat
- Restricted parent: cannot grant new permissions, existing unchanged
- UI banner: "Your account has been restricted. Contact support for more information."
