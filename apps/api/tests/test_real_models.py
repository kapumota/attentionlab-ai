from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_model_runtime_status():
    response = client.get("/api/models/runtime")
    assert response.status_code == 200
    data = response.json()
    assert data["browser_transformers_js"] is True
    assert "deterministic-backend" in data["available_adapters"]


def test_embedding_endpoint_deterministic():
    response = client.post("/api/models/embed", json={"texts": ["hola", "mundo"], "dimensions": 16})
    assert response.status_code == 200
    data = response.json()
    assert data["dimensions"] == 16
    assert len(data["embeddings"]) == 2
    assert len(data["embeddings"][0]) == 16


def test_contrastive_texts_endpoint():
    response = client.post(
        "/api/models/contrastive-texts",
        json={
            "anchor": "perro con pelota",
            "candidates": ["perro jugando", "receta de cocina", "código python"],
            "temperature": 0.2,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["probabilities"]) == 3
    assert abs(sum(data["probabilities"]) - 1.0) < 1e-6
    assert 0 <= data["best_index"] < 3


def test_generation_endpoint_fallback():
    response = client.post("/api/models/generate", json={"prompt": "Explica GQA", "max_new_tokens": 16})
    assert response.status_code == 200
    data = response.json()
    assert data["output"]
    assert data["adapter"] == "deterministic-backend"
