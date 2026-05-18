from __future__ import annotations

from fastapi import APIRouter

from app.schemas import ExperimentListResponse, ExperimentRecord, ExperimentSaveResponse
from app.services.experiments import experiment_store

router = APIRouter(tags=["experiments"])


@router.post("/experiments/save", response_model=ExperimentSaveResponse)
def save_experiment(payload: ExperimentRecord) -> ExperimentSaveResponse:
    return experiment_store.save(payload)


@router.get("/experiments", response_model=ExperimentListResponse)
def list_experiments() -> ExperimentListResponse:
    return experiment_store.list()
