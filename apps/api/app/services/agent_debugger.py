from __future__ import annotations

import time

from app.schemas import (
    AgentDebugRequest,
    AgentDebugResponse,
    AgentDebugStep,
    AgentToolCall,
    GroundednessReport,
    RagQueryRequest,
)
from app.services.rag import rag_store


def _tool_latency(index: int) -> float:
    return 24.0 + index * 8.5


def debug_agent(req: AgentDebugRequest) -> AgentDebugResponse:
    """Construye una traza auditable de agente con RAG y herramientas.

    El objetivo de v1.1.0-dev no es simular un agente autónomo peligroso ni ejecutar
    herramientas externas reales. Es un depurador visual y reproducible para
    enseñar planificación, recuperación, uso de contexto y groundedness.
    """
    start = time.perf_counter()
    rag_result = rag_store.query(
        RagQueryRequest(
            query=req.rag_query or req.prompt,
            top_k=req.top_k,
            min_score=0.0,
        )
    )

    tools: list[AgentToolCall] = []
    if req.enable_tools:
        tools = [
            AgentToolCall(
                name="retriever.search",
                input=req.rag_query or req.prompt,
                output=f"{len(rag_result.retrieved)} documentos recuperados",
                latency_ms=_tool_latency(0),
                status="ok",
            ),
            AgentToolCall(
                name="groundedness.check",
                input="respuesta candidata + citas",
                output="Se verificó cobertura de evidencias recuperadas",
                latency_ms=_tool_latency(1),
                status="ok",
            ),
        ]

    evidence_score = min(1.0, 0.28 + 0.18 * len(rag_result.retrieved))
    tool_score = 0.17 if tools else 0.05
    memory_score = 0.14 if req.include_memory else 0.03
    plan_score = 0.19
    response_score = max(0.05, 1.0 - evidence_score - tool_score - memory_score - plan_score)
    raw_steps = [
        ("Plan", "Descompone la solicitud y decide si necesita recuperación o herramientas.", plan_score),
        ("RAG", "Recupera documentos relevantes y asigna citas visuales.", evidence_score),
        ("Herramientas", "Registra llamadas, entradas, salidas, latencia y estado.", tool_score),
        ("Memoria", "Usa contexto persistente o conversación reciente si está disponible.", memory_score),
        ("Respuesta", "Sintetiza una respuesta apoyada en evidencias y observaciones.", response_score),
    ]
    total = sum(weight for _, _, weight in raw_steps) or 1.0
    steps = [
        AgentDebugStep(
            step=index + 1,
            node=node,
            description=description,
            attention_weight=round(weight / total, 4),
            evidence_ids=[doc.id for doc in rag_result.retrieved] if node == "RAG" else [],
            tool_name=tools[0].name if node == "Herramientas" and tools else None,
        )
        for index, (node, description, weight) in enumerate(raw_steps[: req.max_steps])
    ]

    cited_ids = {doc.id for doc in rag_result.retrieved}
    groundedness = GroundednessReport(
        score=round(evidence_score, 4),
        cited_document_ids=sorted(cited_ids),
        missing_evidence=[] if cited_ids else ["No se recuperaron documentos suficientes."],
        warning="Groundedness didáctico: no es evaluación factual automática de producción.",
    )
    latency_ms = (time.perf_counter() - start) * 1000
    return AgentDebugResponse(
        prompt=req.prompt,
        answer_draft=(
            "Borrador trazable: la respuesta debe usar los documentos recuperados, "
            "explicar qué herramienta influyó y declarar límites si la evidencia es insuficiente."
        ),
        retrieved=rag_result.retrieved,
        tool_calls=tools,
        steps=steps,
        groundedness=groundedness,
        latency_ms=latency_ms,
        notes=[
            "v1.1.0-dev convierte el playground de agentes en un depurador visual con RAG.",
            "Las herramientas son simuladas y seguras; no ejecutan acciones externas.",
        ],
    )
