import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from database import get_db
from models import Task, TaskCreate, TaskUpdate
from routers.auth import get_current_user

router = APIRouter()


def doc_to_task(doc: dict) -> Task:
    return Task(
        id=doc["_id"],
        name=doc["name"],
        event_id=doc["event_id"],
        assigned_to=doc.get("assigned_to"),
        deadline=doc.get("deadline"),
        notes=doc.get("notes"),
        status=doc.get("status", "pending"),
        created_at=doc["created_at"],
    )


@router.get("", response_model=list[Task])
async def list_tasks(
    event_id: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user=Depends(get_current_user),
):
    db = get_db()
    query = {}
    if event_id:
        query["event_id"] = event_id
    if assigned_to:
        query["assigned_to"] = assigned_to
    if status:
        query["status"] = status

    cursor = db.tasks.find(query).sort("created_at", -1)
    return [doc_to_task(doc) async for doc in cursor]


@router.post("", response_model=Task, status_code=201)
async def create_task(data: TaskCreate, current_user=Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc)
    doc = {
        "_id": str(uuid.uuid4()),
        "name": data.name,
        "event_id": data.event_id,
        "assigned_to": data.assigned_to,
        "deadline": data.deadline,
        "notes": data.notes,
        "status": data.status,
        "created_at": now,
    }
    await db.tasks.insert_one(doc)
    return doc_to_task(doc)


@router.put("/{task_id}", response_model=Task)
async def update_task(task_id: str, data: TaskUpdate, current_user=Depends(get_current_user)):
    db = get_db()
    doc = await db.tasks.find_one({"_id": task_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Task not found")

    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if updates:
        await db.tasks.update_one({"_id": task_id}, {"$set": updates})

    updated = await db.tasks.find_one({"_id": task_id})
    return doc_to_task(updated)


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    doc = await db.tasks.find_one({"_id": task_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.tasks.delete_one({"_id": task_id})
