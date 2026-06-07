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
        json={"name": "Prueba v1.1.0-dev", "module": "agent-debugger", "payload": {"ok": True}},
    )
    assert response.status_code == 200
    saved_id = response.json()["id"]
    listing = client.get("/api/experiments")
    assert listing.status_code == 200
    assert any(item["id"] == saved_id for item in listing.json()["experiments"])


def test_agent_debugger_exporta_timeline_json_y_markdown():
    response = client.post(
        "/api/agents/debug",
        json={
            "prompt": "Depura un agente que usa documentos y herramientas",
            "rag_query": "agent debugger herramienta evidencia",
            "top_k": 3,
            "max_steps": 6,
            "scenario": "normal",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["scenario"] == "normal"
    assert data["export_json"]["tipo"] == "agent_debugger_timeline"
    assert "### Reporte técnico Agent Debugger Timeline" in data["export_markdown"]
    assert data["technical_report"]
    assert all("status" in step for step in data["steps"])


def test_agent_debugger_evidencia_insuficiente_es_reproducible():
    response = client.post(
        "/api/agents/debug",
        json={
            "prompt": "Responde solo si hay evidencia fuerte",
            "rag_query": "consulta sin evidencia confiable",
            "top_k": 3,
            "max_steps": 6,
            "scenario": "evidencia_insuficiente",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["scenario"] == "evidencia_insuficiente"
    assert data["retrieved"] == []
    assert data["groundedness"]["missing_evidence"]
    assert any(step["status"] == "warning" for step in data["steps"])


def test_agent_debugger_error_de_herramienta_es_reproducible():
    response = client.post(
        "/api/agents/debug",
        json={
            "prompt": "Simula una herramienta con error",
            "rag_query": "herramienta error agente",
            "top_k": 2,
            "max_steps": 6,
            "scenario": "herramienta_con_error",
        },
    )
    assert response.status_code == 200
    data = response.json()
    statuses = [tool["status"] for tool in data["tool_calls"]]
    assert "error" in statuses
    assert "skipped" in statuses
    assert any(step["status"] == "error" for step in data["steps"])
