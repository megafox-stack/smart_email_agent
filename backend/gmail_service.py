from typing import Dict, List, Optional

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2.credentials import Credentials
import base64
from email.message import EmailMessage
from typing import Any


def build_gmail_service(credentials: Credentials):
    """Build and return a Gmail API client."""
    return build("gmail", "v1", credentials=credentials)


def _extract_header(headers: List[Dict[str, str]], name: str) -> Optional[str]:
    for header in headers:
        if header.get("name", "").lower() == name.lower():
            return header.get("value")
    return None


def get_latest_emails(credentials: Credentials, max_results: int = 10) -> List[Dict[str, str]]:
    """Fetch the latest inbox emails and return structured metadata."""
    service = build_gmail_service(credentials=credentials)
    try:
        response = (
            service.users()
            .messages()
            .list(userId="me", labelIds=["INBOX"], maxResults=max_results)
            .execute()
        )
        messages = response.get("messages", [])

        emails = []
        for message in messages:
            message_id = message.get("id")
            if not message_id:
                continue

            message_data = (
                service.users()
                .messages()
                .get(
                    userId="me",
                    id=message_id,
                    format="metadata",
                    metadataHeaders=["Subject", "From", "Date"],
                )
                .execute()
            )

            headers = message_data.get("payload", {}).get("headers", [])
            emails.append(
                {
                    "id": message_id,
                    "subject": _extract_header(headers, "Subject") or "(No Subject)",
                    "sender": _extract_header(headers, "From") or "(Unknown Sender)",
                    "date": _extract_header(headers, "Date") or "(Unknown Date)",
                }
            )

        return emails
    except HttpError as exc:
        raise RuntimeError(f"Gmail API error: {exc}") from exc
    except Exception as exc:
        raise RuntimeError(f"Unexpected error reading Gmail inbox: {exc}") from exc


def _get_message_body(payload: Dict[str, Any]) -> str:
    # Walk the payload to extract the most appropriate text body
    if not payload:
        return ""

    # If simple body
    body = payload.get("body", {}).get("data")
    if body:
        try:
            decoded = base64.urlsafe_b64decode(body + "===").decode("utf-8", errors="ignore")
            return decoded
        except Exception:
            return ""

    parts = payload.get("parts") or []
    for part in parts:
        mime = part.get("mimeType", "")
        if mime.startswith("text/"):
            data = part.get("body", {}).get("data")
            if data:
                try:
                    return base64.urlsafe_b64decode(data + "===").decode("utf-8", errors="ignore")
                except Exception:
                    continue

    # Fallback: try nested parts
    for part in parts:
        sub = part.get("parts") or []
        for sp in sub:
            mime = sp.get("mimeType", "")
            if mime.startswith("text/"):
                data = sp.get("body", {}).get("data")
                if data:
                    try:
                        return base64.urlsafe_b64decode(data + "===").decode("utf-8", errors="ignore")
                    except Exception:
                        continue

    return ""


def get_email_by_id(credentials: Credentials, message_id: str) -> Dict[str, Any]:
    """Fetch a full email by ID including body and threadId."""
    service = build_gmail_service(credentials=credentials)
    try:
        message = service.users().messages().get(userId="me", id=message_id, format="full").execute()
        payload = message.get("payload", {})
        headers = payload.get("headers", [])

        subject = _extract_header(headers, "Subject") or "(No Subject)"
        sender = _extract_header(headers, "From") or "(Unknown Sender)"
        date = _extract_header(headers, "Date") or "(Unknown Date)"
        thread_id = message.get("threadId")
        body = _get_message_body(payload)

        return {
            "id": message_id,
            "subject": subject,
            "sender": sender,
            "date": date,
            "body": body,
            "threadId": thread_id,
        }
    except HttpError as exc:
        raise RuntimeError(f"Gmail API error: {exc}") from exc
    except Exception as exc:
        raise RuntimeError(f"Unexpected error reading Gmail message: {exc}") from exc


def send_email(
    credentials: Credentials,
    to: str,
    subject: str,
    body: str,
    cc: Optional[List[str]] = None,
    bcc: Optional[List[str]] = None,
    thread_id: str | None = None,
) -> Dict[str, Any]:
    """Send an email using the Gmail API. Returns the API response."""
    service = build_gmail_service(credentials=credentials)
    try:
        msg = EmailMessage()
        msg['To'] = to
        if cc:
            msg['Cc'] = ', '.join(cc)
        if bcc:
            msg['Bcc'] = ', '.join(bcc)
        msg['Subject'] = subject
        msg.set_content(body)

        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()

        message_body = {"raw": raw}
        if thread_id:
            message_body["threadId"] = thread_id

        sent = service.users().messages().send(userId="me", body=message_body).execute()
        return sent
    except HttpError as exc:
        raise RuntimeError(f"Gmail API error when sending: {exc}") from exc
    except Exception as exc:
        raise RuntimeError(f"Unexpected error sending Gmail message: {exc}") from exc


def get_profile(credentials: Credentials) -> Dict[str, str]:
    """Return simple profile info (email address) for the authenticated user."""
    service = build_gmail_service(credentials=credentials)
    try:
        profile = service.users().getProfile(userId="me").execute()
        email = profile.get("emailAddress")
        return {"email": email}
    except HttpError as exc:
        raise RuntimeError(f"Gmail API error when fetching profile: {exc}") from exc
    except Exception as exc:
        raise RuntimeError(f"Unexpected error fetching profile: {exc}") from exc
