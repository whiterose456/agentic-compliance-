from app.models.schemas import CandidateFinding
from app.services.validator import validate_findings


def test_validator_accepts_exact_quote_and_computes_offsets():
    source = "Intro. We guarantee a 15% annual return. End."
    quote = "We guarantee a 15% annual return."
    accepted, discarded = validate_findings(
        [CandidateFinding(rule_id="RULE-001", passage=quote, reason="Guarantee claim.")],
        source,
    )
    assert discarded == 0
    assert len(accepted) == 1
    assert source[accepted[0].start:accepted[0].end] == quote
    assert accepted[0].severity == "critical"


def test_validator_discards_hallucinated_quote_and_unknown_rule():
    source = "A normal investment description."
    candidates = [
        CandidateFinding(rule_id="RULE-001", passage="We guarantee 99% return.", reason="bad"),
        CandidateFinding(rule_id="NOT-A-RULE", passage=source, reason="bad"),
    ]
    accepted, discarded = validate_findings(candidates, source)
    assert accepted == []
    assert discarded == 2


def test_validator_uses_rule_severity_not_model_severity():
    source = "We guarantee a 15% annual return."
    candidate = CandidateFinding(rule_id="RULE-001", passage=source, reason="Claim.")
    accepted, _ = validate_findings([candidate], source)
    assert accepted[0].severity == "critical"
