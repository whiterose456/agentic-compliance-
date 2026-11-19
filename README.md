# Agentic Compliance — AI Inspection Agent (AI-2)

Implementation of **Service 2** from the Compliance Document Review App task roadmap. The service analyzes document sections against a mock compliance rule set, then validates every proposed finding against the original source before returning it.

> 

## What it does

1. Accepts document text and a document ID.
2. Splits the document into paragraph-based sections.
3. Retrieves applicable rules from a local 10-rule fixture.
4. Runs each section through a provider-independent inspection agent.
5. Validates every candidate finding: rule ID must be active, passage must occur verbatim in source text, offsets are calculated from the original document, and severity is taken from the rule fixture (not trusted from the model).
6. Discards invalid findings and returns validation statistics.
7. Caches analyses by document ID, text hash, prompt version, and model ID.
8. Keeps final approval/rejection exclusively with a human.

## Quick start

Requires Python 3.11+.

```bash
python -m venv .venv
# Windows
.venv\\Scripts\\activate
# macOS/Linux
source .venv/bin/activate

pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000 for the compliance review UI, or http://127.0.0.1:8000/docs for the interactive API. The default provider is **mock**, so no API key is required.

## Example request

```bash
curl -X POST http://127.0.0.1:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "demo-investment-001",
    "document_type": "INVESTMENT_AGREEMENT",
    "text": "We guarantee a 15% annual return with no market risk."
  }'
```

## API endpoints

- `GET /` — browser-based compliance review UI.
- `GET /health` — health and provider mode.
- `GET /rules` — list the active mock rules.
- `POST /analyze` — analyze a text document and return validated findings.

The response includes exact `passage` quotes, `start`/`end` character offsets, severity, discarded candidate count, cache status, and `human_review_required: true`. There is intentionally no AI approval/rejection endpoint.

## Enable the OpenAI provider

Set these values in `.env`:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4o-mini
REQUEST_TIMEOUT_SECONDS=30
MAX_RETRIES=3
CACHE_TTL_SECONDS=300
PROMPT_VERSION=v1
```

Never commit a real API key. The OpenAI provider requests JSON output, applies bounded retries for transient failures, and uses conservative JSON extraction for responses surrounded by prose.

## Project structure

```
app/
  api/routes.py
  core/config.py
  data/mock_rules.json
  models/schemas.py
  services/sectioner.py
  services/rules.py
  services/agent.py
  services/providers.py
  services/validator.py
  services/cache.py
  main.py
tests/
```

## Run tests

```bash
pytest -q
```

GitHub Actions runs the test suite on pushes and pull requests.

## Security and scope notes

- The LLM is an untrusted candidate generator, not the authority. `validate_findings()` is the choke point before results reach the API.
- The document text is explicitly treated as untrusted data in the system prompt. Prompt-injection attempts in the document must not override the system instructions.
- Quote grounding proves that a passage exists in the source; it does **not** prove the legal interpretation is correct.
- Severity is assigned from the local rule fixture, not accepted from model output.
- This service accepts text. PDF/DOCX extraction and the review UI are separate work.
- In the full system, Service 1 must mask PII before text is sent to an external model. This Service 2 prototype does not implement that privacy wall.
- The cache is process-local and lost on restart. Use Redis or a database for multi-worker deployments.
- Production deployment still needs authentication, authorization, audit logging, rate limiting, encrypted storage, and rules reviewed by qualified compliance specialists.
