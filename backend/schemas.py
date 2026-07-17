from pydantic import BaseModel
from typing import List, Optional


class RecipientPreview(BaseModel):
    name: str
    email: str
    valid: bool
    error: Optional[str] = None


class BulkUploadResponse(BaseModel):
    recipients: List[RecipientPreview]
    totalCount: int
    validCount: int
    invalidCount: int
    errors: List[str]


class BulkSendRequest(BaseModel):
    subject: str
    body: str
    recipients: List[str]
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None


class BulkSendResponse(BaseModel):
    sentCount: int
    failedCount: int
    failures: List[str]


class Contact(BaseModel):
    id: str
    name: str
    email: str
    ai_insights: Optional[str] = None


class ContactUpsertRequest(BaseModel):
    name: str
    email: str
    ai_insights: Optional[str] = None


class ActivityLogEntry(BaseModel):
    id: str
    recipient: str
    subject: str
    status: str
    timestamp: str
    errorMessage: Optional[str] = None


class BulkActivityRequest(BaseModel):
    recipient: str
    subject: str
    status: str
    errorMessage: Optional[str] = None


class DashboardStats(BaseModel):
    totalRecipients: int
    emailsSent: int
    pending: int
    failed: int


class CalendarEventItem(BaseModel):
    id: str
    title: str
    date: str
    time: str
    category: str
    priority: str
    sender: str
    sourceEmailId: Optional[str] = None
    sourceEmailSubject: str
    sourceEmailDate: Optional[str] = None
    description: str
    isManual: bool


class CalendarEventUpsertRequest(BaseModel):
    title: str
    date: str
    time: str
    category: str
    priority: str
    sender: str = ''
    sourceEmailId: Optional[str] = None
    sourceEmailSubject: str = ''
    sourceEmailDate: Optional[str] = None
    description: str = ''
    isManual: bool = True
