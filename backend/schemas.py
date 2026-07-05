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
