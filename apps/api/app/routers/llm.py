from __future__ import annotations

from fastapi import APIRouter

from app.schemas import LLMEstimateRequest, LLMEstimateResponse
from app.services.llm_metrics import estimate_llm_costs

router = APIRouter(tags=["llm"])


@router.post("/llm/estimate", response_model=LLMEstimateResponse)
def llm_estimate(payload: LLMEstimateRequest) -> LLMEstimateResponse:
    return estimate_llm_costs(payload)
