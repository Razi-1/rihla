from fastapi import APIRouter

from app.api.admin import accounts, admins, audit, auth, dashboard, reviews, subjects

admin_router = APIRouter(prefix="/api/admin")

admin_router.include_router(auth.router, prefix="/auth", tags=["Admin Auth"])
admin_router.include_router(dashboard.router, tags=["Admin Dashboard"])
admin_router.include_router(accounts.router, prefix="/accounts", tags=["Admin Accounts"])
admin_router.include_router(reviews.router, prefix="/reviews", tags=["Admin Reviews"])
admin_router.include_router(audit.router, prefix="/audit-log", tags=["Admin Audit"])
admin_router.include_router(subjects.router, prefix="/subjects", tags=["Admin Subjects"])
admin_router.include_router(admins.router, prefix="/team", tags=["Admin Team"])
