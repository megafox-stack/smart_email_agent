from csv import DictReader
from datetime import datetime, timedelta
from io import StringIO
import re
from re import compile as re_compile

from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from .classifier import classify_emails_payload

from .auth import create_login_url, fetch_and_store_credentials, get_stored_credentials
from .gmail_service import get_latest_emails, get_email_by_id, send_email, get_profile
from .ai_service import analyze_phishing, generate_reply,summarize_email
from .schemas import BulkUploadResponse, BulkSendRequest, BulkSendResponse, RecipientPreview
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Gmail AI Assistant", version="0.1")

# Allow local frontend to access the API during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EMAIL_REGEX = re_compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def validate_email(email: str) -> bool:
    return bool(EMAIL_REGEX.match(email.strip())) if email else False


def parse_recipients_csv(content: str) -> List[RecipientPreview]:
    reader = DictReader(StringIO(content))
    if not reader.fieldnames:
        raise ValueError("CSV file is empty or malformed. Include headers: name,email")

    headers = [field.strip().lower() for field in reader.fieldnames]
    if "email" not in headers:
        raise ValueError("CSV must include an 'email' column.")

    recipients: List[RecipientPreview] = []
    for row in reader:
        name = (row.get("name") or "").strip()
        email = (row.get("email") or "").strip()
        valid = validate_email(email)
        error = None

        if not email:
            valid = False
            error = "Missing email address"
        elif not valid:
            error = "Invalid email address"

        recipients.append(RecipientPreview(name=name, email=email, valid=valid, error=error))

    return recipients

# Minimal AI-style helpers for summary, phishing, and deadline extraction
SUSPICIOUS_KEYWORDS = [
    "urgent",
    "verify",
    "account",
    "password",
    "login",
    "bank",
    "security",
    "wire transfer",
    "payment",
    "invoice",
    "credit card",
    "confirm",
    "update",
    "expire",
    "suspend",
    "click",
    "download",
    "award",
    "winner",
    "prize",
    "free",
    "alert",
    "unauthorized",
    "risk",
    "sensitive",
]

DATE_PATTERNS = [
    r"\b(\d{4}-\d{2}-\d{2})\b",
    r"\b(\d{1,2}/\d{1,2}/\d{2,4})\b",
    r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:,\s*\d{4})?\b",
    r"\b(?:today|tomorrow|next\s+\w+|this\s+\w+)\b",
]

TIME_PATTERNS = [
    r"\b\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?\b",
    r"\b\d{1,2}\s*(?:am|pm|AM|PM)\b",
]

MONTH_NAME_MAP = {
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "sept": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12,
}


def _clean_text(text: str) -> str:
    return (text or "").strip()


def _summarize_email(subject: str, sender: str, body: str) -> str:
    subject = _clean_text(subject)
    sender = _clean_text(sender)
    body = _clean_text(body)

    try:
        summary = summarize_email(subject, sender, body)

        if summary:
            return summary.strip()

    except Exception as e:
        print(f"Ollama Error: {e}")

    # Existing rule-based summary (unchanged)
    if body:
        paragraphs = [p.strip() for p in body.split("\n") if p.strip()]
        if paragraphs:
            summary = paragraphs[0]
            if len(summary) > 240:
                summary = summary[:237] + "..."
            return summary

    if subject and sender:
        return f"Email from {sender} about '{subject}'."

    return "No summary available."


def _score_phishing(
    subject: str,
    sender: str,
    body: str,
    links: Optional[List[str]] = None
) -> dict:

    text = " ".join([subject or "", sender or "", body or ""]).lower()

    links = links or []

    score = 0
    reasons: List[str] = []

    # -----------------------------
    # Rule Engine
    # -----------------------------

    if links:
        score += min(30, 10 * len(links))
        reasons.append("Contains external link(s)")

    for keyword in SUSPICIOUS_KEYWORDS:
        if keyword in text:
            score += 8
            reasons.append(f"Contains suspicious term: '{keyword}'")

    if (
        "@gmail.com" not in sender.lower()
        and "@edu" not in sender.lower()
        and "@company" not in sender.lower()
        and sender
    ):
        if "@" in sender:
            score += 10
            reasons.append("Sender address looks unusual")

    if "unsubscribe" in body.lower() or "click here" in body.lower():
        score += 10
        reasons.append("Promotional or phishing-like wording")

    if "urgent" in subject.lower() or "action required" in subject.lower():
        score += 10
        reasons.append("Urgency detected")

    score = max(0, min(score, 100))

    if score <= 25:
        classification = "Safe"
    elif score <= 50:
        classification = "Low Risk"
    elif score <= 75:
        classification = "Medium Risk"
    else:
        classification = "High Risk"

    safe = score <= 25

    if not reasons:
        reasons.append("No obvious phishing signals detected.")

    # -----------------------------
    # AI Analysis
    # -----------------------------

    ai_analysis = ""

    try:
        ai_analysis = ai_analysis = analyze_phishing(
    subject=subject,
    sender=sender,
    body=body,
    score=score,
    classification=classification,
    reasons=reasons,
)

    except Exception as e:
        print(f"[Ollama Phishing Error] {e}")

    # -----------------------------
    # Return BOTH
    # -----------------------------

    return {
        "riskScore": score,
        "classification": classification,
        "safe": safe,
        "reasons": reasons,

        # AI Result
        "aiAnalysis": ai_analysis
    }


def _parse_date_token(token: str) -> Optional[datetime]:
    token = token.strip()
    now = datetime.now()
    lowered = token.lower()

    if lowered == "today":
        return now
    if lowered == "tomorrow":
        return now + timedelta(days=1)

    relative_match = re.match(r"next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)", lowered)
    if relative_match:
        target = relative_match.group(1)
        weekdays = {
            "monday": 0,
            "tuesday": 1,
            "wednesday": 2,
            "thursday": 3,
            "friday": 4,
            "saturday": 5,
            "sunday": 6,
        }
        target_wk = weekdays[target]
        current_wk = now.weekday()
        days_ahead = (target_wk - current_wk + 7) % 7
        if days_ahead == 0:
            days_ahead = 7
        return now + timedelta(days=days_ahead)

    this_match = re.match(r"this\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)", lowered)
    if this_match:
        target = this_match.group(1)
        weekdays = {
            "monday": 0,
            "tuesday": 1,
            "wednesday": 2,
            "thursday": 3,
            "friday": 4,
            "saturday": 5,
            "sunday": 6,
        }
        target_wk = weekdays[target]
        current_wk = now.weekday()
        days_ahead = (target_wk - current_wk + 7) % 7
        return now + timedelta(days=days_ahead)

    for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%B %d, %Y", "%B %d", "%b %d, %Y", "%b %d"]:
        try:
            parsed = datetime.strptime(token, fmt)
            if parsed.year == 1900:
                parsed = parsed.replace(year=now.year)
            return parsed
        except ValueError:
            continue

    # Try month name with day only, no year.
    bare_match = re.match(r"^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:,\s*(\d{4}))?$", token, re.IGNORECASE)
    if bare_match:
        month = MONTH_NAME_MAP[bare_match.group(1).lower()[:3]]
        day = int(bare_match.group(2))
        year = int(bare_match.group(3)) if bare_match.group(3) else now.year
        try:
            return datetime(year=year, month=month, day=day)
        except ValueError:
            return None

    return None


def _extract_deadline_items(subject: str, body: str) -> List[dict]:
    text = " ".join([subject or "", body or ""])
    found_dates: List[tuple[str, datetime]] = []
    for pattern in DATE_PATTERNS:
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            token = match.group(1) if match.groups() else match.group(0)
            parsed = _parse_date_token(token)
            if parsed:
                normalized = parsed.replace(hour=0, minute=0, second=0, microsecond=0)
                if all(normalized != existing for _, existing in found_dates):
                    found_dates.append((token, normalized))
            if len(found_dates) >= 3:
                break
        if len(found_dates) >= 3:
            break

    time_matches: List[str] = []
    for pattern in TIME_PATTERNS:
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            time_matches.append(match.group(0))
            if len(time_matches) >= 3:
                break
        if len(time_matches) >= 3:
            break

    deadlines = []
    for index, (token, parsed) in enumerate(found_dates):
        title = subject or "Deadline"
        date_label = parsed.strftime("%Y-%m-%d")
        time_label = time_matches[index] if index < len(time_matches) else ""
        remaining = (parsed.date() - datetime.now().date()).days
        priority = "High" if "urgent" in text.lower() or "asap" in text.lower() else "Medium"
        deadlines.append({
            "title": title,
            "date": date_label,
            "time": time_label,
            "remainingDays": remaining,
            "priority": priority,
        })

    return deadlines


@app.get("/")
def root() -> dict:
    """Health check endpoint."""
    return {"message": "Gmail Agent Running"}


@app.get("/login")
def login() -> RedirectResponse:
    """Begin the Google OAuth 2.0 flow by redirecting the user to Google's auth page."""
    try:
        auth_url, _ = create_login_url()
        return RedirectResponse(url=auth_url)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to start Google OAuth login flow.")

    
@app.get("/auth/callback")
def auth_callback(request: Request) -> JSONResponse:
    """Handle the OAuth callback and store credentials in memory."""
    state = request.query_params.get("state")
    if not state:
        raise HTTPException(status_code=400, detail="Missing OAuth state parameter.")

    try:
        authorization_response = str(request.url)
        credentials = fetch_and_store_credentials(authorization_response=authorization_response, state=state)
        # After successful OAuth, redirect the browser back to the frontend
        frontend_url = "http://localhost:5173/"
        return RedirectResponse(url=f"{frontend_url}?auth=success")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
     raise HTTPException(
        status_code=500,
        detail=str(exc)
    )


@app.get("/emails")
def emails() -> dict:
    """Return the latest 10 inbox emails from the authenticated Gmail account."""
    try:
        credentials = get_stored_credentials()
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    try:
        messages = get_latest_emails(credentials=credentials, max_results=10)
        return {"emails": messages}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to fetch emails: {exc}")


@app.post("/classify")
def classify_endpoint(payload: dict) -> dict:
    """Classify a list of emails. Expects `{"emails": [{id, subject, sender}, ...]}`."""
    try:
        emails = payload.get("emails", [])
        if not isinstance(emails, list):
            raise ValueError("Invalid payload: 'emails' must be a list")
        categories = classify_emails_payload(emails)
        return {"categories": categories}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/summarize")
def summarize_email(payload: dict) -> dict:
    try:
        subject = payload.get("subject", "")
        sender = payload.get("sender", "")
        body = payload.get("body", "")

        summary = _summarize_email(
            subject=subject,
            sender=sender,
            body=body,
        )

        return {
            "summary": summary
        }

    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/phishing-check")
def phishing_check(payload: dict) -> dict:
    try:
        subject = payload.get("subject", "")
        sender = payload.get("sender", "")
        body = payload.get("body", "")
        links = payload.get("links", [])

        if links is None:
            links = []

        if not isinstance(links, list):
            raise ValueError("'links' must be a list")

        result = _score_phishing(
            subject=subject,
            sender=sender,
            body=body,
            links=links,
        )

        return result

    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/extract-deadlines")
def extract_deadlines(payload: dict) -> dict:
    try:
        subject = payload.get("subject", "")
        body = payload.get("body", "")
        deadlines = _extract_deadline_items(subject=subject, body=body)
        return {"deadlines": deadlines}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/email/{message_id}")
def email_detail(message_id: str) -> dict:
    try:
        credentials = get_stored_credentials()
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    try:
        message = get_email_by_id(credentials=credentials, message_id=message_id)
        return message
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to fetch message: {exc}")


class GenerateRequest(BaseModel):
    email_id: str


@app.post("/generate-reply")
def generate_reply_endpoint(req: GenerateRequest) -> dict:
    try:
        credentials = get_stored_credentials()
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    try:
        message = get_email_by_id(credentials=credentials, message_id=req.email_id)
        draft = generate_reply(subject=message.get("subject", ""), sender=message.get("sender", ""), body=message.get("body", ""))
        return {"draft": draft}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate draft: {exc}")


class SendRequest(BaseModel):
    to: str
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None
    subject: str
    body: str
    threadId: Optional[str] = None


@app.post("/send-email")
def send_email_endpoint(req: SendRequest) -> dict:
    try:
        credentials = get_stored_credentials()
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    try:
        sent = send_email(
            credentials=credentials,
            to=req.to,
            cc=req.cc,
            bcc=req.bcc,
            subject=req.subject,
            body=req.body,
            thread_id=req.threadId,
        )
        return {"sent": sent}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {exc}")


@app.post("/bulk-email/send", response_model=BulkSendResponse)
def bulk_send_email(req: BulkSendRequest) -> dict:
    try:
        credentials = get_stored_credentials()
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    sent_count = 0
    failures: List[str] = []
    for recipient in req.recipients:
        try:
            send_email(
                credentials=credentials,
                to=recipient,
                cc=req.cc,
                bcc=req.bcc,
                subject=req.subject,
                body=req.body,
            )
            sent_count += 1
        except Exception:
            failures.append(recipient)

    return {
        "sentCount": sent_count,
        "failedCount": len(failures),
        "failures": failures,
    }


@app.post("/bulk-email/upload", response_model=BulkUploadResponse)
async def upload_bulk_email(file: UploadFile = File(...)) -> dict:
    try:
        raw_bytes = await file.read()
        content = raw_bytes.decode("utf-8", errors="replace")
        recipients = parse_recipients_csv(content)
        valid_count = sum(1 for recipient in recipients if recipient.valid)
        invalid_count = len(recipients) - valid_count

        return {
            "recipients": recipients,
            "totalCount": len(recipients),
            "validCount": valid_count,
            "invalidCount": invalid_count,
            "errors": [],
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to parse CSV upload: {exc}")


@app.get("/profile")
def profile() -> dict:
    try:
        credentials = get_stored_credentials()
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    try:
        prof = get_profile(credentials=credentials)
        return prof
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile: {exc}")
