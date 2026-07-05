import os

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

from pathlib import Path
from typing import Dict, Optional

from dotenv import load_dotenv
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow

BASE_DIR = Path(__file__).resolve().parent
SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
]
CLIENT_SECRETS_FILE = BASE_DIR / "credentials.json"
OAUTH_STATE_STORE: Dict[str, Flow] = {}
STORED_CREDENTIALS: Optional[Credentials] = None

load_dotenv(BASE_DIR / ".env")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
REDIRECT_PATH = os.getenv("REDIRECT_PATH", "/auth/callback")
REDIRECT_URI = f"{BASE_URL.rstrip('/')}" + REDIRECT_PATH
print(f"Using redirect URI: {REDIRECT_URI}")


def load_client_secrets() -> Path:
    """Validate that credentials.json exists and return its path."""
    if not CLIENT_SECRETS_FILE.exists():
        raise FileNotFoundError(
            "Missing credentials.json. Copy your Google OAuth credentials into backend/credentials.json."
        )
    return CLIENT_SECRETS_FILE


def create_oauth_flow() -> Flow:
    """Create a new OAuth 2.0 flow using client secrets and redirect URI."""
    client_secrets = load_client_secrets()
    return Flow.from_client_secrets_file(
        str(client_secrets), scopes=SCOPES, redirect_uri=REDIRECT_URI
    )


def create_login_url() -> tuple[str, str]:
    """Generate the Google OAuth login URL and store the Flow for callback verification."""
    flow = create_oauth_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    OAUTH_STATE_STORE[state] = flow
    return auth_url, state


def fetch_and_store_credentials(authorization_response: str, state: str) -> Credentials:
    """Exchange the authorization code for credentials and keep them in memory."""
    if state not in OAUTH_STATE_STORE:
        raise ValueError("Invalid or expired OAuth state. Please retry login.")

    flow = OAUTH_STATE_STORE.pop(state)
    flow.fetch_token(authorization_response=authorization_response)
    credentials = flow.credentials
    if not credentials:
        raise ValueError("Google OAuth did not return credentials.")

    if credentials.expired and credentials.refresh_token:
        credentials.refresh(GoogleRequest())

    global STORED_CREDENTIALS
    STORED_CREDENTIALS = credentials
    return credentials


def get_stored_credentials() -> Credentials:
    """Return stored credentials, raising an error if the user is not authenticated."""
    global STORED_CREDENTIALS
    if not STORED_CREDENTIALS:
        raise ValueError("No stored Google credentials. Please authenticate at /login.")

    if STORED_CREDENTIALS.expired and STORED_CREDENTIALS.refresh_token:
        STORED_CREDENTIALS.refresh(GoogleRequest())

    return STORED_CREDENTIALS
