from app.core.config import Settings
from app.models.schemas import CandidateFinding
from app.services.providers import MockProvider, OpenAIProvider
from app.services.rules import get_active_rules
from app.services.sectioner import split_into_sections
from app.services.validator import validate_findings


class ComplianceInspectionAgent:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        if settings.llm_provider.lower() == "openai":
            if not settings.openai_api_key:
                raise ValueError("OPENAI_API_KEY is required when LLM_PROVIDER=openai")
            self.provider = OpenAIProvider(settings.openai_api_key, settings.openai_model,
                                           settings.request_timeout_seconds, settings.max_retries)
        elif settings.llm_provider.lower() == "mock":
            self.provider = MockProvider()
        else:
            raise ValueError("LLM_PROVIDER must be either 'mock' or 'openai'")

    @property
    def model_id(self) -> str:
        return self.provider.model_id

    def analyze(self, document: str, document_type: str):
        sections = split_into_sections(document)
        rules = get_active_rules(document_type)
        candidates: list[CandidateFinding] = []
        for section in sections:
            candidates.extend(self.provider.inspect(section.text, rules))
        validated, discarded = validate_findings(candidates, document)
        return validated, discarded, len(sections)
