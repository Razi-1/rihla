# Rihla — Feature Overview

> A simple, plain-language guide to every feature in the Rihla tutoring platform and how it works.

---

## What is Rihla?

Rihla is a tutoring platform that connects **students**, **tutors**, and **parents** in one place. It has a **web app**, a **mobile app**, and a separate **admin panel**. Think of it as an all-in-one system for finding tutors, booking sessions, attending classes online or in-person, chatting securely, and tracking progress — with AI built into the core experience.

There are **4 user roles:**
- **Student** — finds tutors, attends classes, writes reviews
- **Tutor** — creates classes, manages schedule, teaches
- **Parent** — links to their child's account, approves tutors, monitors activity
- **Admin** — manages the platform: accounts, reviews, subjects, audit trail

---

## Core Features

### 1. Account System

**What it does:** Users create accounts by choosing a role (student, tutor, or parent), entering personal details including a government ID (for identity verification), and verifying their email.

**How it works:**
- Government IDs are encrypted (AES-256) before storage — nobody can read them from the database.
- Passwords are hashed with Argon2 (a memory-hard algorithm that's extremely difficult to crack).
- After registration, users get a verification email. Certain features (chat, booking, reviews) are locked until email is verified.
- Login returns a short-lived access token (15 min) and a refresh token (7 days). When the access token expires, the app silently refreshes it in the background.
- If a user forgets their email, they can recover it using their government ID + password.
- Account deletion has a 7-day grace period — users can cancel anytime within that window.
- Rate limiting prevents brute-force attacks: only 5 login/register attempts per minute.

### 2. User Profiles

**What it does:** Each role has a different profile with different information.

**How it works:**
- **Students** set their education level (e.g., O-Level, A-Level), list subjects they're studying, and write a short bio.
- **Tutors** build a detailed profile: bio, subjects they teach (with education levels), mode of tuition (online/physical/hybrid), location (country/region/city), hourly rates (individual and group), working hours (per day of week), and timezone.
- **Parents** have a simpler profile focused on linking to their children's accounts.
- **Tutor profile completeness gate:** Tutors only appear in search results once they've set at least one subject, chosen a tuition mode, and set at least one rate. The dashboard shows them exactly what's missing.

### 3. Tutor Search (Structured + AI-Powered)

**What it does:** Students find tutors using traditional filters or by typing a natural language query that AI interprets.

**How it works:**

**Structured search:** Students pick filters — subject, education level, online/physical/hybrid, location, price range, gender — and get matching tutors sorted by quality.

**AI search:** Students type something like *"I need a female math tutor for O-Levels in Colombo who teaches online under 3000 LKR"* and the system understands it. Here's what happens behind the scenes:

1. The query is sent to **Gemma 4** (a Google language model running locally via Ollama).
2. Gemma extracts structured parameters: `subject: mathematics, level: O-Level, location: Colombo, mode: online, budget: 3000, gender: female`.
3. Those parameters feed into the normal structured search.
4. Results are ranked by the **ML ranking model** (see section below).
5. The student sees both the results and a description of how the AI interpreted their query.

Anyone can browse tutors publicly, but AI search requires being logged in as a student.

### 4. Session & Class Management

**What it does:** Tutors create classes and invite students. Three types of sessions, three modes of delivery.

**Session types:**
- **Booking Meeting** — an initial consultation (exempt from the 48-hour rule)
- **Individual Class** — one-on-one tutoring
- **Group Class** — multiple students (tutor sets max group size)

**Modes:**
- **Online** — a Jitsi video room is automatically generated
- **Physical** — the tutor provides a location address
- **Hybrid** — both

**How scheduling works:**
- Sessions can be one-time or recurring (weekly, biweekly, or monthly on specific days).
- Recurring sessions are pre-generated up to 3 months ahead by a daily background job.
- Individual occurrences can be edited or cancelled without affecting the rest of the series.
- The system checks for scheduling conflicts — a tutor can't double-book.
- Working hours are advisory: if a tutor creates a session outside their stated hours, the system warns but doesn't block.

**The 48-hour rule:** If a tutor cancels or reschedules a class within 48 hours of the start time (and students have already accepted), it counts against their reliability score. Booking meetings are exempt.

**Duration options:** 30, 45, 60, 90, or 120 minutes.

### 5. Invitations & Enrolments

**What it does:** Manages how students join classes.

**How it works:**
- When a tutor creates a session, they invite specific students.
- At invite time, the system captures a "conflict snapshot" — the student's existing schedule — so they can see if there's a clash before accepting.
- Students can accept (creates an enrolment, adds them to the class broadcast chat room) or decline (with an optional note explaining why).
- For group classes, students can also "request to join" without being invited.
- Enrolled students can opt out at any time.
- If a student is under 15 and requests to join a group class, a parent permission request is automatically created.

### 6. Attendance Tracking

**What it does:** Records who actually showed up to each session.

**Two methods:**

**QR Code (primary, for mobile):**
1. The tutor taps "Generate QR" — the system creates a signed JWT token valid from 15 minutes before the session until it ends.
2. The QR code is displayed on the tutor's screen.
3. Students scan it with their phone camera.
4. The system validates the token and records attendance.

**Jitsi Webhook (automatic, for online sessions):**
- When a student joins the Jitsi video call, Jitsi sends a webhook event to the backend.
- The backend automatically records attendance.

Only one attendance record per student per session. Both methods produce the same result.

### 7. Reviews & Ratings

**What it does:** Students rate and review their tutors.

**How it works:**
- Only students who have actually attended sessions with a tutor can write a review.
- One review per student per tutor (can be updated or deleted).
- Reviews include a 1-5 star rating and text comment.
- Students can optionally report how many sessions they attended and approximate duration of study.
- Admins can soft-delete reviews that violate guidelines (the review text is preserved internally but hidden from public view). A reason is required and logged to the audit trail.
- Review text is automatically analyzed for sentiment by the AI system (see below).
- Reviewer names are never shown to tutors — reviews are anonymous.

### 8. Encrypted Chat

**What it does:** Secure real-time messaging between tutors and students, built on the Matrix protocol.

**Two types of chat rooms:**
- **DM (Direct Message):** One-on-one between a tutor and student. Both can send messages.
- **Broadcast:** Tutor to an entire class. Only the tutor can send; students can read. Used for announcements and sharing materials.

**How it works:**
- The backend creates Matrix users and rooms via the Synapse admin API.
- Web uses the modern Rust crypto engine. Mobile uses legacy Olm crypto. Both provide end-to-end encryption.
- Chat media (images, files shared in chat) is stored in Synapse's own media store, not in the main file storage.
- Students can book a session directly from within a chat conversation (a booking modal pops up with the tutor's availability).

**Under-15 restriction:** Students under 15 cannot initiate DMs with tutors. A parent must grant permission first.

### 9. Video Calling

**What it does:** Live video sessions for online classes, powered by self-hosted Jitsi Meet.

**How it works:**
- When an online session is created, the system generates a unique Jitsi room name (format: `rihla-{session_id}-{random}`).
- When a user joins, the backend generates a JWT token that authenticates them to the Jitsi room.
- Tutors join as moderators; students join as participants.
- The Jitsi toolbar includes: microphone, camera, screen sharing, chat, raise hand, tile view, and hangup.
- Jitsi sends "participant joined" webhooks back to the backend for automatic attendance tracking.

### 10. Calendar

**What it does:** A visual calendar showing all sessions and personal events.

**How it works:**
- Pulls sessions from the backend and displays them color-coded by type (booking meeting, individual class, group class).
- Users can also create personal events that are stored locally in the browser (not on the server).
- Supports month and week views (web uses FullCalendar library).
- Quick actions: edit, cancel, or join a session directly from the calendar.

### 11. Notifications

**What it does:** Keeps users informed about invites, session changes, reviews, and other events.

**Three channels:**
1. **In-app:** Database-stored notifications shown in a feed. Users can mark individual or all notifications as read. Cursor-paginated.
2. **Push (mobile):** Firebase Cloud Messaging sends push notifications to the mobile app. Device tokens are registered via Expo.
3. **Email:** Verification emails, password reset links, and other transactional emails sent via SMTP (using Mailpit in development).

### 12. Parent-Child System

**What it does:** Gives parents oversight and control over their child's tutoring.

**How it works:**
1. A parent enters their child's email to request a link.
2. The child receives an email invite (24-hour expiry) and approves the link.
3. Once linked, the parent can:
   - See the child's calendar and sessions.
   - View which tutors the child interacts with.
   - Grant or deny permission for specific tutors (especially important for under-15 students).
4. If a parent denies permission for a tutor, the parent becomes an intermediary for all communication with that tutor.
5. When an under-15 student requests to join a group class, a parent permission request is automatically created.

### 13. File Storage

**What it does:** Stores profile pictures and class materials.

**How it works:**
- Files are uploaded to MinIO (a self-hosted S3-compatible storage system).
- Three buckets: `profile-pictures`, `class-materials`, `qr-codes`.
- Files are accessed via presigned URLs that expire after 1 hour.
- Maximum upload size: 50MB.
- Supported types: images (JPEG, PNG, GIF, WebP), documents (PDF, DOCX, PPTX, XLSX), video (MP4, MOV, WebM).
- Chat media (images/files shared in chat) is separate — stored in Synapse's media store.

---

## AI & Machine Learning Features

Rihla has **5 distinct AI/ML systems** that work together. Here's what each one does and how:

### ML-1: Sentiment Analysis (DistilBERT)

**Model:** `distilbert-base-uncased-finetuned-sst-2-english` from HuggingFace  
**What it does:** Analyzes the text of every student review to understand whether the feedback is positive, negative, or mixed.

**How it works:**
1. When reviews are processed, each review's text is fed through DistilBERT (a smaller, faster version of BERT).
2. The model outputs a sentiment score between 0 (very negative) and 1 (very positive).
3. All scores for a tutor are averaged.
4. A human-readable summary is generated:
   - Score > 0.7: *"Students consistently praise this tutor's teaching..."*
   - Score > 0.5: *"Generally positive feedback..."*
   - Score > 0.3: *"Mixed feedback from students..."*
   - Score <= 0.3: *"Some students have raised concerns..."*
5. The summary text is shown on tutor profiles and search cards.
6. The numeric score is **never shown** to any user — only used internally for ranking.
7. Recomputed daily at 2:00 AM UTC for all active tutors.

**Confidence weighting:** New tutors with fewer than 10 reviews have their sentiment score dampened toward 0.5 (neutral), preventing a single glowing or harsh review from dominating.

### ML-2: Reliability Scoring

**What it does:** Measures how dependable a tutor is based on their session history over the past 6 months.

**Metrics computed:**
- **Reliability score:** 1.0 minus the cancellation rate (a tutor who never cancels scores 1.0)
- **48-hour cancellation rate:** Percentage of sessions cancelled within 48 hours
- **48-hour reschedule rate:** Percentage of sessions rescheduled within 48 hours
- **Sessions per week average:** How frequently the tutor teaches
- **Total students taught:** Distinct student count
- **Total sessions completed:** Completed session count

**How it works:**
1. A daily background job queries each tutor's sessions from the past 6 months.
2. The metrics above are calculated from that data.
3. Results are stored in the `tutor_ml_vectors` database table.
4. These scores feed directly into the ranking model (see below).

**Confidence weighting:** Tutors with fewer than 20 total sessions have their reliability score dampened toward 0.5, preventing new tutors from getting artificially high or low rankings.

### ML-3: Tutor Ranking Model (scikit-learn)

**Model:** Pre-trained scikit-learn model saved as `ranking_model.pkl`  
**What it does:** Produces a single 0-1 quality score for each tutor, used to sort search results.

**Input features (6):**
1. Reliability score (from ML-2)
2. Sentiment score (from ML-1)
3. Total review count
4. Total sessions completed
5. Average star rating (1-5)
6. Cancellation rate

**How it works:**
1. When a student searches for tutors, the backend loads the ML model.
2. For each matching tutor, it assembles the 6 features above.
3. The model predicts a composite quality score (0-1).
4. Search results are sorted by this score (highest first).
5. The model is loaded lazily on first use and cached in memory.

This means search results aren't just filtered — they're intelligently ranked by a model that considers reliability, student satisfaction, and teaching track record.

### ML-4: NLP Search Parameter Extraction (Gemma 4)

**Model:** Google Gemma 4 E4B running locally via Ollama  
**What it does:** Understands natural language search queries and converts them into structured filters.

**How it works:**
1. The student types a natural language query like: *"I need an online math tutor for A-Levels who charges under 5000 LKR"*
2. The query is sent to Gemma 4 with a carefully crafted system prompt that says: *"You are a search parameter extractor for a tutoring platform. Extract: subject, education_level, location, mode, budget, gender_preference. Return ONLY valid JSON."*
3. Temperature is set to 0.1 (very deterministic — the same query should produce the same extraction every time).
4. Gemma returns: `{"subject": "mathematics", "education_level": "A-Level", "mode": "online", "budget": 5000}`
5. Those parameters feed into the structured search pipeline.
6. The student sees a human-readable description of what the AI understood.
7. If JSON parsing fails, the system falls back gracefully.

### ML-5: AI Study Assistant (Gemma 4)

**Model:** Google Gemma 4 E4B running locally via Ollama  
**What it does:** An AI chatbot available in the chat interface for study help and tutor discovery.

**How it works for students:**
- Uses the **Socratic method** — instead of giving direct answers, it guides students to discover answers through questions and encouragement.
- The system prompt is personalized: it knows the student's education level, subjects, and bio.
- Responses are kept concise (2-4 sentences).
- Temperature is set to 0.7 (more conversational and varied than the search extractor).

**How it works for tutors:**
- Acts as a general helper for lesson planning, teaching strategies, and administrative tasks.
- Different system prompt than students.

**Technical details:**
- Conversation history is passed with each message so the AI remembers context.
- On backend startup, the model is pre-loaded ("warmed up") so the first user doesn't wait 30-60 seconds for a cold start.
- If Ollama is unavailable, a graceful fallback message is returned.

---

## Admin Panel

A separate web application (different URL, different port) for platform administrators.

### Dashboard
Shows real-time platform stats: total students, tutors, parents, active sessions, pending reviews, restricted accounts. Includes a preview of recent audit log entries.

### Account Management
- View all accounts in a filterable, sortable table.
- Filter by role (student/tutor/parent) and status (active/restricted).
- View individual account details.
- Restrict an account (hides from search, blocks new bookings — existing sessions continue). Requires a reason.
- Unrestrict an account. Requires a reason.
- Delete an account. Requires a reason. Cascades: sessions cancelled, enrolments opted-out, reviews orphaned, Matrix account deactivated.

### Review Moderation
- View all reviews in a table.
- Soft-delete reviews that violate guidelines. Requires a reason. The review text is preserved internally but hidden from public view.

### Audit Log
- An immutable record of every admin action (restrict, unrestrict, delete, create, update).
- Records: timestamp, admin name, action type, target entity, reason, outcome.
- Cannot be edited or deleted (enforced at the database level).
- Filterable by action type.
- Exportable to CSV.

### Subject Management
- Create and manage subject categories (e.g., "Sciences", "Languages").
- Create and manage subjects within categories (e.g., "Physics" under "Sciences").
- Associate subjects with education levels (e.g., Physics available at O-Level and A-Level).

### Admin Team
- View all admin accounts.
- Create new admins with a temporary password (must_change_password flag set).

---

## Infrastructure

### How Everything Runs

The entire platform runs on Docker containers on a local development machine:

| Service | What It Does |
|---------|-------------|
| **PostgreSQL 16** | Main database (41 tables) + Synapse database |
| **Redis 7** | Rate limiting, session caching |
| **Synapse** | Matrix chat server (self-hosted) |
| **Jitsi (4 services)** | Video calling: web UI, XMPP server, conference focus, video bridge |
| **Ollama** | Runs Gemma 4 AI model locally |
| **MinIO** | File storage (S3-compatible) |
| **Mailpit** | Development email testing |
| **Sygnal** | Push notification gateway for Matrix |
| **Backend** | FastAPI Python server |
| **Nginx** | Reverse proxy with HTTPS |

Total: ~13.5 GB RAM usage. Designed for a developer laptop with 32GB RAM and an RTX 4070 GPU.

### Background Jobs (5 Daily)

| Time (UTC) | Job | What It Does |
|------------|-----|-------------|
| 00:00 | Birthday Check | Lifts age restriction when students turn 15 |
| 01:00 | Deletion Processor | Deletes accounts past their 7-day grace period |
| 02:00 | ML Recomputation | Recalculates sentiment scores + reliability vectors for all active tutors |
| 03:00 | Token Cleanup | Deletes expired refresh/password-reset/verification tokens |
| 04:00 | Session Generator | Pre-generates recurring session occurrences up to 3 months ahead |

### Security Measures

- **Passwords:** Argon2 hashing (memory-hard, brute-force resistant)
- **Government IDs:** Fernet AES-256 encryption + HMAC-SHA256 for duplicate detection without decryption
- **Authentication:** JWT tokens (15-min access + 7-day refresh)
- **Video:** JWT-authenticated Jitsi rooms
- **Chat:** End-to-end encrypted via Matrix protocol
- **Rate limiting:** Redis-based, per-IP and per-account
- **CSRF:** Synchronizer token pattern
- **CORS:** Whitelisted origins only
- **Secrets:** All in `.env` file, never committed to git

---

## Platform Stats at a Glance

| Metric | Count |
|--------|-------|
| Database models | 41 |
| API endpoints | ~102 |
| Web pages | 28 |
| Mobile screens | 24 |
| Admin pages | 9 |
| Backend services | 14+ |
| Background jobs | 5 |
| AI/ML models | 3 (DistilBERT, scikit-learn ranking, Gemma 4) |
| AI features | 5 (sentiment, reliability, ranking, NLP search, study assistant) |
| Docker services | 13+ |
