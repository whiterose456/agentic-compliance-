from app.models.schemas import CandidateFinding, ValidatedFinding
from app.services.rules import get_rule


def validate_findings(
    candidates: list[CandidateFinding], original_text: str
) -> tuple[list[ValidatedFinding], int]:
    """Only active rules and exact source quotes survive; offsets use original-text indices."""
    accepted: list[ValidatedFinding] = []
    discarded = 0
    seen: set[tuple[str, int, int]] = set()

    for candidate in candidates:
        rule = get_rule(candidate.rule_id)
        if rule is None or not candidate.passage:
            discarded += 1
            continue
        start = original_text.find(candidate.passage)
        if start < 0:
            discarded += 1
            continue
        end = start + len(candidate.passage)
        identity = (candidate.rule_id, start, end)
        if identity in seen:
            discarded += 1
            continue
        seen.add(identity)
        accepted.append(ValidatedFinding(
            rule_id=rule["rule_id"],
            rule_title=rule["title"],
            passage=candidate.passage,
            reason=candidate.reason[:500],
            severity=rule["severity"],
            start=start,
            end=end,
        ))
    return accepted, discarded
