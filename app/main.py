from fastapi import FastAPI

from app.api.routes import router
from app.core.config import get_settings
from app.services.agent import ComplianceInspectionAgent
from app.services.cache import AnalysisCache


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Agentic Compliance Inspection Agent",
        description="Service 2 (AI-2): grounded document inspection. Human review is required.",
        version="0.1.0",
    )
    app.state.settings = settings
    app.state.agent = ComplianceInspectionAgent(settings)
    app.state.cache = AnalysisCache(settings.cache_ttl_seconds)
    app.include_router(router)
    return app


app = create_app()
