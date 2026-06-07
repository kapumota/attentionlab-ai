from __future__ import annotations

from fastapi import APIRouter

from app.schemas import LearningPathResponse, LearningQuizRequest, LearningQuizResponse
from app.services.learning import obtener_ruta_kv_cache, validar_respuesta_quiz

router = APIRouter(tags=["learning"])


@router.get("/learning/kv-cache-path", response_model=LearningPathResponse)
def obtener_ruta_kv_cache_endpoint() -> LearningPathResponse:
    return obtener_ruta_kv_cache()


@router.post("/learning/kv-cache-path/quiz", response_model=LearningQuizResponse)
def validar_quiz_kv_cache(payload: LearningQuizRequest) -> LearningQuizResponse:
    return validar_respuesta_quiz(payload.pregunta_id, payload.opcion)
