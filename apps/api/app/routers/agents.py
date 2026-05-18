from __future__ import annotations

from fastapi import APIRouter

from app.schemas import AgentTraceRequest, AgentTraceResponse
from app.services.agents import build_agent_trace

router = APIRouter(tags=["agents"])


@router.post("/agents/trace", response_model=AgentTraceResponse)
def agents_trace(payload: AgentTraceRequest) -> AgentTraceResponse:
    return build_agent_trace(payload)
