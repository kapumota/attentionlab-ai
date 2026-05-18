from __future__ import annotations

from fastapi import APIRouter

from app.schemas import ContrastiveBatchRequest, ContrastiveBatchResponse
from app.services.mllm import contrastive_batch

router = APIRouter(tags=["mllm"])


@router.post("/mllm/contrastive-batch", response_model=ContrastiveBatchResponse)
def mllm_contrastive_batch(payload: ContrastiveBatchRequest) -> ContrastiveBatchResponse:
    return contrastive_batch(payload)
