"""
Shared JSON storage helpers.
All route modules import load_json / save_json from here so the
file-path and error-handling logic lives in exactly one place.
"""

import json
import os


def load_json(filepath: str) -> list:
    """Load a JSON array from *filepath*. Returns [] if the file does not
    exist or is corrupt/empty."""
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def save_json(filepath: str, data) -> None:
    """Serialize *data* to *filepath*, creating parent directories as needed."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
