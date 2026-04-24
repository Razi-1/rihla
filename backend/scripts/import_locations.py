#!/usr/bin/env python3
"""Import location data (countries, regions, cities)."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import async_session_factory
from app.models.location import City, Country, Region

COUNTRIES = [
    {"code": "LK", "name": "Sri Lanka"},
    {"code": "PK", "name": "Pakistan"},
    {"code": "IN", "name": "India"},
    {"code": "GB", "name": "United Kingdom"},
    {"code": "US", "name": "United States"},
    {"code": "AE", "name": "United Arab Emirates"},
    {"code": "AU", "name": "Australia"},
    {"code": "CA", "name": "Canada"},
    {"code": "MY", "name": "Malaysia"},
    {"code": "SG", "name": "Singapore"},
]

REGIONS = {
    "LK": [
        {"code": "WP", "name": "Western Province", "cities": ["Colombo", "Dehiwala-Mount Lavinia", "Sri Jayawardenepura Kotte", "Negombo", "Moratuwa"]},
        {"code": "CP", "name": "Central Province", "cities": ["Kandy", "Matale", "Nuwara Eliya"]},
        {"code": "SP", "name": "Southern Province", "cities": ["Galle", "Matara", "Hambantota"]},
        {"code": "NP", "name": "Northern Province", "cities": ["Jaffna", "Kilinochchi"]},
        {"code": "EP", "name": "Eastern Province", "cities": ["Trincomalee", "Batticaloa"]},
    ],
    "PK": [
        {"code": "PB", "name": "Punjab", "cities": ["Lahore", "Rawalpindi", "Faisalabad", "Multan"]},
        {"code": "SD", "name": "Sindh", "cities": ["Karachi", "Hyderabad", "Sukkur"]},
        {"code": "KP", "name": "Khyber Pakhtunkhwa", "cities": ["Peshawar", "Mardan"]},
        {"code": "IS", "name": "Islamabad Capital Territory", "cities": ["Islamabad"]},
    ],
}


async def main():
    async with async_session_factory() as db:
        for c_data in COUNTRIES:
            country = Country(code=c_data["code"], name=c_data["name"])
            db.add(country)
            await db.flush()

            for r_data in REGIONS.get(c_data["code"], []):
                region = Region(
                    country_id=country.id,
                    code=r_data["code"],
                    name=r_data["name"],
                )
                db.add(region)
                await db.flush()

                for city_name in r_data.get("cities", []):
                    db.add(City(region_id=region.id, name=city_name))

        await db.commit()
        print("Locations imported successfully")


if __name__ == "__main__":
    asyncio.run(main())
