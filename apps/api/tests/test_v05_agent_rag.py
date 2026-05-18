from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_rag_status_has_documents():
    response = client.get("/api/rag/status")
    assert response.status_code == 200
    data = response.json()
    assert data["documents"] >= 1
    assert data["store"] == "in-memory-deterministic-vector-store"


def test_rag_query_returns_ranked_documents():
    response = client.post("/api/rag/query", json={"query": "GQA reduce KV cache", "top_k": 2})
    assert response.status_code == 200
    data = response.json()
    assert len(data["retrieved"]) <= 2
    assert data["retrieved"]
    assert "score" in data["retrieved"][0]


def test_rag_ingest_and_query_custom_document():
    response = client.post(
        "/api/rag/ingest",
        json={
            "reset": False,
            "documents": [
                {
                    "id": "doc-test-rag",
                    "title": "Documento de prueba RAG",
                    "text": "La recuperación top-k permite citar documentos relevantes para responder con evidencia.",
                    "source": "test-suite",
                }
            ],
        },
    )
    assert response.status_code == 200
    assert "doc-test-rag" in response.json()["document_ids"]

    query = client.post("/api/rag/query", json={"query": "recuperación top-k citar evidencia", "top_k": 5})
    assert query.status_code == 200
    ids = [doc["id"] for doc in query.json()["retrieved"]]
    assert "doc-test-rag" in ids


def test_agent_debugger_returns_trace_and_groundedness():
    response = client.post(
        "/api/agents/debug",
        json={
            "prompt": "Explica cómo un agente usa RAG para responder",
            "rag_query": "RAG documentos recuperados agente",
            "top_k": 3,
            "max_steps": 5,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["steps"]
    assert data["retrieved"]
    assert data["tool_calls"]
    assert 0 <= data["groundedness"]["score"] <= 1


def test_experiment_save_and_list():
    response = client.post(
        "/api/experiments/save",
        json={"name": "Prueba v0.5", "module": "agent-debugger", "payload": {"ok": True}},
    )
    assert response.status_code == 200
    saved_id = response.json()["id"]
    listing = client.get("/api/experiments")
    assert listing.status_code == 200
    assert any(item["id"] == saved_id for item in listing.json()["experiments"])
