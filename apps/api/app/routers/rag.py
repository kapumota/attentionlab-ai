from __future__ import annotations

from fastapi import APIRouter

from app.schemas import RagIngestRequest, RagIngestResponse, RagQueryRequest, RagQueryResponse, RagStatusResponse
from app.services.rag import rag_store

router = APIRouter(tags=["rag"])


@router.get("/rag/status", response_model=RagStatusResponse)
def rag_status() -> RagStatusResponse:
    return rag_store.status()


@router.post("/rag/ingest", response_model=RagIngestResponse)
def rag_ingest(payload: RagIngestRequest) -> RagIngestResponse:
    return rag_store.ingest(payload)


@router.post("/rag/query", response_model=RagQueryResponse)
def rag_query(payload: RagQueryRequest) -> RagQueryResponse:
    return rag_store.query(payload)
