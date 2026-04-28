# Rihla — Detailed Feature & Code Location Guide

> This document maps every feature of the Rihla tutoring platform to the exact files where it is implemented across the backend, web frontend, mobile app, and admin panel.

---

## Table of Contents

1. [Authentication & Account System](#1-authentication--account-system)
2. [User Profiles (Student, Tutor, Parent)](#2-user-profiles)
3. [Tutor Search — Structured & AI-Powered](#3-tutor-search)
4. [Session & Class Management](#4-session--class-management)
5. [Invitations & Enrolments](#5-invitations--enrolments)
6. [Attendance Tracking (QR + Jitsi)](#6-attendance-tracking)
7. [Review & Rating System](#7-review--rating-system)
8. [Chat System (Matrix E2EE)](#8-chat-system)
9. [Video Calling (Jitsi Meet)](#9-video-calling)
10. [AI Study Assistant](#10-ai-study-assistant)
11. [AI/ML: Sentiment Analysis (DistilBERT)](#11-sentiment-analysis)
12. [AI/ML: Reliability Scoring](#12-reliability-scoring)
13. [AI/ML: Tutor Ranking Model (scikit-learn)](#13-tutor-ranking-model)
14. [AI/ML: NLP Search Parameter Extraction (Gemma 4)](#14-nlp-search-parameter-extraction)
15. [Calendar](#15-calendar)
16. [Notifications (In-App, Push, Email)](#16-notifications)
17. [Parent–Child System](#17-parentchild-system)
18. [File Storage (MinIO)](#18-file-storage)
19. [Admin Panel](#19-admin-panel)
20. [Background Jobs (APScheduler)](#20-background-jobs)
21. [Security & Infrastructure](#21-security--infrastructure)

---

## 1. Authentication & Account System

Handles registration, login, email verification, password reset, email recovery via government ID, JWT tokens, and account deletion with a 7-day grace period.

### Backend
| File | Purpose |
|------|---------|
| `backend/app/api/v1/auth.py` | Auth API routes: `/register`, `/login`, `/logout`, `/refresh`, `/verify-email`, `/resend-verification`, `/forgot-password`, `/reset-password`, `/recover-email` |
| `backend/app/api/v1/accounts.py` | Account routes: `GET/PUT /me`, `PUT /me/password`, `DELETE /me`, `POST /me/cancel-deletion`, `GET/PUT /me/settings` |
| `backend/app/services/auth_service.py` | Core auth logic: registration (gov ID encryption, Argon2 hashing, profile creation), login (credential check, token issuance), password reset, email recovery |
| `backend/app/services/account_service.py` | Account updates, password changes, deletion scheduling/cancellation, processing pending deletions |
| `backend/app/services/email_service.py` | Sends verification emails, password reset emails via SMTP (Mailpit in dev) |
| `backend/app/core/security.py` | Password hashing (Argon2), JWT creation/decoding (HS256), Fernet encryption/decryption for gov IDs, HMAC computation, token generation |
| `backend/app/core/auth.py` | `get_current_user()` dependency — extracts JWT from header/cookie, `require_role()` for role gating |
| `backend/app/core/rate_limiter.py` | Redis-based rate limiting: 5 attempts/min on login/register |
| `backend/app/models/account.py` | `Account` model — email, password_hash, government_id_encrypted, government_id_hmac, account_type, is_active, is_restricted, is_email_verified, is_age_restricted, deletion timestamps |
| `backend/app/models/token.py` | `RefreshToken`, `PasswordResetToken`, `EmailVerificationToken` models |
| `backend/app/schemas/auth.py` | Pydantic schemas: `LoginRequest`, `RegisterRequest`, `TokenResponse`, `ForgotPasswordRequest`, `ResetPasswordRequest`, `RecoverEmailRequest` |

### Web Frontend
| File | Purpose |
|------|---------|
| `web/src/pages/Login.tsx` | Login page with account type selector + email/password form |
| `web/src/pages/Register.tsx` | Registration form with government ID, personal details |
| `web/src/pages/PasswordRecovery.tsx` | Password reset request (email-based) |
| `web/src/pages/VerifyEmail.tsx` | Email verification token handler |
| `web/src/pages/shared/Settings.tsx` | Password change, notification prefs, account deletion |
| `web/src/services/authService.ts` | API calls: login, register, logout, refresh, verifyEmail, forgotPassword, resetPassword, recoverEmail, getMe, updateMe, changePassword, deleteAccount, cancelDeletion |
| `web/src/stores/authStore.ts` | Zustand store: account state, accessToken, isAuthenticated, setAuth/logout actions (persisted to localStorage) |
| `web/src/hooks/useAuth.ts` | Custom hook: login/register/logout flows with navigation, initAuth on app mount |
| `web/src/lib/axios.ts` | Axios interceptors: Bearer token injection, 401 → silent token refresh → retry |
| `web/src/components/auth/LoginForm.tsx` | Reusable login form component |
| `web/src/components/auth/RegisterForm.tsx` | Multi-step registration form |
| `web/src/components/auth/AccountTypeSelector.tsx` | Student/Tutor/Parent role selector |
| `web/src/components/common/ProtectedRoute.tsx` | Route guard: auth check + role validation |

### Mobile
| File | Purpose |
|------|---------|
| `mobile/src/screens/auth/LoginScreen.tsx` | Login with account type selector |
| `mobile/src/screens/auth/RegisterScreen.tsx` | 4-step registration (type → identity → credentials → contact) |
| `mobile/src/screens/auth/VerifyEmailScreen.tsx` | Email verification confirmation |
| `mobile/src/screens/auth/PasswordRecoveryScreen.tsx` | Password reset request |
| `mobile/src/services/authService.ts` | API calls: register, login, logout, refresh, verify-email, forgot-password, reset-password, recover-email |
| `mobile/src/stores/authStore.ts` | Zustand: isAuthenticated, accountId, accountType, firstName, lastName, profilePictureUrl, isEmailVerified, isAgeRestricted |
| `mobile/src/navigation/RootNavigator.tsx` | Auth-state routing: Auth stack → Student/Tutor/Parent tab navigators |

### Admin
| File | Purpose |
|------|---------|
| `admin/src/pages/Login.tsx` | Admin login (separate auth flow) |
| `admin/src/services/adminAuthService.ts` | Admin login/logout/refresh API calls |

---

## 2. User Profiles

Three distinct role profiles with different data models: Student (education level, subjects), Tutor (subjects, pricing, working hours, location, mode), Parent (linked children, permissions).

### Backend
| File | Purpose |
|------|---------|
| `backend/app/models/student.py` | `StudentProfile` (education_level_id, bio), `StudentSubject` (student+subject+level many-to-many) |
| `backend/app/models/tutor.py` | `TutorProfile` (bio, mode_of_tuition, location FKs, rates, currency, is_profile_complete, timezone), `TutorSubject`, `TutorWorkingHours`, `TutorContact` |
| `backend/app/models/parent.py` | `ParentProfile`, `ParentStudentLink`, `ParentInviteToken`, `ParentTutorPermission` |
| `backend/app/services/student_service.py` | `get_student_profile()`, `update_student_profile()`, `get_student_dashboard()` |
| `backend/app/services/tutor_service.py` | `get_tutor_profile()`, `update_tutor_profile()`, `update_pricing()`, `update_working_hours()`, `update_tutor_subjects()`, `get_tutor_dashboard()`, `get_tutor_stats()` |
| `backend/app/services/parent_service.py` | `get_children()`, `get_child_detail()`, `link_child()`, `get_pending_permissions()`, `update_permission()` |
| `backend/app/api/v1/students.py` | Student profile & dashboard routes |
| `backend/app/api/v1/tutors.py` | Tutor profile, pricing, working hours, public/authenticated views, dashboard routes |
| `backend/app/api/v1/parents.py` | Parent dashboard, link child, children list, permissions routes |

### Web Frontend
| File | Purpose |
|------|---------|
| `web/src/pages/student/Profile.tsx` | Student profile management (education level, bio, subjects, own reviews) |
| `web/src/pages/student/Dashboard.tsx` | Student dashboard (upcoming sessions, active classes, pending invites) |
| `web/src/pages/tutor/EditProfile.tsx` | Edit bio, location (country/region/city), mode, timezone, pricing, subjects |
| `web/src/pages/tutor/ProfilePreview.tsx` | Preview public-facing tutor profile |
| `web/src/pages/tutor/Dashboard.tsx` | Tutor dashboard (stats, upcoming sessions, profile completeness) |
| `web/src/pages/parent/Dashboard.tsx` | Parent dashboard (children overview, pending permissions) |
| `web/src/pages/parent/Profile.tsx` | Parent account settings |
| `web/src/services/studentService.ts` | getProfile, updateProfile, getDashboard, getClasses |
| `web/src/services/tutorService.ts` | list, getPublic, getAuthenticated, updateProfile, updateWorkingHours, updatePricing, getPreview, getDashboard, getClasses, getStats, getContacts |
| `web/src/services/parentService.ts` | getDashboard, linkChild, getChildren, getChild, updatePermission |

### Mobile
| File | Purpose |
|------|---------|
| `mobile/src/screens/student/DashboardScreen.tsx` | Student overview: next session, active classes, pending invites |
| `mobile/src/screens/student/ProfileScreen.tsx` | Student profile and settings |
| `mobile/src/screens/tutor/DashboardScreen.tsx` | Tutor stats: today's sessions, active classes, total students |
| `mobile/src/screens/tutor/EditProfileScreen.tsx` | Profile editing and subject management |
| `mobile/src/screens/tutor/ProfilePreviewScreen.tsx` | Public profile preview |
| `mobile/src/screens/parent/DashboardScreen.tsx` | Children overview, pending permissions |
| `mobile/src/services/studentService.ts` | getProfile, updateProfile, getDashboard, getClasses |
| `mobile/src/services/tutorService.ts` | Full tutor CRUD service (20+ methods) |
| `mobile/src/services/parentService.ts` | getDashboard, linkChild, getChildren, getChildDetail, updatePermission |

---

## 3. Tutor Search

Two search modes: structured filter search (subject, level, mode, location, price, gender) and AI-powered natural language search that uses Gemma 4 via Ollama to extract query parameters. Results are ranked by the ML ranking model.

### Backend
| File | Purpose |
|------|---------|
| `backend/app/api/v1/search.py` | `GET /search/tutors` (structured), `POST /search/tutors/ai` (AI-powered, students only) |
| `backend/app/services/search_service.py` | `structured_search()` — filter by subject, level, mode, location, rate, gender; load reviews, subjects, sentiment. `extract_filters_from_query()` — send NL query to Ollama, extract JSON params. `describe_extracted_filters()` — describe filters in human language |
| `backend/app/integrations/ollama_client.py` | `extract_search_params(query)` — calls Ollama `/api/generate` with Gemma 4, temp=0.1 |
| `backend/app/ml/nlp_extractor.py` | Wrapper for Ollama parameter extraction |
| `backend/app/ml/ranking.py` | `score_tutor(features)` — ML ranking model scoring, `confidence_weight()` — dampening for low-data tutors |

### Web Frontend
| File | Purpose |
|------|---------|
| `web/src/pages/student/TutorSearch.tsx` | AI-powered search with filters + natural language AI search bar (Sparkles icon). Shows AI interpretation of query |
| `web/src/pages/TutorSearchPublic.tsx` | Public tutor browse (no AI search, no auth required) |
| `web/src/pages/student/TutorProfile.tsx` | Individual tutor profile with reviews, availability, pricing |
| `web/src/pages/TutorProfilePublic.tsx` | Public tutor profile (prices blurred if unauthenticated) |
| `web/src/services/searchService.ts` | `searchTutors(filters)` → `GET /search/tutors`, `aiSearch(query)` → `POST /search/tutors/ai` |
| `web/src/components/search/FilterPanel.tsx` | Filter UI: subject, level, mode, gender, price range, location |
| `web/src/components/search/TutorCard.tsx` | Tutor listing card: avatar, rating, subjects, pricing, sentiment summary |

### Mobile
| File | Purpose |
|------|---------|
| `mobile/src/screens/student/TutorSearchScreen.tsx` | Search with filters (mode, gender, price, subject, level) + AI search |
| `mobile/src/screens/student/TutorProfileScreen.tsx` | Tutor profile with ratings, availability, pricing |
| `mobile/src/services/searchService.ts` | searchTutors (filter-based), aiSearch (AI-powered) |
| `mobile/src/components/search/AISearchBar.tsx` | Text search + AI search bar component |
| `mobile/src/components/search/TutorCard.tsx` | Tutor search result card |

---

## 4. Session & Class Management

Three session types (booking meeting, individual class, group class) with three modes (online, physical, hybrid). Supports recurrence (weekly/biweekly/monthly), conflict detection, the 48-hour cancellation rule, and working hours warnings.

### Backend
| File | Purpose |
|------|---------|
| `backend/app/api/v1/sessions.py` | `POST /` create, `GET/PUT/DELETE /{id}`, `GET /{id}/jitsi-token`, `POST /{id}/request-join`, `POST /{id}/cancel-booking`, `POST /book-meeting` |
| `backend/app/services/session_service.py` | `create_session()` with conflict check, `update_session()`, `cancel_session()`, `_check_conflicts()` |
| `backend/app/models/session.py` | `Session` (type, mode, status, location, duration, recurrence, jitsi_room_name, rate overrides), `RecurrenceRule` (frequency, days_of_week, start/end_date), `OccurrenceException` (per-occurrence edits/cancellations) |
| `backend/app/schemas/session.py` | `SessionCreateRequest`, `SessionUpdateRequest`, `SessionResponse`, `BookMeetingRequest`, `RecurrenceRequest` |

### Web Frontend
| File | Purpose |
|------|---------|
| `web/src/pages/tutor/CreateClass.tsx` | Create session form (type, mode, duration, location, group size) |
| `web/src/pages/tutor/ClassSpace.tsx` | Manage individual class (attendance, students, details) |
| `web/src/pages/student/ClassDetail.tsx` | View class details, enrolment options |
| `web/src/pages/shared/MySessions.tsx` | All sessions (student + tutor), filterable by upcoming/past, quick video join |
| `web/src/services/sessionService.ts` | create, get, update, delete, endSeries, requestJoin, getJitsiToken, cancelBooking, bookMeeting |

### Mobile
| File | Purpose |
|------|---------|
| `mobile/src/screens/tutor/CreateClassScreen.tsx` | Create new sessions |
| `mobile/src/screens/tutor/ClassSpaceScreen.tsx` | Class management with details and attendance tabs |
| `mobile/src/screens/student/ClassDetailScreen.tsx` | Session details, enrollment, video call join |
| `mobile/src/services/sessionService.ts` | create, getById, update, delete, endSeries |

---

## 5. Invitations & Enrolments

Tutors invite students to sessions. Students can accept or decline (with optional note). Acceptance creates an enrolment and adds the student to any broadcast chat room. Students can opt out of enrolments at any time. Conflict snapshots are captured at invite time.

### Backend
| File | Purpose |
|------|---------|
| `backend/app/api/v1/invites.py` | `GET /` list, `GET /{id}` detail, `POST /{id}/accept`, `POST /{id}/decline` |
| `backend/app/api/v1/enrolments.py` | `GET /` list enrolments, `POST /{id}/opt-out` |
| `backend/app/services/invite_service.py` | `get_student_invites()`, `accept_invite()`, `decline_invite()` |
| `backend/app/services/enrolment_service.py` | `get_student_enrolments()`, `opt_out()` |
| `backend/app/models/invite.py` | `SessionInvite` (session_id, student_id, status, conflict_details JSONB, declined_note) |
| `backend/app/models/enrolment.py` | `Enrolment` (session_id, student_id, status active/opted_out, enrolled_at, opted_out_at) |

### Web Frontend
| File | Purpose |
|------|---------|
| `web/src/pages/student/ClassInvite.tsx` | Manage pending invitations (accept/decline) |
| `web/src/services/inviteService.ts` | list, get, accept, decline |
| `web/src/services/enrolmentService.ts` | list, optOut |

### Mobile
| File | Purpose |
|------|---------|
| `mobile/src/screens/student/ClassInviteScreen.tsx` | Accept/decline class invitations |
| `mobile/src/services/inviteService.ts` | getAll, getById, accept, decline, requestJoin |
| `mobile/src/services/enrolmentService.ts` | getAll, optOut |

---

## 6. Attendance Tracking

Dual-method attendance: QR code scanning (primary, mobile) and Jitsi webhook (fallback, automatic). Tutors generate a time-limited QR token (JWT), students scan it to mark attendance. Only one record per student per session.

### Backend
| File | Purpose |
|------|---------|
| `backend/app/api/v1/attendance.py` | `POST /generate-qr` (tutor), `POST /validate-qr` (student scan), `POST /jitsi-webhook` (automatic), `GET /session/{id}` (records) |
| `backend/app/services/attendance_service.py` | `generate_qr()` — creates signed JWT + QR PNG, `validate_qr()` — verifies token + marks attendance, `record_jitsi_attendance()`, `get_session_attendance()` |
| `backend/app/models/attendance.py` | `QRToken` (session_id, token_hash, valid_from, valid_until), `AttendanceRecord` (session_id, student_id, method qr_scan/jitsi_webhook, recorded_at — unique per session+student) |

### Web Frontend
| File | Purpose |
|------|---------|
| `web/src/services/attendanceService.ts` | generateQR, validateQR, getSessionAttendance |

### Mobile
| File | Purpose |
|------|---------|
| `mobile/src/screens/student/QRScannerScreen.tsx` | Camera-based QR code scanning |
| `mobile/src/screens/tutor/QRDisplayScreen.tsx` | Display generated QR code for students |
| `mobile/src/components/qr/QRDisplay.tsx` | QR code display component |
| `mobile/src/components/qr/QRScanner.tsx` | Camera QR scanner component |
| `mobile/src/services/attendanceService.ts` | generateQR, validateQR, getForSession, getForClass, getMyAttendance |

---

## 7. Review & Rating System

Students can review tutors they've attended sessions with (one review per tutor). Reviews include a 1–5 star rating and text comment. Admins can soft-delete reviews with a reason. DistilBERT sentiment analysis runs on review text to generate tutor sentiment summaries.

### Backend
| File | Purpose |
|------|---------|
| `backend/app/api/v1/reviews.py` | `POST /` create (requires attendance), `GET /me` own reviews, `GET /tutor/{id}` tutor's reviews (paginated), `GET /me/{tutor_id}` specific review, `PUT/DELETE /{id}` update/delete |
| `backend/app/services/review_service.py` | `create_review()` with attendance validation, `get_tutor_reviews()` (cursor-paginated), `get_student_reviews()`, `update_review()`, `delete_review()`, `admin_delete_review()` |
| `backend/app/models/review.py` | `Review` (tutor_id, rating 1-5, text, is_deleted, admin_deletion_reason), `ReviewAuthorship` (student_id+tutor_id unique — enforces one per pair), `ReviewDurationSignal` (sessions_attended, approximate_duration_weeks) |
| `backend/app/schemas/review.py` | `ReviewCreateRequest`, `ReviewUpdateRequest`, `ReviewResponse` |
| `backend/app/ml/sentiment.py` | DistilBERT sentiment analysis runs on review text (see section 11) |

### Web Frontend
| File | Purpose |
|------|---------|
| `web/src/pages/student/TutorProfile.tsx` | View tutor reviews, submit own review |
| `web/src/services/reviewService.ts` | create, listForTutor (paginated), getMine, getMyReviews, update, delete |
| `web/src/components/common/StarRating.tsx` | Interactive/display star rating component |

### Mobile
| File | Purpose |
|------|---------|
| `mobile/src/components/student/ReviewForm.tsx` | Review submission form |
| `mobile/src/services/reviewService.ts` | create, getForTutor, getMine, update, delete |
| `mobile/src/components/common/StarRating.tsx` | Interactive/readonly star rating |

### Admin
| File | Purpose |
|------|---------|
| `admin/src/pages/ReviewList.tsx` | All reviews with filters, delete functionality |
| `admin/src/pages/ReviewDetail.tsx` | Single review with deletion action |
| `admin/src/services/reviewService.ts` | getReviews (filtered), getReview, deleteReview (soft delete with reason) |

---

## 8. Chat System

Real-time encrypted messaging built on Matrix/Synapse. Two room types: DM (1-on-1 between tutor and student) and Broadcast (tutor to entire class, read-only for students). Web uses Rust crypto, mobile uses legacy Olm crypto.

### Backend
| File | Purpose |
|------|---------|
| `backend/app/api/v1/chat.py` | `POST /rooms/dm` create/get DM, `POST /rooms/broadcast` create broadcast, `GET /contacts` list contacts, `GET /rooms` list rooms, `GET /rooms/{id}/messages` message history, `POST /rooms/{id}/messages` send message |
| `backend/app/services/chat_service.py` | `get_or_create_dm_room()`, `create_broadcast_room()`, `get_user_rooms()`, `get_room_messages()`, `send_message()`, `get_last_message_for_rooms()` |
| `backend/app/integrations/matrix_client.py` | `create_matrix_user()` via Synapse admin API, `create_matrix_room()` with invites and power levels |
| `backend/app/models/chat.py` | `ChatRoomMapping` (matrix_room_id, room_type dm/broadcast, account IDs, session_id), `ChatMessage` (room_id, sender_id, body, message_type), `JitsiRoom` (session_id, room_name) |

### Web Frontend
| File | Purpose |
|------|---------|
| `web/src/pages/shared/ChatList.tsx` | Two tabs: Conversations (DM + broadcast list) + AI Assistant |
| `web/src/pages/shared/ChatConversation.tsx` | DM/broadcast chat with session booking modal, working hours validation, Jitsi video call integration |
| `web/src/pages/shared/ChatConversation.module.css` | Chat conversation styles |
| `web/src/services/chatService.ts` | createDM, listRooms, getContacts, createBroadcast, getMessages, sendMessage, sendAIMessage |

### Mobile
| File | Purpose |
|------|---------|
| `mobile/src/screens/shared/ChatListScreen.tsx` | Chat rooms and AI assistant entry |
| `mobile/src/screens/shared/ChatConversationScreen.tsx` | Message interface with send/receive |
| `mobile/src/lib/matrix.ts` | Matrix client initialization (homeserver: `10.11.17.209:8448` in dev), real-time message listening, text message sending, room event timeline |
| `mobile/src/services/chatService.ts` | createDMRoom, getRooms, getContacts, createBroadcastRoom |

### Infrastructure
| File | Purpose |
|------|---------|
| `docker-compose.yml` | Synapse container config |
| `docker/synapse/homeserver.yaml` | Synapse config: server_name, registration disabled, rate limits, media storage |
| `docker/postgres/init-synapse-db.sql` | Creates separate `synapse` database |

---

## 9. Video Calling

Jitsi Meet integration for online sessions. JWT-authenticated rooms. Jitsi sends webhook events to the backend for automatic attendance tracking.

### Backend
| File | Purpose |
|------|---------|
| `backend/app/integrations/jitsi_client.py` | `generate_room_name(session_id)` — `rihla-{id_short}-{random}`, `generate_jitsi_token(room, name, email, is_moderator)` — JWT with iss=rihla, aud=jitsi |
| `backend/app/api/v1/sessions.py` | `GET /{session_id}/jitsi-token` — returns JWT for Jitsi room |
| `backend/app/api/v1/attendance.py` | `POST /jitsi-webhook` — receives participant-joined events from Jitsi |
| `backend/app/core/security.py` | `create_jitsi_jwt()` — builds JWT claims for Jitsi |

### Web Frontend
| File | Purpose |
|------|---------|
| `web/src/pages/shared/VideoCall.tsx` | Jitsi Meet IFrame integration, JWT token support, call management (leave/hangup) |
| `web/src/lib/jitsi.ts` | Jitsi config: domain `localhost:8443`, toolbar buttons, external script loading, no watermark, prejoin disabled |

### Mobile
| File | Purpose |
|------|---------|
| `mobile/src/screens/shared/VideoCallScreen.tsx` | Jitsi Meet deep linking, room name + display name parameters |
| `mobile/src/lib/jitsi.ts` | Jitsi deep link construction, fallback if app not installed |

### Infrastructure
| File | Purpose |
|------|---------|
| `docker-compose.yml` | Jitsi services: prosody, jicofo, jvb (port 10000/udp), web (port 8443) |
| `docker/jitsi/` | Jitsi-specific Docker configs, JWT auth enabled (AUTH_TYPE=jwt, APP_ID=rihla) |

---

## 10. AI Study Assistant

LLM-powered chatbot within the chat interface. Uses Gemma 4 via Ollama. Students get a Socratic tutor that guides learning through questions. Tutors get a helper for lesson planning and teaching strategies. Dynamic system prompts personalized to the user's profile.

### Backend
| File | Purpose |
|------|---------|
| `backend/app/api/v1/ai.py` | `POST /assistant/message` — accepts message + conversation history, routes to Ollama with role-specific system prompt |
| `backend/app/integrations/ollama_client.py` | `generate(prompt, system, temperature)` — async HTTP to Ollama `/api/generate` or `/api/chat`, 120s timeout, streaming support |

**System Prompts:**
- **Student prompt:** Socratic method — guides discovery via questions, encouragement, concise (2-4 sentences). Dynamic: includes education level, subjects, bio from student profile.
- **Tutor prompt:** General helper — answers questions, suggests teaching approaches, lesson planning assistance.
- **Temperature:** 0.7 (conversational)
- **Fallback:** If Ollama is unavailable, returns a graceful error message.

### Web Frontend
| File | Purpose |
|------|---------|
| `web/src/pages/shared/ChatList.tsx` | "AI Assistant" tab — LLM-powered study helper |
| `web/src/services/chatService.ts` | `sendAIMessage(message, history)` → `POST /ai/assistant/message` with `{role, content}` message history |

### Mobile
| File | Purpose |
|------|---------|
| `mobile/src/screens/shared/AIAssistantScreen.tsx` | AI chatbot for study help and tutor discovery |
| `mobile/src/services/aiService.ts` | `sendMessage()` — sends message to AI assistant |

---

## 11. Sentiment Analysis

**Model:** HuggingFace DistilBERT (`distilbert-base-uncased-finetuned-sst-2-english`) loaded in-process. Analyzes review text to produce a 0–1 sentiment score per review. Aggregate scores per tutor generate human-readable summaries. Scores are hidden from all frontends; only the summary text is shown.

### Backend
| File | Purpose |
|------|---------|
| `backend/app/ml/sentiment.py` | `analyze_sentiment(text)` — runs DistilBERT inference, returns 0-1 score. `compute_tutor_sentiment(db, tutor_id)` — averages scores across all reviews, generates summary text, stores in `TutorSentiment` |
| `backend/app/models/ml.py` | `TutorSentiment` model — tutor_id (unique), summary_text (public), sentiment_score (hidden, 0-1), review_count, last_computed_at |
| `backend/app/ml/vectors.py` | `recompute_all_vectors(db)` — daily job that calls `compute_tutor_sentiment()` for all active tutors |
| `backend/app/tasks/ml_recomputation.py` | APScheduler job at 02:00 UTC — triggers `recompute_all_vectors()` |

**Summary text logic:**
| Score Range | Summary |
|-------------|---------|
| > 0.7 | "Students consistently praise..." |
| > 0.5 | "Generally positive feedback..." |
| > 0.3 | "Mixed feedback..." |
| <= 0.3 | "Some concerns raised..." |

**Confidence weighting:**
```
effective_sentiment = sentiment_score * min(1.0, review_count / 10)
```
Below 10 reviews, the score is dampened toward neutral (0.5).

### Frontend (Web + Mobile)
- `sentiment_summary` field displayed on tutor cards and tutor profile pages
- Numeric score is **never** sent to any frontend (CLAUDE.md rule #9)

---

## 12. Reliability Scoring

Computed from 6 months of session history. Tracks cancellation rates (especially within 48 hours), reschedule rates, session frequency, and total students taught. Stored as ML feature vectors used by the ranking model.

### Backend
| File | Purpose |
|------|---------|
| `backend/app/ml/reliability.py` | `compute_reliability(db, tutor_id)` — queries 6-month session history, computes: reliability_score (1.0 - cancellation_rate), cancellation_rate_48h, reschedule_rate_48h, sessions_per_week_avg, total_students_taught, total_sessions_completed. Stores in `TutorMLVectors` |
| `backend/app/models/ml.py` | `TutorMLVectors` model — tutor_id (unique), reliability_score, cancellation_rate_48h, reschedule_rate_48h, sessions_per_week_avg, total_students_taught, total_sessions_completed, last_computed_at |
| `backend/app/ml/vectors.py` | `recompute_all_vectors()` — calls reliability + sentiment computation for all active tutors |

**Confidence weighting:**
```
effective_reliability = reliability_score * min(1.0, total_sessions / 20)
```
Below 20 sessions, the score is dampened toward neutral.

---

## 13. Tutor Ranking Model

**Model:** scikit-learn model serialized as `.pkl` file. Takes tutor feature vectors as input and outputs a 0–1 composite quality score. Used to sort search results.

### Backend
| File | Purpose |
|------|---------|
| `backend/app/ml/ranking.py` | `load_model()` — lazy loads `backend/data/models/ranking_model.pkl` via joblib. `score_tutor(features)` — predicts 0-1 score. `confidence_weight(score, count, threshold)` — dampens score toward 0.5 below data threshold |
| `backend/data/models/ranking_model.pkl` | Serialized scikit-learn model file |
| `backend/app/services/search_service.py` | `structured_search()` calls `score_tutor()` to rank results |

**Input features (6):**
1. `reliability_score` (0-1) — from TutorMLVectors
2. `sentiment_score` (0-1) — from TutorSentiment
3. `review_count` (integer) — total reviews
4. `sessions_completed` (integer) — total completed sessions
5. `average_rating` (1-5) — mean star rating
6. `cancellation_rate` (0-1) — from TutorMLVectors

**Output:** 0-1 composite quality score used to sort search results.

---

## 14. NLP Search Parameter Extraction

Uses Google Gemma 4 E4B model via Ollama to parse natural language search queries into structured filter parameters. Temperature set to 0.1 for deterministic, consistent extraction.

### Backend
| File | Purpose |
|------|---------|
| `backend/app/integrations/ollama_client.py` | `extract_search_params(query)` — sends NL query to Ollama with extraction prompt, temp=0.1 |
| `backend/app/ml/nlp_extractor.py` | `extract_from_query(query)` — wrapper for Ollama extraction |
| `backend/app/services/search_service.py` | `extract_filters_from_query()` — calls Ollama extraction, parses JSON response, feeds into structured search. `describe_extracted_filters()` — generates human-readable description of extracted params |

**Example flow:**
```
Input:  "I need a female math tutor for O-Levels in Colombo, online, under 3000 LKR"
Ollama: { "subject": "mathematics", "education_level": "O-Level", "location": "Colombo", 
          "mode": "online", "budget": 3000, "gender_preference": "female" }
Output: Structured search results ranked by ML model
```

**Fallback:** If JSON parsing fails, returns `{raw_query: user_input}`.

---

## 15. Calendar

FullCalendar integration showing sessions color-coded by type. Supports personal events (stored in localStorage on web). Backend serves session events filtered by date range.

### Backend
| File | Purpose |
|------|---------|
| `backend/app/api/v1/calendar.py` | `GET /events` — events for date range (start_date, end_date query params) |
| `backend/app/services/calendar_service.py` | `get_calendar_events(db, current_user, start, end)` — queries sessions for the user within the date range |

### Web Frontend
| File | Purpose |
|------|---------|
| `web/src/pages/shared/Calendar.tsx` | FullCalendar (dayGrid, timeGrid, interaction plugins). Personal events in localStorage. Session events from backend. Color coding by session type. Recurrence UI. Session create/edit/delete/cancel actions |
| `web/src/pages/shared/Calendar.module.css` | Calendar styles |
| `web/src/services/calendarService.ts` | `getEvents(startDate, endDate, sessionType)` |
| `web/src/types/calendar.ts` | `CalendarEvent` type for FullCalendar |

### Mobile
| File | Purpose |
|------|---------|
| `mobile/src/screens/shared/CalendarScreen.tsx` | Monthly calendar with event details |
| `mobile/src/services/calendarService.ts` | getEvents (date range), getAvailableSlots |

---

## 16. Notifications

Three channels: in-app (database-stored, paginated), push (Firebase Cloud Messaging via Sygnal), and email (Mailpit SMTP in dev). In-app notifications support read/unread state and mark-all-read.

### Backend
| File | Purpose |
|------|---------|
| `backend/app/api/v1/notifications.py` | `GET /` list (cursor-paginated), `PUT /mark-all-read`, `PUT /{id}/read` |
| `backend/app/services/notification_service.py` | `create_notification()`, `get_notifications()`, `mark_all_read()`, `mark_read()` |
| `backend/app/services/email_service.py` | `send_email()` via SMTP, `send_verification_email()`, `send_password_reset_email()` — logs to EmailLog |
| `backend/app/models/notification.py` | `Notification` (account_id, title, body, notification_type, related_entity_id/type, is_read), `EmailLog` (recipient_email, subject, status sent/failed, error_message) |
| `backend/app/integrations/firebase_client.py` | `send_push_notification()` via FCM HTTP v1 API (stub) |
| `backend/app/integrations/sygnal_client.py` | Sygnal push gateway config (stub) |

### Web Frontend
| File | Purpose |
|------|---------|
| `web/src/pages/shared/Notifications.tsx` | Notification feed with read/unread toggle |
| `web/src/components/notification/NotificationDropdown.tsx` | Quick notification dropdown from header |
| `web/src/services/notificationService.ts` | list, markRead, markAllRead |
| `web/src/stores/notificationStore.ts` | Zustand: notifications array, unreadCount, setNotifications, addNotification, markRead, markAllRead |

### Mobile
| File | Purpose |
|------|---------|
| `mobile/src/screens/shared/NotificationsScreen.tsx` | Notification list with read status |
| `mobile/src/services/notificationService.ts` | getAll, markAllAsRead, markAsRead |
| `mobile/src/lib/notifications.ts` | `registerForPushNotifications()`, `sendPushTokenToServer()`, Expo notification listeners, Android channels |

---

## 17. Parent–Child System

Parents link to student accounts via email invite (token-based, 24-hour expiry). Parents can view their child's calendar and manage tutor permissions (grant/deny per tutor per child). Under-15 students require parental permission before interacting with tutors.

### Backend
| File | Purpose |
|------|---------|
| `backend/app/api/v1/parents.py` | `GET /me/dashboard`, `POST /me/link-child`, `GET /me/children`, `GET /me/children/{student_id}`, `PUT /me/permissions/{permission_id}` |
| `backend/app/services/parent_service.py` | `link_child()` — sends email invite token. `get_children()`, `get_child_detail()` — includes tutor permissions. `update_permission()` — grant/deny/revoke |
| `backend/app/models/parent.py` | `ParentProfile`, `ParentStudentLink` (status pending/active), `ParentInviteToken` (token_hash, expires_at), `ParentTutorPermission` (parent+student+tutor, status pending/granted/denied) |

### Web Frontend
| File | Purpose |
|------|---------|
| `web/src/pages/parent/Dashboard.tsx` | Children overview, upcoming sessions, pending permissions |
| `web/src/pages/parent/ChildOverview.tsx` | Monitor child's classes, tutor permissions |
| `web/src/pages/parent/LinkChild.tsx` | Send link request to student email |

### Mobile
| File | Purpose |
|------|---------|
| `mobile/src/screens/parent/DashboardScreen.tsx` | Children overview, pending permissions alert |
| `mobile/src/screens/parent/ChildrenListScreen.tsx` | List of linked children |
| `mobile/src/screens/parent/LinkChildScreen.tsx` | Link child account |
| `mobile/src/screens/parent/ChildOverviewScreen.tsx` | Child details with tutor permission management |
| `mobile/src/components/parent/ChildCard.tsx` | Child card component |
| `mobile/src/components/parent/LinkChildForm.tsx` | Link child form |
| `mobile/src/components/parent/PermissionToggle.tsx` | Permission grant/deny toggle |

---

## 18. File Storage

MinIO (S3-compatible, self-hosted) handles profile pictures and class materials. Presigned URLs with 1-hour expiry. 50MB max upload. Chat media is stored separately in Synapse's media store.

### Backend
| File | Purpose |
|------|---------|
| `backend/app/api/v1/files.py` | `POST /upload` — upload to MinIO (multipart), `GET /{key}` — get presigned URL |
| `backend/app/services/file_service.py` | `get_minio_client()`, `upload_file(bucket, entity_id, filename, data, content_type)` with MIME validation, `get_presigned_url(bucket, object_name)` — 1-hour expiry, `delete_file()` |

### Web Frontend
| File | Purpose |
|------|---------|
| `web/src/services/fileService.ts` (implied in authService) | `upload(file, bucket)` → `POST /files/upload` (multipart, returns URL + key) |

### Mobile
| File | Purpose |
|------|---------|
| `mobile/src/services/fileService.ts` | upload (multipart), getUrl |

### Infrastructure
| File | Purpose |
|------|---------|
| `docker-compose.yml` | MinIO container (ports 9000 API, 9001 console) |
| `docker/minio/init-buckets.sh` | Bootstrap script: creates `profile-pictures`, `class-materials`, `qr-codes` buckets |

---

## 19. Admin Panel

Separate React app for platform administration. Features: account management (restrict/unrestrict/delete), review moderation (soft-delete with reason), immutable audit log with CSV export, subject/category management, admin team management.

### Backend
| File | Purpose |
|------|---------|
| `backend/app/api/admin/auth.py` | `POST /login`, `PUT /password`, `POST /refresh`, `POST /logout` — separate admin auth with rate limiting |
| `backend/app/api/admin/dashboard.py` | `GET /dashboard` — platform stats |
| `backend/app/api/admin/accounts.py` | `GET /` list (filters), `GET /{id}` detail, `POST /{id}/restrict`, `POST /{id}/unrestrict`, `DELETE /{id}` |
| `backend/app/api/admin/reviews.py` | `GET /` list (filtered), `GET /{id}` detail, `DELETE /{id}` soft-delete with reason |
| `backend/app/api/admin/audit.py` | `GET /` audit log (cursor-paginated, filterable), `GET /export` CSV export |
| `backend/app/api/admin/subjects.py` | `POST /categories`, `POST /`, `PUT /{id}`, `DELETE /{id}` — subject CRUD |
| `backend/app/api/admin/admins.py` | `GET /` list admins, `POST /create` new admin |
| `backend/app/services/admin_service.py` | `get_dashboard_stats()`, `restrict_account()`, `unrestrict_account()`, `admin_delete_account()`, `create_admin()`, `get_audit_log()` |
| `backend/app/models/audit.py` | `AdminAuditLog` — immutable (ON DELETE RESTRICT on admin FK): admin_id, action_type, target_entity_id/type, reason, outcome, created_at |
| `backend/app/models/admin.py` | `AdminProfile` (must_change_password flag) |

### Admin Frontend
| File | Purpose |
|------|---------|
| `admin/src/pages/Dashboard.tsx` | Platform statistics (user counts, sessions, pending reviews, restricted accounts) + recent audit log |
| `admin/src/pages/AccountList.tsx` | User management with filters (type, status) + table |
| `admin/src/pages/AccountDetail.tsx` | Account details, restrict/unrestrict, delete with reason |
| `admin/src/pages/ReviewList.tsx` | Review moderation with delete |
| `admin/src/pages/ReviewDetail.tsx` | Single review with deletion action |
| `admin/src/pages/AuditLog.tsx` | Immutable audit trail, action filtering, CSV export |
| `admin/src/pages/SubjectManagement.tsx` | Create/edit categories and subjects with education level associations |
| `admin/src/pages/AdminTeam.tsx` | Admin user management with create form |
| `admin/src/pages/AdminProfile.tsx` | Admin password change |
| `admin/src/components/layout/AdminSidebar.tsx` | Navigation sidebar (red accent, visually distinct from consumer apps) |
| `admin/src/components/layout/AdminShell.tsx` | Main layout wrapper |
| `admin/src/components/layout/AdminHeader.tsx` | Title, subtitle, action buttons |
| `admin/src/components/common/DataTable.tsx` | Sortable table with pagination |
| `admin/src/components/common/StatCard.tsx` | Dashboard stat card |
| `admin/src/components/common/ConfirmAction.tsx` | Destructive action modal with reason input |
| `admin/src/services/accountService.ts` | getAccounts, getAccount, restrictAccount, unrestrictAccount, deleteAccount |
| `admin/src/services/reviewService.ts` | getReviews, getReview, deleteReview |
| `admin/src/services/auditService.ts` | getAuditLog, exportAuditLogCsv |
| `admin/src/services/dashboardService.ts` | getDashboardStats |
| `admin/src/services/subjectService.ts` | CRUD for categories, subjects, education levels |
| `admin/src/services/adminTeamService.ts` | getAdminTeam, createAdmin |

---

## 20. Background Jobs

5 daily background jobs managed by APScheduler (AsyncIOScheduler).

### Backend
| File | Purpose |
|------|---------|
| `backend/app/tasks/scheduler.py` | APScheduler setup with all 5 cron jobs |
| `backend/app/tasks/age_restriction.py` | **00:00 UTC** — `check_birthdays()`: lifts `is_age_restricted` flag when student turns 15 |
| `backend/app/tasks/account_deletion.py` | **01:00 UTC** — `process_deletions()`: processes accounts past 7-day grace period |
| `backend/app/tasks/ml_recomputation.py` | **02:00 UTC** — `recompute_vectors()`: recomputes sentiment + reliability for all active tutors |
| `backend/app/tasks/cleanup.py` | **03:00 UTC** — `cleanup_expired_tokens()`: deletes expired refresh/reset/verification tokens |
| `backend/app/tasks/session_generation.py` | **04:00 UTC** — `generate_recurring_sessions()`: pre-generates occurrences on 3-month rolling horizon |

---

## 21. Security & Infrastructure

### Security Stack
| File | Purpose |
|------|---------|
| `backend/app/core/security.py` | Argon2 password hashing, JWT (HS256) creation/decoding, Fernet AES-256 encryption for gov IDs, HMAC-SHA256 for gov ID lookups, Jitsi JWT generation |
| `backend/app/core/auth.py` | `get_current_user()` — JWT extraction from header/cookie, `require_role()` — role-based access |
| `backend/app/core/rate_limiter.py` | Redis-based per-IP/per-account rate limiting (100 req/min default, 5/min login/register) |
| `backend/app/config.py` | Pydantic Settings loading all env vars (NEVER hardcoded) |
| `.env.example` | Template for all required secrets |

### Infrastructure (Docker)
| File | Purpose |
|------|---------|
| `docker-compose.yml` | Production: 13+ services (postgres, redis, synapse, jitsi x4, ollama, minio, mailpit, sygnal, backend, nginx) |
| `docker-compose.dev.yml` | Development overrides |
| `docker/postgres/init-synapse-db.sql` | Creates synapse database |
| `docker/minio/init-buckets.sh` | Creates MinIO buckets |
| `docker/synapse/homeserver.yaml` | Synapse config (registration disabled, rate limits, media store) |
| `docker/jitsi/` | Jitsi service configs (JWT auth, room settings) |

### Application Entry Points
| File | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI app: CORS middleware, exception handlers, router mounting, lifespan (scheduler start, Ollama warmup, Redis cleanup) |
| `web/src/App.tsx` | React Router v6 with lazy code splitting, auth guards, role-based routing |
| `web/src/lib/axios.ts` | Axios interceptors: Bearer token injection, 401 silent refresh, response normalization |
| `mobile/src/navigation/RootNavigator.tsx` | Auth-state routing to Student/Tutor/Parent tab navigators |

### Design System
| File | Purpose |
|------|---------|
| `web/src/styles/globals.css` | 90+ CSS variables: colors, typography, spacing, shadows, radii, transitions |
| `web/src/styles/animations.css` | Keyframe animations: shimmer, fadeIn, slideUp, pulse, bounce |
| `web/src/hooks/useAnimations.ts` | Framer Motion presets: pageVariants, fadeIn, slideUp, scaleIn, modalVariants, stagger, cardHover, buttonTap |

### Shared Types
| File | Purpose |
|------|---------|
| `shared/types/` | Shared TypeScript type definitions used across web, mobile, and admin |
| `web/src/types/` | 9 type definition files: common, auth, tutor, student, parent, session, chat, notification, review, calendar |

### Database & Migrations
| File | Purpose |
|------|---------|
| `backend/app/database.py` | SQLAlchemy async engine, session factory, `get_db()` dependency |
| `backend/alembic/` | Alembic migration directory |
| `backend/app/models/base.py` | DeclarativeBase, TimestampMixin (created_at, updated_at UTC), UUIDMixin (UUID v4 PK) |

### Seed Data & Scripts
| File | Purpose |
|------|---------|
| `backend/scripts/seed_dev_data.py` | Development seed data (test accounts, subjects, locations) |

---

## Appendix: Complete Model Count

| Category | Count | Models |
|----------|-------|--------|
| Identity | 5 | Account, StudentProfile, TutorProfile, ParentProfile, AdminProfile |
| Tutor Details | 3 | TutorSubject, TutorWorkingHours, TutorContact |
| Student Details | 1 | StudentSubject |
| Sessions | 3 | Session, RecurrenceRule, OccurrenceException |
| Booking | 2 | SessionInvite, Enrolment |
| Attendance | 2 | QRToken, AttendanceRecord |
| Reviews | 3 | Review, ReviewAuthorship, ReviewDurationSignal |
| Chat | 3 | ChatRoomMapping, ChatMessage, JitsiRoom |
| ML/AI | 2 | TutorSentiment, TutorMLVectors |
| Parent | 3 | ParentStudentLink, ParentInviteToken, ParentTutorPermission |
| Notifications | 2 | Notification, EmailLog |
| Reference Data | 5 | SubjectCategory, Subject, EducationLevel, SubjectLevelAvailability |
| Locations | 3 | Country, Region, City |
| Tokens | 3 | RefreshToken, PasswordResetToken, EmailVerificationToken |
| Audit | 1 | AdminAuditLog |
| **Total** | **41** | |

## Appendix: Complete API Endpoint Count

| Area | Count |
|------|-------|
| Auth (v1) | 9 |
| Accounts (v1) | 7 |
| Students (v1) | 4 |
| Tutors (v1) | 11 |
| Sessions (v1) | 8 |
| Reviews (v1) | 6 |
| Chat (v1) | 6 |
| Attendance (v1) | 4 |
| Enrolments (v1) | 2 |
| Invites (v1) | 4 |
| Notifications (v1) | 3 |
| Search + AI (v1) | 3 |
| Calendar (v1) | 1 |
| Parents (v1) | 5 |
| Files (v1) | 2 |
| Subjects (v1) | 3 |
| Locations (v1) | 3 |
| Admin Auth | 4 |
| Admin Dashboard | 1 |
| Admin Accounts | 5 |
| Admin Reviews | 3 |
| Admin Audit | 2 |
| Admin Subjects | 4 |
| Admin Team | 2 |
| Health | 1 |
| **Total** | **~102** |
