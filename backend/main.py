from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from database import connect_db, close_db, get_db
from seed_data import DEFAULT_EVENTS, DEFAULT_FAMILY_MEMBERS
from routers import auth, events, family_members, tasks, expenses, dashboard


async def run_seed():
    db = get_db()
    now = datetime.now(timezone.utc)

    if await db.events.count_documents({}) == 0:
        for event in DEFAULT_EVENTS:
            await db.events.insert_one({**event, "created_at": now})

    if await db.family_members.count_documents({}) == 0:
        for member in DEFAULT_FAMILY_MEMBERS:
            await db.family_members.insert_one({**member, "created_at": now})


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    await run_seed()
    yield
    await close_db()


app = FastAPI(title="Shaadi Brain API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,           prefix="/api/auth",           tags=["auth"])
app.include_router(events.router,         prefix="/api/events",         tags=["events"])
app.include_router(family_members.router, prefix="/api/family-members", tags=["family-members"])
app.include_router(tasks.router,          prefix="/api/tasks",          tags=["tasks"])
app.include_router(expenses.router,       prefix="/api/expenses",       tags=["expenses"])
app.include_router(dashboard.router,      prefix="/api/dashboard",      tags=["dashboard"])
