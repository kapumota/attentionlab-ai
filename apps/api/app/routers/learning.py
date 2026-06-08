from __future__ import annotations

from fastapi import APIRouter

from app.schemas import LearningPathResponse, LearningQuizRequest, LearningQuizResponse
from app.services.learning import obtener_ruta_kv_cache, validar_respuesta_quiz
from app.services.learning_agent import evaluate_agent_debugger_quiz, get_agent_debugger_path

router = APIRouter(tags=["learning"])


@router.get("/learning/kv-cache-path", response_model=LearningPathResponse)
def obtener_ruta_kv_cache_endpoint() -> LearningPathResponse:
    return obtener_ruta_kv_cache()


@router.post("/learning/kv-cache-path/quiz", response_model=LearningQuizResponse)
def validar_quiz_kv_cache(payload: LearningQuizRequest) -> LearningQuizResponse:
    return validar_respuesta_quiz(payload.pregunta_id, payload.opcion)


@router.get("/learning/agent-debugger-path")
def get_agent_debugger_learning_path() -> dict:
    """Devuelve el segundo learning path centrado en depuración de agentes."""
    return get_agent_debugger_path()


@router.post("/learning/agent-debugger-path/quiz")
def post_agent_debugger_learning_quiz(payload: dict) -> dict:
    """Evalúa el quiz del learning path de Agent Debugger."""
    return evaluate_agent_debugger_quiz(payload)
