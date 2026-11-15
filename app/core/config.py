from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    llm_provider: str = "mock"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    request_timeout_seconds: float = 30.0
    max_retries: int = 3
    cache_ttl_seconds: int = 300
    prompt_version: str = "v1"


@lru_cache
def get_settings() -> Settings:
    return Settings()
