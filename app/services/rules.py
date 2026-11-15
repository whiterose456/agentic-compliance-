import json
from functools import lru_cache
from pathlib import Path
from typing import Any

RULES_PATH = Path(__file__).resolve().parents[1] / "data" / "mock_rules.json"


@lru_cache
def load_rules() -> tuple[dict[str, Any], ...]:
    with RULES_PATH.open(encoding="utf-8") as file:
        return tuple(json.load(file))


def get_active_rules(document_type: str) -> list[dict[str, Any]]:
    normalized = document_type.upper()
    return [rule for rule in load_rules() if rule["active"] and (
        normalized == "GENERAL" or normalized in rule["document_types"]
    )]


def get_rule(rule_id: str) -> dict[str, Any] | None:
    return next((r for r in load_rules() if r["rule_id"] == rule_id and r["active"]), None)
