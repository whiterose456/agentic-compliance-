from typing import Literal

from pydantic import BaseModel, Field

Severity = Literal["low", "medium", "high", "critical"]


class AnalyzeRequest(BaseModel):
    document_id: str = Field(min_length=1, max_length=200)
    document_type: str = Field(default="GENERAL", min_length=1, max_length=80)
    text: str = Field(min_length=1, max_length=500_000)


class CandidateFinding(BaseModel):
    rule_id: str
    passage: str
    reason: str


class ValidatedFinding(BaseModel):
    rule_id: str
    rule_title: str
    passage: str
    reason: str
    severity: Severity
    start: int
    end: int


class AnalyzeResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    document_id: str
    findings: list[ValidatedFinding]
    discarded_findings: int
    sections_analyzed: int
    cache_hit: bool = False
    human_review_required: bool = True
    decision: Literal["PENDING_HUMAN_REVIEW"] = "PENDING_HUMAN_REVIEW"
    model_id: str
    prompt_version: str
