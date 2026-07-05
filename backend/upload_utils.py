import json
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)


def save_upload(file_name: str, contents: bytes) -> str:
    path = UPLOAD_DIR / file_name
    with path.open('wb') as handle:
        handle.write(contents)
    return str(path)


def allowed_file_type(filename: str) -> bool:
    allowed_extensions = {'.pdf', '.docx', '.pptx', '.jpg', '.jpeg', '.png', '.gif', '.zip'}
    return Path(filename).suffix.lower() in allowed_extensions


def validate_max_size(file_size: int, max_size: int = 10 * 1024 * 1024) -> bool:
    return file_size <= max_size
