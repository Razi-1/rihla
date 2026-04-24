#!/usr/bin/env python3
"""Import predefined subject hierarchy into the database."""
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import async_session_factory
from app.models.subject import EducationLevel, Subject, SubjectCategory, SubjectLevelAvailability


async def main():
    data_file = Path(__file__).parent.parent / "data" / "subjects.json"
    with open(data_file) as f:
        data = json.load(f)

    async with async_session_factory() as db:
        level_map = {}
        for i, level in enumerate(data.get("education_levels", [])):
            ed_level = EducationLevel(
                name=level["name"],
                display_order=i,
                min_age=level.get("min_age"),
                max_age=level.get("max_age"),
            )
            db.add(ed_level)
            await db.flush()
            level_map[level["name"]] = ed_level.id

        for i, cat_data in enumerate(data.get("categories", [])):
            category = SubjectCategory(
                name=cat_data["name"],
                display_order=i,
            )
            db.add(category)
            await db.flush()

            for j, sub_data in enumerate(cat_data.get("subjects", [])):
                subject = Subject(
                    category_id=category.id,
                    name=sub_data["name"],
                    display_order=j,
                )
                db.add(subject)
                await db.flush()

                for level_name in sub_data.get("levels", []):
                    if level_name in level_map:
                        db.add(
                            SubjectLevelAvailability(
                                subject_id=subject.id,
                                education_level_id=level_map[level_name],
                            )
                        )

        await db.commit()
        print("Subjects imported successfully")


if __name__ == "__main__":
    asyncio.run(main())
