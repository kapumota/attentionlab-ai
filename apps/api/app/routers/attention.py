from __future__ import annotations

from fastapi import APIRouter

from app.schemas import AttentionRequest, AttentionResponse
from app.services.attention import compute_attention

router = APIRouter(tags=["attention"])


@router.post("/attention/compute", response_model=AttentionResponse)
def attention_compute(payload: AttentionRequest) -> AttentionResponse:
    return compute_attention(payload.config, payload.matrix)
