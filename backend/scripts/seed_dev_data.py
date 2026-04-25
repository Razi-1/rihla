#!/usr/bin/env python3
"""Seed development data: sample tutors with profiles and subjects."""
import asyncio
import random
import sys
import uuid
from datetime import date, time
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select

from app.core.security import compute_hmac, encrypt_data, hash_password
from app.database import async_session_factory
from app.models.account import Account
from app.models.location import City, Country, Region
from app.models.subject import EducationLevel, Subject
from app.models.tutor import TutorProfile, TutorSubject, TutorWorkingHours

TUTORS = [
    {"first": "Amara", "last": "Perera", "gender": "female", "nic": "199856700123", "bio": "Mathematics teacher with 8 years of experience in O-Level and A-Level curriculum. Cambridge-trained with a passion for making complex concepts simple.", "rate": 2500, "mode": "hybrid"},
    {"first": "Kasun", "last": "Fernando", "gender": "male", "nic": "199245600987", "bio": "Physics and Chemistry specialist. BSc from University of Colombo. I use interactive experiments and real-world examples to bring science to life.", "rate": 3000, "mode": "online"},
    {"first": "Dilini", "last": "Jayawardena", "gender": "female", "nic": "199567800234", "bio": "English language and literature tutor. IELTS certified with a Cambridge CELTA qualification. Helping students achieve fluency since 2018.", "rate": 2000, "mode": "hybrid"},
    {"first": "Ravindu", "last": "Silva", "gender": "male", "nic": "199734500678", "bio": "Computer Science and ICT tutor specializing in Python, Java, and web development. Former software engineer turned educator.", "rate": 3500, "mode": "online"},
    {"first": "Hashini", "last": "De Silva", "gender": "female", "nic": "199889900456", "bio": "Biology tutor with a MSc in Molecular Biology. I focus on visual learning and practical applications for O-Level and A-Level students.", "rate": 2800, "mode": "physical"},
    {"first": "Tharindu", "last": "Wickramasinghe", "gender": "male", "nic": "199423400567", "bio": "Combined Mathematics specialist for A-Level students. 12 years of teaching experience with excellent student pass rates.", "rate": 4000, "mode": "hybrid"},
    {"first": "Sachini", "last": "Bandara", "gender": "female", "nic": "199678900345", "bio": "Primary school specialist covering all subjects. Patient and creative approach to early childhood education with hands-on activities.", "rate": 1500, "mode": "physical"},
    {"first": "Nuwan", "last": "Rajapaksa", "gender": "male", "nic": "199312300890", "bio": "Economics and Business Studies tutor for A-Level and university students. MBA from University of Kelaniya.", "rate": 3200, "mode": "online"},
    {"first": "Isuri", "last": "Gunaratne", "gender": "female", "nic": "199545600678", "bio": "Sinhala and Tamil language tutor. Bilingual educator helping students master both national languages with cultural context.", "rate": 1800, "mode": "hybrid"},
    {"first": "Chamath", "last": "Dissanayake", "gender": "male", "nic": "199867800234", "bio": "IELTS and TOEFL preparation specialist. Score guarantee program with personalized study plans. Average student improvement: 1.5 bands.", "rate": 3500, "mode": "online"},
    {"first": "Nimesha", "last": "Weerasinghe", "gender": "female", "nic": "199723400123", "bio": "Art and Design tutor. BFA from University of Visual Arts. Teaching portfolio development, drawing, painting, and digital art.", "rate": 2200, "mode": "hybrid"},
    {"first": "Dinesh", "last": "Karunaratne", "gender": "male", "nic": "199156700890", "bio": "History and Political Science tutor. PhD candidate with deep knowledge of South Asian history and global politics.", "rate": 2000, "mode": "online"},
]

PASSWORD = "TutorPass123!"
PASSWORD_HASH = hash_password(PASSWORD)


async def main():
    async with async_session_factory() as db:
        existing = await db.execute(
            select(Account).where(Account.account_type == "tutor").limit(1)
        )
        if existing.scalar_one_or_none():
            print("Tutor accounts already exist — skipping seed")
            return

        countries = (await db.execute(select(Country))).scalars().all()
        if not countries:
            print("ERROR: Run import_locations.py first")
            return
        subjects = (await db.execute(select(Subject))).scalars().all()
        if not subjects:
            print("ERROR: Run import_subjects.py first")
            return
        levels = (await db.execute(select(EducationLevel))).scalars().all()
        if not levels:
            print("ERROR: Run import_subjects.py first")
            return

        lk = next(c for c in countries if c.code == "LK")
        lk_regions = (
            await db.execute(select(Region).where(Region.country_id == lk.id))
        ).scalars().all()
        lk_cities = []
        for r in lk_regions:
            cities = (
                await db.execute(select(City).where(City.region_id == r.id))
            ).scalars().all()
            lk_cities.extend([(c, r) for c in cities])

        for i, t in enumerate(TUTORS):
            gov_id = t["nic"]
            account = Account(
                email=f"{t['first'].lower()}.{t['last'].lower()}@example.com",
                account_type="tutor",
                password_hash=PASSWORD_HASH,
                government_id_encrypted=encrypt_data(gov_id),
                government_id_hmac=compute_hmac(gov_id),
                id_country_code="LK",
                first_name=t["first"],
                last_name=t["last"],
                date_of_birth=date(1990 + (i % 10), (i % 12) + 1, 15),
                gender=t["gender"],
                is_active=True,
                is_email_verified=True,
            )
            db.add(account)
            await db.flush()

            city, region = random.choice(lk_cities)
            profile = TutorProfile(
                account_id=account.id,
                bio=t["bio"],
                mode_of_tuition=t["mode"],
                country_id=lk.id,
                region_id=region.id,
                city_id=city.id,
                individual_rate=Decimal(t["rate"]),
                group_rate=Decimal(int(t["rate"] * 0.6)),
                currency="LKR",
                is_profile_complete=True,
                timezone="Asia/Colombo",
            )
            db.add(profile)
            await db.flush()

            chosen_subjects = random.sample(subjects, min(3, len(subjects)))
            chosen_levels = random.sample(levels, min(2, len(levels)))
            for subj in chosen_subjects:
                for level in chosen_levels:
                    db.add(
                        TutorSubject(
                            tutor_id=account.id,
                            subject_id=subj.id,
                            education_level_id=level.id,
                        )
                    )

            for day in range(0, 5):
                db.add(
                    TutorWorkingHours(
                        tutor_id=account.id,
                        day_of_week=day,
                        start_time=time(9, 0),
                        end_time=time(17, 0),
                        is_working=True,
                        timezone="Asia/Colombo",
                    )
                )

            print(f"  Created tutor: {t['first']} {t['last']}")

        await db.commit()
        print(f"\nSeeded {len(TUTORS)} tutors successfully")
        print(f"All tutors use password: {PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())
