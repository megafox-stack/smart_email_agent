import httpx

OLLAMA_URL = "http://127.0.0.1:11434"
MODEL = "llama3.2:3b"


def _generate(prompt: str) -> str:
    """
    Generic helper to send a prompt to Ollama and return the response.
    """

    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_predict": 512
        }
    }

    with httpx.Client(base_url=OLLAMA_URL, timeout=60.0) as client:
        response = client.post("/api/generate", json=payload)
        response.raise_for_status()
        data = response.json()

    return data.get("response", "").strip()


# ==========================================================
# AI EMAIL REPLY
# ==========================================================

def generate_reply(subject: str, sender: str, body: str) -> str:
    sender_name = sender.split("<")[0].strip() if "<" in sender else sender

    prompt = f"""
You are an AI email assistant.

Write a professional and concise reply.

Sender:
{sender_name}

Subject:
{subject}

Email:
{body}

Requirements:
- Be polite
- Answer any request if possible
- Keep it concise
- Close professionally

Return ONLY the reply.
"""

    return _generate(prompt)


# ==========================================================
# AI EMAIL SUMMARIZATION
# ==========================================================

def summarize_email(subject: str, sender: str, body: str) -> str:
    sender_name = sender.split("<")[0].strip() if "<" in sender else sender

    prompt = f"""
You are an email summarization assistant.

Summarize the following email.

Include:

• Main purpose

• Important information

• Deadlines

• Action items

Subject:
{subject}

Sender:
{sender_name}

Email:
{body}

Return the summary as bullet points.
"""

    return _generate(prompt)


# ==========================================================
# AI PHISHING ANALYSIS
# ==========================================================

def analyze_phishing(
    subject: str,
    sender: str,
    body: str,
    score: int,
    classification: str,
    reasons: list[str],
) -> str:

    prompt = f"""
You are an email security assistant.

A rule-based phishing engine has already analyzed this email.

Rule Engine Results:

Risk Score: {score}
Classification: {classification}

Detected Reasons:
{chr(10).join("- " + r for r in reasons)}

Email Details

Subject:
{subject}

Sender:
{sender}

Body:
{body}

Write a short AI verdict that:

• Explains why the email received this score.
• Mentions whether the sender appears trustworthy.
• Mentions suspicious wording if present.
• Gives one recommendation.

Keep it under 120 words.

Do NOT recalculate the score.
Do NOT change the classification.
"""

    return _generate(prompt)


# ==========================================================
# AI SUBJECT GENERATOR (Optional)
# ==========================================================

def generate_subject(body: str) -> str:
    prompt = f"""
Generate a concise and professional email subject line.

Email:

{body}

Return ONLY the subject.
"""

    return _generate(prompt)


# ==========================================================
# AI TONE REWRITER (Optional)
# ==========================================================

def rewrite_email(body: str, tone: str = "Professional") -> str:
    prompt = f"""
Rewrite the following email.

Tone:
{tone}

Email:
{body}

Keep the meaning the same.

Return ONLY the rewritten email.
"""

    return _generate(prompt)


def generate_contact_insights(name: str, email: str, context: str = "") -> str:
    prompt = f"""
You are an assistant that writes concise AI contact notes for a contact in an address book.

Contact name: {name}
Contact email: {email}

Context: {context}

Write 3 short bullet points (one sentence each) with helpful insights about this contact: who they are, typical topics, and suggested follow-ups.
Keep it under 100 words. Return ONLY the bullet points.
"""

    return _generate(prompt)
