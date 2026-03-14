from fastapi import APIRouter, Depends
from database import get_db
from routers.auth import get_current_user

router = APIRouter()


@router.get("/summary")
async def get_summary(current_user=Depends(get_current_user)):
    db = get_db()

    # Task counts
    pending = await db.tasks.count_documents({"status": "pending"})
    in_progress = await db.tasks.count_documents({"status": "in_progress"})
    done = await db.tasks.count_documents({"status": "done"})
    total = pending + in_progress + done

    # Upcoming tasks: non-null deadlines, closest first, top 5
    upcoming_cursor = (
        db.tasks.find({"deadline": {"$ne": None, "$exists": True}})
        .sort("deadline", 1)
        .limit(5)
    )
    upcoming_tasks = []
    async for doc in upcoming_cursor:
        upcoming_tasks.append({
            "id": doc["_id"],
            "name": doc["name"],
            "event_id": doc["event_id"],
            "assigned_to": doc.get("assigned_to"),
            "deadline": doc.get("deadline"),
            "status": doc.get("status", "pending"),
        })

    # Budget summary per event
    events_cursor = db.events.find({}).sort("created_at", 1)
    budget_summary = []
    async for event in events_cursor:
        event_id = event["_id"]
        spent_result = await db.expenses.aggregate([
            {"$match": {"event_id": event_id}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]).to_list(1)
        spent = spent_result[0]["total"] if spent_result else 0
        budget_summary.append({
            "event_id": event_id,
            "event_name": event["name"],
            "color": event["color"],
            "budget": event.get("budget", 0),
            "spent": spent,
        })

    return {
        "task_counts": {
            "pending": pending,
            "in_progress": in_progress,
            "done": done,
            "total": total,
        },
        "upcoming_tasks": upcoming_tasks,
        "budget_summary": budget_summary,
    }
