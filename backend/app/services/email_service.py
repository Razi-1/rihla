import logging
from datetime import datetime, timezone
from email.message import EmailMessage

import aiosmtplib

from app.config import settings
from app.models.notification import EmailLog

logger = logging.getLogger(__name__)


async def send_email(
    to: str,
    subject: str,
    body: str,
    notification_type: str = "general",
    db=None,
) -> bool:
    msg = EmailMessage()
    msg["From"] = f"Rihla <noreply@{settings.MATRIX_SERVER_NAME}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.MAILPIT_SMTP_HOST,
            port=settings.MAILPIT_SMTP_PORT,
            use_tls=False,
        )
        logger.info("Email sent to %s: %s", to, subject)

        if db:
            log = EmailLog(
                recipient_email=to,
                subject=subject,
                notification_type=notification_type,
                status="sent",
            )
            db.add(log)
            await db.flush()

        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to, e)

        if db:
            log = EmailLog(
                recipient_email=to,
                subject=subject,
                notification_type=notification_type,
                status="failed",
                error_message=str(e),
            )
            db.add(log)
            await db.flush()

        return False


async def send_verification_email(to: str, token: str, db=None) -> bool:
    url = f"{settings.APP_URL}/verify-email?token={token}"
    body = (
        f"Welcome to Rihla!\n\n"
        f"Please verify your email address by clicking the link below:\n\n"
        f"{url}\n\n"
        f"This link expires in 24 hours.\n\n"
        f"If you didn't create an account, you can ignore this email."
    )
    return await send_email(to, "Verify your Rihla account", body, "email_verification", db)


async def send_password_reset_email(to: str, token: str, db=None) -> bool:
    url = f"{settings.APP_URL}/reset-password?token={token}"
    body = (
        f"You requested a password reset for your Rihla account.\n\n"
        f"Click the link below to reset your password:\n\n"
        f"{url}\n\n"
        f"This link expires in 1 hour.\n\n"
        f"If you didn't request this, you can ignore this email."
    )
    return await send_email(to, "Reset your Rihla password", body, "password_reset", db)
