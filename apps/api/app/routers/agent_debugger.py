from __future__ import annotations

from fastapi import APIRouter

from app.schemas import AgentDebugRequest, AgentDebugResponse
from app.services.agent_debugger import debug_agent

router = APIRouter(tags=["agent-debugger"])


@router.post("/agents/debug", response_model=AgentDebugResponse)
def agents_debug(payload: AgentDebugRequest) -> AgentDebugResponse:
    return debug_agent(payload)
