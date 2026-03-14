import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from database import get_db
from models import Event, EventCreate, EventUpdate
from routers.auth import get_current_user

router = APIRouter()


def doc_to_event(doc: dict) -> Event:
    return Event(
        id=doc["_id"],
        name=doc["name"],
        color=doc["color"],
        budget=doc.get("budget", 0),
        is_default=doc.get("is_default", False),
        created_at=doc["created_at"],
    )


@router.get("", response_model=list[Event])
async def list_events(current_user=Depends(get_current_user)):
    db = get_db()
    cursor = db.events.find({}).sort("created_at", 1)
    return [doc_to_event(doc) async for doc in cursor]


@router.post("", response_model=Event, status_code=201)
async def create_event(data: EventCreate, current_user=Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc)
    doc = {
        "_id": str(uuid.uuid4()),
        "name": data.name,
        "color": data.color,
        "budget": data.budget,
        "is_default": data.is_default,
        "created_at": now,
    }
    await db.events.insert_one(doc)
    return doc_to_event(doc)


@router.put("/{event_id}", response_model=Event)
async def update_event(event_id: str, data: EventUpdate, current_user=Depends(get_current_user)):
    db = get_db()
    doc = await db.events.find_one({"_id": event_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Event not found")

    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if updates:
        await db.events.update_one({"_id": event_id}, {"$set": updates})

    updated = await db.events.find_one({"_id": event_id})
    return doc_to_event(updated)


@router.delete("/{event_id}", status_code=204)
async def delete_event(event_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    doc = await db.events.find_one({"_id": event_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Event not found")
    if doc.get("is_default"):
        raise HTTPException(status_code=400, detail="Cannot delete a default event")

    task_count = await db.tasks.count_documents({"event_id": event_id})
    expense_count = await db.expenses.count_documents({"event_id": event_id})
    if task_count > 0 or expense_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete event with associated tasks or expenses",
        )

    await db.events.delete_one({"_id": event_id})
