import os
import uuid
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from database import get_db
from models import UserCreate, UserUpdate, Token, User

load_dotenv()

router = APIRouter()
security = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_EXPIRE_DAYS = int(os.getenv("JWT_EXPIRE_DAYS", "30"))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def doc_to_user(doc: dict) -> User:
    return User(
        id=doc["_id"],
        phone=doc["phone"],
        name=doc["name"],
        is_admin=doc.get("is_admin", False),
        created_at=doc["created_at"],
    )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    db = get_db()
    doc = await db.users.find_one({"_id": user_id})
    if not doc:
        raise HTTPException(status_code=401, detail="User not found")
    return doc_to_user(doc)


@router.post("/login", response_model=Token)
async def login(data: UserCreate):
    db = get_db()
    doc = await db.users.find_one({"phone": data.phone})

    if doc is None:
        last4 = data.phone[-4:]
        new_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        new_user = {
            "_id": new_id,
            "phone": data.phone,
            "name": f"User {last4}",
            "is_admin": False,
            "password": hash_password(data.password),
            "created_at": now,
        }
        await db.users.insert_one(new_user)
        doc = new_user
    else:
        if not verify_password(data.password, doc["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(doc["_id"])
    return Token(access_token=token, user=doc_to_user(doc))


@router.get("/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=User)
async def update_me(data: UserUpdate, current_user: User = Depends(get_current_user)):
    db = get_db()
    await db.users.update_one({"_id": current_user.id}, {"$set": {"name": data.name}})
    updated = await db.users.find_one({"_id": current_user.id})
    return doc_to_user(updated)
