from __future__ import annotations

from fastapi import APIRouter

from app.schemas import (
    BackendGenerationRequest,
    BackendGenerationResponse,
    EmbeddingRequest,
    EmbeddingResponse,
    ModelRuntimeStatus,
    TextContrastiveRequest,
    TextContrastiveResponse,
)
from app.services.real_models import real_model_service

router = APIRouter(tags=["real-models"])


@router.get("/models/runtime", response_model=ModelRuntimeStatus)
def model_runtime_status() -> ModelRuntimeStatus:
    return ModelRuntimeStatus(**real_model_service.status())


@router.post("/models/embed", response_model=EmbeddingResponse)
def embed_texts(payload: EmbeddingRequest) -> EmbeddingResponse:
    result = real_model_service.embed(
        texts=payload.texts,
        dimensions=payload.dimensions,
        adapter=payload.adapter,
    )
    return EmbeddingResponse(**result)


@router.post("/models/generate", response_model=BackendGenerationResponse)
def generate_text(payload: BackendGenerationRequest) -> BackendGenerationResponse:
    result = real_model_service.generate(
        prompt=payload.prompt,
        max_new_tokens=payload.max_new_tokens,
        adapter=payload.adapter,
    )
    return BackendGenerationResponse(**result.__dict__)


@router.post("/models/contrastive-texts", response_model=TextContrastiveResponse)
def contrastive_texts(payload: TextContrastiveRequest) -> TextContrastiveResponse:
    result = real_model_service.contrastive_texts(
        anchor=payload.anchor,
        candidates=payload.candidates,
        temperature=payload.temperature,
    )
    return TextContrastiveResponse(**result)
