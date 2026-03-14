import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from database import get_db
from models import Expense, ExpenseCreate
from routers.auth import get_current_user

router = APIRouter()


def doc_to_expense(doc: dict) -> Expense:
    return Expense(
        id=doc["_id"],
        name=doc["name"],
        amount=doc["amount"],
        event_id=doc["event_id"],
        paid_by=doc.get("paid_by"),
        comment=doc.get("comment"),
        created_at=doc["created_at"],
    )


@router.get("", response_model=list[Expense])
async def list_expenses(
    event_id: Optional[str] = Query(None),
    paid_by: Optional[str] = Query(None),
    current_user=Depends(get_current_user),
):
    db = get_db()
    query = {}
    if event_id:
        query["event_id"] = event_id
    if paid_by:
        query["paid_by"] = paid_by

    cursor = db.expenses.find(query).sort("created_at", -1)
    return [doc_to_expense(doc) async for doc in cursor]


@router.post("", response_model=Expense, status_code=201)
async def create_expense(data: ExpenseCreate, current_user=Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc)
    doc = {
        "_id": str(uuid.uuid4()),
        "name": data.name,
        "amount": data.amount,
        "event_id": data.event_id,
        "paid_by": data.paid_by,
        "comment": data.comment,
        "created_at": now,
    }
    await db.expenses.insert_one(doc)
    return doc_to_expense(doc)


@router.delete("/{expense_id}", status_code=204)
async def delete_expense(expense_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    doc = await db.expenses.find_one({"_id": expense_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Expense not found")
    await db.expenses.delete_one({"_id": expense_id})
