import asyncio
from datetime import datetime, timezone
from database import connect_db, get_db
from seed_data import DEFAULT_EVENTS, DEFAULT_FAMILY_MEMBERS


async def seed():
    await connect_db()
    db = get_db()
    now = datetime.now(timezone.utc)

    event_count = await db.events.count_documents({})
    if event_count == 0:
        for event in DEFAULT_EVENTS:
            await db.events.insert_one({**event, "created_at": now})
        print(f"Seeded {len(DEFAULT_EVENTS)} events.")

    member_count = await db.family_members.count_documents({})
    if member_count == 0:
        for member in DEFAULT_FAMILY_MEMBERS:
            await db.family_members.insert_one({**member, "created_at": now})
        print(f"Seeded {len(DEFAULT_FAMILY_MEMBERS)} family members.")


if __name__ == "__main__":
    asyncio.run(seed())
