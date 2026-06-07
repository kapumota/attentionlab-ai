from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_ok():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_attention_compute():
    payload = {
        "config": {
            "mode": "infonce",
            "tokens": 4,
            "temperature": 0.2,
            "window_size": 2,
            "top_k": 2,
            "query_heads": 4,
            "kv_heads": 2,
            "visual_head": 1
        }
    }
    response = client.post("/api/attention/compute", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["probabilities"]) == 4
    assert abs(sum(data["probabilities"][0]) - 1.0) < 1e-6


def test_llm_estimate():
    response = client.post("/api/llm/estimate", json={"num_layers": 12, "dimension": 768})
    assert response.status_code == 200
    data = response.json()
    assert data["kv_cache_mha_gb"] > data["kv_cache_gqa_gb"]
    assert data["kv_cache_mha_gb"] > data["kv_cache_swa_gb"]
    assert data["swa_vs_mha_ratio"] < 1


def test_kv_cache_estimator_long_context_presets():
    payload = {
        "num_layers": 32,
        "dimension": 4096,
        "query_heads": 32,
        "kv_heads": 8,
        "mla_rank": 256,
        "swa_window_size": 4096,
        "context_length": 131072,
        "batch_size": 1
    }
    response = client.post("/api/llm/estimate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["kv_cache_mha_gb"] > data["kv_cache_gqa_gb"] > data["kv_cache_mla_gb"]
    assert data["kv_cache_mha_gb"] > data["kv_cache_swa_gb"]
    assert "benchmark real" in " ".join(data["notes"])
