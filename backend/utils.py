import json
from pathlib import Path
from threading import Lock
from typing import Any

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / 'data'
DATA_DIR.mkdir(exist_ok=True)

_history_path = DATA_DIR / 'history.json'
_templates_path = DATA_DIR / 'templates.json'

_lock = Lock()


def read_json_file(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        with path.open('r', encoding='utf-8') as handle:
            return json.load(handle)
    except json.JSONDecodeError:
        return default


def write_json_file(path: Path, value: Any) -> None:
    with _lock:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open('w', encoding='utf-8') as handle:
            json.dump(value, handle, indent=2)


def load_history() -> list[dict[str, Any]]:
    return read_json_file(_history_path, [])


def save_history(history: list[dict[str, Any]]) -> None:
    write_json_file(_history_path, history)


def load_templates() -> list[dict[str, Any]]:
    return read_json_file(_templates_path, [])


def save_templates(templates: list[dict[str, Any]]) -> None:
    write_json_file(_templates_path, templates)
