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
