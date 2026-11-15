import hashlib
import json
import time
from typing import Any


class AnalysisCache:
    """Process-local TTL cache; replace with Redis for multi-worker deployments."""

    def __init__(self, ttl_seconds: int = 300) -> None:
        self.ttl_seconds = ttl_seconds
        self._items: dict[str, tuple[float, dict[str, Any]]] = {}

    @staticmethod
    def make_key(document_id: str, text: str, prompt_version: str, model_id: str) -> str:
        digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
        raw = json.dumps([document_id, digest, prompt_version, model_id])
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def get(self, key: str) -> dict[str, Any] | None:
        item = self._items.get(key)
        if item is None:
            return None
        expires_at, value = item
        if expires_at <= time.monotonic():
            self._items.pop(key, None)
            return None
        return value.copy()

    def set(self, key: str, value: dict[str, Any]) -> None:
        self._items[key] = (time.monotonic() + self.ttl_seconds, value.copy())
