from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_learning_path_kv_cache_structure():
    response = client.get("/api/learning/kv-cache-path")
    assert response.status_code == 200
    data = response.json()
    assert data["titulo"] == "Entiende KV Cache en 12 minutos"
    assert data["duracion_total_minutos"] == 12
    assert len(data["checkpoints"]) == 5
    assert len(data["quiz"]) == 3
    assert data["checkpoints"][2]["preset"]["tipo_bloque"] == "gqa"
    assert data["checkpoints"][4]["preset"]["longitud_contexto"] == 131072


def test_learning_path_quiz_feedback():
    response = client.post("/api/learning/kv-cache-path/quiz", json={"pregunta_id": "q2-gqa", "opcion": 1})
    assert response.status_code == 200
    data = response.json()
    assert data["correcta"] is True
    assert data["respuesta_correcta"] == 1
    assert "GQA" in data["explicacion"]


def test_learning_path_quiz_wrong_answer():
    response = client.post("/api/learning/kv-cache-path/quiz", json={"pregunta_id": "q3-alcance", "opcion": 0})
    assert response.status_code == 200
    data = response.json()
    assert data["correcta"] is False
    assert data["respuesta_correcta"] == 1
