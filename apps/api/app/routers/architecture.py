from __future__ import annotations

from fastapi import APIRouter

from app.schemas import ArchitectureSpec, ArchitectureValidationResponse
from app.services.architecture import validate_architecture

router = APIRouter(tags=["architecture"])


@router.post("/architecture/validate", response_model=ArchitectureValidationResponse)
def architecture_validate(payload: ArchitectureSpec) -> ArchitectureValidationResponse:
    return validate_architecture(payload)
