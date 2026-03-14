from pydantic import BaseModel
from pydantic.config import ConfigDict
from typing import Optional
from datetime import datetime


class User(BaseModel):
    id: str
    phone: str
    name: str
    is_admin: bool = False
    created_at: datetime

    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})


class UserCreate(BaseModel):
    phone: str
    password: str


class UserUpdate(BaseModel):
    name: str


class Event(BaseModel):
    id: str
    name: str
    color: str
    budget: float = 0
    is_default: bool = False
    created_at: datetime

    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})


class EventCreate(BaseModel):
    name: str
    color: str
    budget: float = 0
    is_default: bool = False


class EventUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    budget: Optional[float] = None


class FamilyMember(BaseModel):
    id: str
    name: str
    phone: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})


class FamilyMemberCreate(BaseModel):
    name: str
    phone: Optional[str] = None


class Task(BaseModel):
    id: str
    name: str
    event_id: str
    assigned_to: Optional[str] = None
    deadline: Optional[str] = None
    notes: Optional[str] = None
    status: str = "pending"
    created_at: datetime

    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})


class TaskCreate(BaseModel):
    name: str
    event_id: str
    assigned_to: Optional[str] = None
    deadline: Optional[str] = None
    notes: Optional[str] = None
    status: str = "pending"


class TaskUpdate(BaseModel):
    name: Optional[str] = None
    event_id: Optional[str] = None
    assigned_to: Optional[str] = None
    deadline: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class Expense(BaseModel):
    id: str
    name: str
    amount: float
    event_id: str
    paid_by: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})


class ExpenseCreate(BaseModel):
    name: str
    amount: float
    event_id: str
    paid_by: Optional[str] = None
    comment: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User
