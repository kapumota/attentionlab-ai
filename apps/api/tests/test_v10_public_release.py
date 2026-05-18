from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_architecture_validate_endpoint():
    payload = {
        "name": "Hybrid-GQA-SWA-MLA",
        "num_layers": 24,
        "dimension": 2048,
        "heads": 16,
        "kv_heads": 4,
        "rope": True,
        "gating": True,
        "mla_compression_rank": 128,
        "sparse_top_k": 8,
        "repeat": 6,
        "layers": [
            {"type": "gqa"},
            {"type": "swa_gqa", "window": 1024},
            {"type": "mla", "compression_rank": 128},
            {"type": "gated_full_attention"},
        ],
    }
    response = client.post("/api/architecture/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "valid" in data
    assert "normalized" in data


def test_mllm_contrastive_batch_endpoint():
    response = client.post(
        "/api/mllm/contrastive-batch",
        json={
            "temperature": 0.2,
            "batch_size": 3,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["probabilities"]) == 3
    assert len(data["probabilities"][0]) == 3


def test_agents_trace_endpoint():
    response = client.post(
        "/api/agents/trace",
        json={
            "prompt": "Explica RAG con evidencia",
            "include_tools": True,
            "include_rag": True,
            "max_steps": 5,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["trace"]
    assert data["dominant_context"]


def test_openapi_available():
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "paths" in data
    assert "/api/health" in data["paths"]


def test_architecture_example_file_matches_api_contract():
    import json
    from pathlib import Path

    example_path = Path(__file__).resolve().parents[3] / "examples" / "architecture-hybrid.json"
    payload = json.loads(example_path.read_text())

    assert "architecture" not in payload
    assert "layers" in payload

    response = client.post("/api/architecture/validate", json=payload)
    assert response.status_code == 200
