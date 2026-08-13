
Smart Email Automation Agent

An email automation system for IPW that processes incoming emails, classifies them, and performs automated actions to reduce manual workload.

Features

- Automatic email retrieval and processing
- Email classification based on content and intent
- Rule-based and AI-assisted analysis using Ollama models
- Automated responses for supported cases
- Information extraction from emails
- Extensible automation rules
- Bulk email processing and campaign handling
- Smart calendar integration for scheduling and event management

Tech Stack

- Python
- Email API / SMTP
- Ollama (local LLM) / NLP
- JSON-based configuration
- smart calander
- Git & GitHub

Workflow

Incoming emails are processed through the following pipeline:

Email retrieval → Content extraction → Analysis → Classification → Action selection → Automated response or task execution → Calendar event creation (if required)

Project Structure

- main.py — Entry point
- email_handler.py — Email retrieval and handling
- ai_model.py — Ollama-based AI/NLP processing
- automation.py — Automation logic and actions
- calendar_manager.py — Smart calendar scheduling and event handling
- config.py — Configuration management
- requirements.txt — Dependencies
- .env — Environment variables

Installation

Clone the repository

git clone <your-repository-url>
cd smart-email-automation-bot

Create virtual environment

python -m venv venv

Activate it:

Windows

venv\Scripts\activate

Linux/macOS

source venv/bin/activate

Install dependencies

pip install -r requirements.txt

Configure environment variables

Create a ".env" file:

EMAIL_ADDRESS=your_email@example.com
EMAIL_PASSWORD=your_password
API_KEY=your_api_key
CALENDAR_API_KEY=your_calendar_api_key

Do not commit sensitive credentials to version control.

Running the Application

python main.py

The system will connect to the email service, process incoming messages, execute configured automation workflows, and manage calendar events when required.

Use Cases

- Automated replies to common queries
- Email categorization and prioritization
- Bulk email sending for campaigns and announcements
- Extracting structured data from messages
- Forwarding or routing emails based on rules
- AI-assisted response generation using Ollama models
- Flagging emails requiring human review
- Smart scheduling of meetings and events from email content
- Calendar-based reminders and follow-ups

Future Improvements

- Gmail and Outlook integration
- Improved AI classification models with Ollama fine-tuning
- Email summarization
- Dashboard for monitoring activity
- Database integration for persistence
- Logging and analytics system
- Human approval workflow for responses
- Multi-account support
- Advanced bulk email personalization and analytics
- AI-powered smart scheduling optimization

Security

All credentials must be stored in environment variables or a secure secrets manager. Never hard-code sensitive data or expose it in public repositories.

Project Objective

This project demonstrates how Python, Ollama-based AI models, email APIs, and calendar systems can be combined to automate communication workflows, bulk outreach, and scheduling while maintaining human oversight for critical decisions.

Author

Archit Naik
IPW Project