from __future__ import annotations

import os

from fastapi import APIRouter

from app.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        version="1.1.0-dev",
        mode="docker-space" if os.getenv("SPACE_ID") else "local",
        v04_ready=True,
        enabled_model_adapters=os.getenv("ATTENTIONLAB_ENABLE_REAL_MODELS", "false").lower() == "true",
    )
