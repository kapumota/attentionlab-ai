from __future__ import annotations

from fastapi import APIRouter

from app.schemas import LLMEstimateRequest, LLMEstimateResponse
from app.services.llm_metrics import estimar_costos_llm

router = APIRouter(tags=["llm"])


@router.post("/llm/estimate", response_model=LLMEstimateResponse)
def estimar_llm(payload: LLMEstimateRequest) -> LLMEstimateResponse:
    return estimar_costos_llm(payload)
