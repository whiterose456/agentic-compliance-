from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services.rules import get_active_rules

router = APIRouter()


@router.get("/health")
def health(request: Request) -> dict:
    agent = request.app.state.agent
    return {"status": "ok", "provider": request.app.state.settings.llm_provider,
            "model_id": agent.model_id}


@router.get("/rules")
def rules() -> list[dict]:
    return get_active_rules("GENERAL")


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest, request: Request) -> AnalyzeResponse:
    agent = request.app.state.agent
    settings = request.app.state.settings
    cache = request.app.state.cache
    key = cache.make_key(payload.document_id, payload.text, settings.prompt_version, agent.model_id)
    cached = cache.get(key)
    if cached is not None:
        cached["cache_hit"] = True
        return AnalyzeResponse(**cached)

    try:
        findings, discarded, section_count = agent.analyze(payload.text, payload.document_type)
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail="Inspection provider failed; no decision was made."
        ) from exc

    result = AnalyzeResponse(
        document_id=payload.document_id, findings=findings, discarded_findings=discarded,
        sections_analyzed=section_count, cache_hit=False, human_review_required=True,
        decision="PENDING_HUMAN_REVIEW", model_id=agent.model_id,
        prompt_version=settings.prompt_version,
    )
    cache.set(key, result.model_dump())
    return result
