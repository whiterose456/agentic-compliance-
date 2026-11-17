from fastapi.testclient import TestClient

from app.main import create_app


def test_health_and_analyze():
    client = TestClient(create_app())
    assert client.get("/health").status_code == 200
    response = client.post("/analyze", json={
        "document_id": "test-001",
        "document_type": "INVESTMENT_AGREEMENT",
        "text": "We guarantee a 15% annual return with no market risk."
    })
    assert response.status_code == 200
    body = response.json()
    assert body["human_review_required"] is True
    assert body["decision"] == "PENDING_HUMAN_REVIEW"
    assert len(body["findings"]) >= 1
    for finding in body["findings"]:
        assert finding["end"] > finding["start"]


def test_analysis_cache():
    client = TestClient(create_app())
    payload = {"document_id": "cache-test", "document_type": "GENERAL",
               "text": "We guarantee a 15% annual return."}
    assert client.post("/analyze", json=payload).json()["cache_hit"] is False
    assert client.post("/analyze", json=payload).json()["cache_hit"] is True


def test_rules_endpoint():
    client = TestClient(create_app())
    response = client.get("/rules")
    assert response.status_code == 200
    rules = response.json()
    assert isinstance(rules, list)
    assert len(rules) > 0
    assert any(r["rule_id"] == "RULE-001" for r in rules)


def test_static_frontend_served():
    client = TestClient(create_app())
    index_res = client.get("/")
    assert index_res.status_code == 200
    assert "AI Compliance Inspection Agent" in index_res.text
    js_res = client.get("/static/app.js")
    assert js_res.status_code == 200
    assert "PRESETS" in js_res.text
