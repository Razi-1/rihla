#!/usr/bin/env python3
"""Seed development data: tutors, students, sessions, reviews, enrolments."""
import asyncio
import random
import secrets
import sys
import uuid
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select

from app.core.security import compute_hmac, encrypt_data, hash_password
from app.database import async_session_factory
from app.models.account import Account
from app.models.chat import ChatRoomMapping
from app.models.enrolment import Enrolment
from app.models.location import City, Country, Region
from app.models.review import Review, ReviewAuthorship, ReviewDurationSignal
from app.models.session import Session
from app.models.student import StudentProfile
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

STUDENTS = [
    {"first": "Amal", "last": "Wijesinghe", "gender": "male", "nic": "200756700111", "dob": date(2007, 3, 12)},
    {"first": "Kavindi", "last": "Senaratne", "gender": "female", "nic": "200689900222", "dob": date(2006, 7, 22)},
    {"first": "Tharuka", "last": "Gamage", "gender": "male", "nic": "200845600333", "dob": date(2008, 11, 5)},
    {"first": "Nethmi", "last": "Rathnayake", "gender": "female", "nic": "200534500444", "dob": date(2005, 1, 18)},
    {"first": "Shanuka", "last": "Herath", "gender": "male", "nic": "200923400555", "dob": date(2009, 9, 30)},
    {"first": "Dasuni", "last": "Liyanage", "gender": "female", "nic": "200712300666", "dob": date(2007, 5, 8)},
]

REVIEW_COMMENTS = [
    "Excellent tutor! Very patient and explains concepts clearly. Highly recommend.",
    "Great teaching style. Helped me improve my grades significantly in just a few months.",
    "Very knowledgeable and always well prepared for lessons. Makes complex topics easy to understand.",
    "Good tutor but sometimes the lessons run over time. Overall a positive experience.",
    "Amazing experience. My child's confidence in the subject has improved dramatically.",
    "The tutor uses creative methods that keep students engaged. Really enjoyable classes.",
    "Professional and punctual. Provides excellent study materials and practice questions.",
    "Best tutor I've ever had. Patient with slow learners and pushes fast learners to excel.",
    "Explains difficult concepts with real-world examples. Very practical teaching approach.",
    "Consistent quality over months of tutoring. Always adapts to the student's pace.",
]

GROUP_CLASS_TITLES = [
    "O-Level Revision Bootcamp",
    "A-Level Exam Preparation",
    "Weekly Problem Solving Workshop",
    "Advanced Topics Masterclass",
    "Fundamentals Crash Course",
    "Interactive Study Group",
]

PASSWORD = "TutorPass123!"
STUDENT_PASSWORD = "StudentPass123!"

PASSWORD_HASH = hash_password(PASSWORD)
STUDENT_PASSWORD_HASH = hash_password(STUDENT_PASSWORD)


async def main():
    async with async_session_factory() as db:
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

        lk = next((c for c in countries if c.code == "LK"), countries[0])
        lk_regions = (
            await db.execute(select(Region).where(Region.country_id == lk.id))
        ).scalars().all()
        lk_cities = []
        for r in lk_regions:
            cities = (
                await db.execute(select(City).where(City.region_id == r.id))
            ).scalars().all()
            lk_cities.extend([(c, r) for c in cities])

        if not lk_cities:
            print("ERROR: No cities found for Sri Lanka")
            return

        # --- Clear existing seed data (idempotent re-runs) ---
        existing_tutors = (
            await db.execute(
                select(Account).where(
                    Account.email.like("%@example.com"),
                    Account.account_type == "tutor",
                )
            )
        ).scalars().all()

        existing_students = (
            await db.execute(
                select(Account).where(
                    Account.email.like("%@example.com"),
                    Account.account_type == "student",
                )
            )
        ).scalars().all()

        if existing_tutors or existing_students:
            print("Seed data already exists — clearing and re-seeding...")
            all_ids = [a.id for a in existing_tutors] + [a.id for a in existing_students]

            from app.models.invite import SessionInvite
            from app.models.attendance import AttendanceRecord

            for model in [
                ReviewDurationSignal, ReviewAuthorship, Review,
                AttendanceRecord, Enrolment, SessionInvite, Session,
                TutorSubject, TutorWorkingHours, TutorProfile,
                StudentProfile, ChatRoomMapping,
            ]:
                try:
                    if model == ChatRoomMapping:
                        from sqlalchemy import or_
                        rows = (await db.execute(
                            select(model).where(
                                or_(
                                    model.account_id_1.in_(all_ids),
                                    model.account_id_2.in_(all_ids),
                                )
                            )
                        )).scalars().all()
                    elif model in (Review,):
                        tutor_ids = [a.id for a in existing_tutors]
                        rows = (await db.execute(
                            select(model).where(model.tutor_id.in_(tutor_ids))
                        )).scalars().all()
                    elif model in (ReviewAuthorship, ReviewDurationSignal):
                        tutor_ids = [a.id for a in existing_tutors]
                        review_ids = (await db.execute(
                            select(Review.id).where(Review.tutor_id.in_(tutor_ids))
                        )).scalars().all()
                        if review_ids:
                            rows = (await db.execute(
                                select(model).where(model.review_id.in_(review_ids))
                            )).scalars().all()
                        else:
                            rows = []
                    elif hasattr(model, "tutor_id"):
                        tutor_ids = [a.id for a in existing_tutors]
                        rows = (await db.execute(
                            select(model).where(model.tutor_id.in_(tutor_ids))
                        )).scalars().all()
                    elif hasattr(model, "student_id"):
                        student_ids = [a.id for a in existing_students]
                        rows = (await db.execute(
                            select(model).where(model.student_id.in_(student_ids))
                        )).scalars().all()
                    elif hasattr(model, "account_id"):
                        rows = (await db.execute(
                            select(model).where(model.account_id.in_(all_ids))
                        )).scalars().all()
                    else:
                        rows = []
                    for row in rows:
                        await db.delete(row)
                except Exception:
                    pass

            for acct in existing_tutors + existing_students:
                await db.delete(acct)
            await db.flush()
            print("  Cleared old seed data")

        # --- Create tutors ---
        tutor_accounts = []
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

            for day in range(0, 6):
                start_h = random.choice([8, 9, 10])
                end_h = random.choice([16, 17, 18, 19])
                db.add(
                    TutorWorkingHours(
                        tutor_id=account.id,
                        day_of_week=day,
                        start_time=time(start_h, 0),
                        end_time=time(end_h, 0),
                        is_working=day < 5 or random.random() < 0.3,
                        timezone="Asia/Colombo",
                    )
                )

            tutor_accounts.append(account)
            print(f"  Created tutor: {t['first']} {t['last']}")

        # --- Create students ---
        student_accounts = []
        for s in STUDENTS:
            gov_id = s["nic"]
            account = Account(
                email=f"{s['first'].lower()}.{s['last'].lower()}@example.com",
                account_type="student",
                password_hash=STUDENT_PASSWORD_HASH,
                government_id_encrypted=encrypt_data(gov_id),
                government_id_hmac=compute_hmac(gov_id),
                id_country_code="LK",
                first_name=s["first"],
                last_name=s["last"],
                date_of_birth=s["dob"],
                gender=s["gender"],
                is_active=True,
                is_email_verified=True,
            )
            db.add(account)
            await db.flush()

            student_profile = StudentProfile(account_id=account.id)
            db.add(student_profile)
            await db.flush()

            student_accounts.append(account)
            print(f"  Created student: {s['first']} {s['last']}")

        # --- Create group class sessions for each tutor ---
        all_sessions = []
        now = datetime.now(timezone.utc)
        for tutor in tutor_accounts:
            num_classes = random.randint(1, 3)
            tutor_subjs = (
                await db.execute(
                    select(TutorSubject)
                    .where(TutorSubject.tutor_id == tutor.id)
                    .limit(1)
                )
            ).scalars().all()

            for c in range(num_classes):
                days_ahead = random.randint(1, 30)
                start = now + timedelta(days=days_ahead, hours=random.randint(9, 15))
                duration = random.choice([60, 90, 120])
                title_base = random.choice(GROUP_CLASS_TITLES)
                mode = random.choice(["online", "hybrid"])

                jitsi_room = None
                if mode in ("online", "hybrid"):
                    jitsi_room = f"rihla-{uuid.uuid4().hex[:8]}-{secrets.token_hex(4)}"

                session = Session(
                    tutor_id=tutor.id,
                    title=f"{title_base} — {tutor.first_name}",
                    session_type="group_class",
                    mode=mode,
                    status="active",
                    duration_minutes=duration,
                    start_time=start,
                    end_time=start + timedelta(minutes=duration),
                    max_group_size=random.choice([8, 10, 15, 20]),
                    jitsi_room_name=jitsi_room,
                )
                db.add(session)
                await db.flush()
                all_sessions.append((session, tutor))

            print(f"  Created {num_classes} group class(es) for {tutor.first_name}")

        # --- Enrol students into some sessions ---
        for student in student_accounts:
            sessions_to_join = random.sample(
                all_sessions, min(random.randint(1, 4), len(all_sessions))
            )
            for sess, _ in sessions_to_join:
                db.add(
                    Enrolment(
                        session_id=sess.id,
                        student_id=student.id,
                        status="active",
                    )
                )
        await db.flush()
        print("  Enrolled students in sessions")

        # --- Create attendance records (needed for review eligibility) ---
        from app.models.attendance import AttendanceRecord

        for student in student_accounts:
            enrolled = (
                await db.execute(
                    select(Enrolment).where(
                        Enrolment.student_id == student.id,
                        Enrolment.status == "active",
                    )
                )
            ).scalars().all()
            for enr in enrolled:
                sess = await db.get(Session, enr.session_id)
                if sess:
                    db.add(
                        AttendanceRecord(
                            session_id=sess.id,
                            student_id=student.id,
                            method="jitsi_webhook",
                            recorded_at=now - timedelta(days=random.randint(1, 30)),
                        )
                    )
        await db.flush()
        print("  Created attendance records")

        # --- Create reviews ---
        review_count = 0
        for student in student_accounts:
            enrolled = (
                await db.execute(
                    select(Enrolment).where(
                        Enrolment.student_id == student.id,
                        Enrolment.status == "active",
                    )
                )
            ).scalars().all()

            reviewed_tutor_ids: set[uuid.UUID] = set()
            for enr in enrolled:
                sess = await db.get(Session, enr.session_id)
                if not sess or sess.tutor_id in reviewed_tutor_ids:
                    continue
                if random.random() < 0.6:
                    continue

                reviewed_tutor_ids.add(sess.tutor_id)
                review = Review(
                    tutor_id=sess.tutor_id,
                    rating=random.randint(3, 5),
                    text=random.choice(REVIEW_COMMENTS),
                )
                db.add(review)
                await db.flush()

                db.add(ReviewAuthorship(
                    review_id=review.id,
                    student_id=student.id,
                    tutor_id=sess.tutor_id,
                ))
                db.add(ReviewDurationSignal(
                    review_id=review.id,
                    sessions_attended=random.randint(3, 20),
                    approximate_duration_weeks=random.randint(4, 24),
                ))
                review_count += 1

        await db.flush()
        print(f"  Created {review_count} reviews")

        await db.commit()
        print(f"\n--- Seed complete ---")
        print(f"  {len(TUTORS)} tutors (password: {PASSWORD})")
        print(f"  {len(STUDENTS)} students (password: {STUDENT_PASSWORD})")
        print(f"  {len(all_sessions)} group classes")
        print(f"  {review_count} reviews")
        print(f"\nStudent logins:")
        for s in STUDENTS:
            print(f"  {s['first'].lower()}.{s['last'].lower()}@example.com / {STUDENT_PASSWORD}")
        print(f"\nTutor logins:")
        for t in TUTORS:
            print(f"  {t['first'].lower()}.{t['last'].lower()}@example.com / {PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())
