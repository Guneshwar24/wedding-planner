import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from database import get_db
from models import FamilyMember, FamilyMemberCreate
from routers.auth import get_current_user

router = APIRouter()


def doc_to_member(doc: dict) -> FamilyMember:
    return FamilyMember(
        id=doc["_id"],
        name=doc["name"],
        phone=doc.get("phone"),
        created_at=doc["created_at"],
    )


@router.get("", response_model=list[FamilyMember])
async def list_members(current_user=Depends(get_current_user)):
    db = get_db()
    cursor = db.family_members.find({}).sort("created_at", 1)
    return [doc_to_member(doc) async for doc in cursor]


@router.post("", response_model=FamilyMember, status_code=201)
async def create_member(data: FamilyMemberCreate, current_user=Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc)
    doc = {
        "_id": str(uuid.uuid4()),
        "name": data.name,
        "phone": data.phone,
        "created_at": now,
    }
    await db.family_members.insert_one(doc)
    return doc_to_member(doc)


@router.delete("/{member_id}", status_code=204)
async def delete_member(member_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    doc = await db.family_members.find_one({"_id": member_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Family member not found")
    await db.family_members.delete_one({"_id": member_id})
