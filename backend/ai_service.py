import httpx

OLLAMA_URL = "http://127.0.0.1:11434"
MODEL = "llama2"


def generate_reply(subject: str, sender: str, body: str) -> str:
    """Generate a reply draft given an email's subject, sender and body.

    This function uses a local Ollama server to generate the message.
    """
    sender_name = sender.split("<")[0].strip() if "<" in sender else sender
    prompt = (
        "You are an AI assistant that writes professional and helpful Gmail replies.\n\n"
        f"Sender: {sender_name}\n"
        f"Subject: {subject}\n"
        "Original message:\n"
        f"{body}\n\n"
        "Write a concise response that acknowledges the sender, answers any implied request, and closes professionally."
    )

    payload = {
        "model": MODEL,
        "prompt": prompt,
        "temperature": 0.2,
        "max_length": 512,
    }

    with httpx.Client(base_url=OLLAMA_URL, timeout=60.0) as client:
        response = client.post("/api/prompt", json=payload)
        response.raise_for_status()
        data = response.json()

    return data.get("response", "").strip()
