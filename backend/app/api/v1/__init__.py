from fastapi import APIRouter

from app.api.v1 import (
    accounts,
    ai,
    attendance,
    auth,
    calendar,
    chat,
    enrolments,
    files,
    invites,
    locations,
    notifications,
    parents,
    reviews,
    search,
    sessions,
    students,
    subjects,
    tutors,
)

v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
v1_router.include_router(accounts.router, prefix="/accounts", tags=["Accounts"])
v1_router.include_router(ai.router, prefix="/ai", tags=["AI"])
v1_router.include_router(students.router, prefix="/students", tags=["Students"])
v1_router.include_router(tutors.router, prefix="/tutors", tags=["Tutors"])
v1_router.include_router(sessions.router, prefix="/sessions", tags=["Sessions"])
v1_router.include_router(invites.router, prefix="/invites", tags=["Invites"])
v1_router.include_router(enrolments.router, prefix="/enrolments", tags=["Enrolments"])
v1_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
v1_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
v1_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
v1_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
v1_router.include_router(search.router, prefix="/search", tags=["Search"])
v1_router.include_router(calendar.router, prefix="/calendar", tags=["Calendar"])
v1_router.include_router(subjects.router, prefix="/subjects", tags=["Subjects"])
v1_router.include_router(locations.router, prefix="/locations", tags=["Locations"])
v1_router.include_router(parents.router, prefix="/parents", tags=["Parents"])
v1_router.include_router(files.router, prefix="/files", tags=["Files"])
