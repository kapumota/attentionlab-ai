from __future__ import annotations

from fastapi import APIRouter

from app.schemas import ModelAdapterStatus
from app.services.model_gateway import model_gateway

router = APIRouter(tags=["models"])


@router.get("/models/status", response_model=ModelAdapterStatus)
def models_status() -> ModelAdapterStatus:
    return model_gateway.status()
