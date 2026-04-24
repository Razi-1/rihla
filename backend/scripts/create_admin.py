#!/usr/bin/env python3
"""CLI script to create the first admin account."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import async_session_factory
from app.services.admin_service import create_admin


async def main():
    email = input("Admin email: ").strip()
    first_name = input("First name: ").strip()
    last_name = input("Last name: ").strip()
    password = input("Password: ").strip()

    async with async_session_factory() as db:
        account = await create_admin(db, email, first_name, last_name, password)
        await db.commit()
        print(f"Admin account created: {account.id}")


if __name__ == "__main__":
    asyncio.run(main())
