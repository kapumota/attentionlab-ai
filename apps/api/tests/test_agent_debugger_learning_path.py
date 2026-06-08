from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_agent_debugger_learning_path_has_expected_structure() -> None:
    response = client.get("/api/learning/agent-debugger-path")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == "agent-debugger-step-by-step"
    assert data["titulo"] == "Depura un agente paso a paso"
    assert len(data["checkpoints"]) == 5
    assert len(data["quiz"]) == 3


def test_agent_debugger_learning_path_mentions_rag_and_report() -> None:
    response = client.get("/api/learning/agent-debugger-path")

    assert response.status_code == 200

    data = response.json()
    checkpoint_text = " ".join(checkpoint["titulo"] + " " + checkpoint["concepto"] for checkpoint in data["checkpoints"])

    assert "RAG" in checkpoint_text
    assert "reporte técnico" in checkpoint_text.lower()


def test_agent_debugger_learning_quiz_scores_correct_answers() -> None:
    payload = {
        "respuestas": {
            "q1": "Una lista de pasos auditables del agente",
            "q2": "Una señal de riesgo que requiere revisión",
            "q3": "Porque muestra cuándo una respuesta no está bien fundamentada",
        }
    }

    response = client.post("/api/learning/agent-debugger-path/quiz", json=payload)

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 3
    assert data["correctas"] == 3
    assert all(resultado["correcta"] for resultado in data["resultados"])


def test_agent_debugger_learning_quiz_returns_feedback_for_wrong_answer() -> None:
    payload = {
        "respuestas": {
            "q1": "Un benchmark real de GPU",
            "q2": "Un fallo que siempre detiene el sistema",
            "q3": "Porque reemplaza una base vectorial productiva",
        }
    }

    response = client.post("/api/learning/agent-debugger-path/quiz", json=payload)

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 3
    assert data["correctas"] == 0
    assert all(resultado["feedback"] for resultado in data["resultados"])
