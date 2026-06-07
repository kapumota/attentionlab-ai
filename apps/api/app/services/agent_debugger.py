from __future__ import annotations

import json
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


def _recortar(texto: str, limite: int = 180) -> str:
    if len(texto) <= limite:
        return texto
    return f"{texto[: limite - 1]}..."


def _estado_rag(req: AgentDebugRequest, cantidad_recuperada: int) -> str:
    if req.scenario == "evidencia_insuficiente" or cantidad_recuperada == 0:
        return "warning"
    return "ok"


def _crear_herramientas(req: AgentDebugRequest, documentos: int) -> list[AgentToolCall]:
    if not req.enable_tools:
        return [
            AgentToolCall(
                name="retriever.search",
                input=req.rag_query or req.prompt,
                output="Herramienta omitida porque enable_tools está desactivado.",
                latency_ms=0.0,
                status="skipped",
            )
        ]

    if req.scenario == "herramienta_con_error":
        return [
            AgentToolCall(
                name="retriever.search",
                input=req.rag_query or req.prompt,
                output=f"{documentos} documentos recuperados antes del error simulado.",
                latency_ms=_tool_latency(0),
                status="ok",
            ),
            AgentToolCall(
                name="calculator.estimate_cost",
                input="tokens, capas, heads y memoria estimada",
                output="Error reproducible: la herramienta recibió una configuración incompleta.",
                latency_ms=_tool_latency(1),
                status="error",
            ),
            AgentToolCall(
                name="groundedness.check",
                input="respuesta candidata + citas",
                output="Paso omitido porque una herramienta anterior falló.",
                latency_ms=0.0,
                status="skipped",
            ),
        ]

    if req.scenario == "evidencia_insuficiente":
        return [
            AgentToolCall(
                name="retriever.search",
                input=req.rag_query or req.prompt,
                output="0 documentos confiables recuperados para responder con evidencia.",
                latency_ms=_tool_latency(0),
                status="warning",
            ),
            AgentToolCall(
                name="groundedness.check",
                input="respuesta candidata + citas",
                output="Advertencia reproducible: falta evidencia suficiente.",
                latency_ms=_tool_latency(1),
                status="warning",
            ),
        ]

    return [
        AgentToolCall(
            name="retriever.search",
            input=req.rag_query or req.prompt,
            output=f"{documentos} documentos recuperados",
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


def _crear_pasos(req: AgentDebugRequest, rag_result, tools: list[AgentToolCall], evidence_score: float) -> list[AgentDebugStep]:
    retrieved = rag_result.retrieved
    evidence_ids = [doc.id for doc in retrieved]
    tool_error = any(tool.status == "error" for tool in tools)
    rag_status = _estado_rag(req, len(retrieved))
    tools_status = "error" if tool_error else ("warning" if any(tool.status == "warning" for tool in tools) else "ok")
    grounded_status = "error" if tool_error else ("warning" if rag_status == "warning" else "ok")

    tool_score = 0.17 if tools and tools[0].status != "skipped" else 0.05
    memory_score = 0.14 if req.include_memory else 0.03
    plan_score = 0.19
    response_score = max(0.05, 1.0 - evidence_score - tool_score - memory_score - plan_score)

    raw_steps = [
        {
            "node": "Plan",
            "description": "Descompone la solicitud y decide si necesita recuperación o herramientas.",
            "weight": plan_score,
            "status": "ok",
            "input": _recortar(req.prompt),
            "output": "Plan inicial listo para recuperación y validación.",
            "latency": 3.2,
            "evidence": [],
            "tool": None,
        },
        {
            "node": "RAG",
            "description": "Recupera documentos relevantes y asigna citas visuales.",
            "weight": evidence_score,
            "status": rag_status,
            "input": _recortar(req.rag_query or req.prompt),
            "output": f"{len(retrieved)} documentos recuperados.",
            "latency": 14.5,
            "evidence": evidence_ids,
            "tool": "retriever.search",
        },
        {
            "node": "Herramientas",
            "description": "Registra llamadas, entradas, salidas, latencia y estado.",
            "weight": tool_score,
            "status": tools_status,
            "input": tools[0].input if tools else "Sin herramientas.",
            "output": "; ".join(f"{tool.name}: {tool.status}" for tool in tools) or "Sin herramientas.",
            "latency": sum(tool.latency_ms for tool in tools),
            "evidence": evidence_ids if tools_status != "skipped" else [],
            "tool": tools[0].name if tools else None,
        },
        {
            "node": "Memoria",
            "description": "Usa contexto persistente o conversación reciente si está disponible.",
            "weight": memory_score,
            "status": "ok" if req.include_memory else "skipped",
            "input": "Memoria activada" if req.include_memory else "Memoria desactivada",
            "output": "Contexto breve incorporado." if req.include_memory else "Paso omitido por configuración.",
            "latency": 2.1 if req.include_memory else 0.0,
            "evidence": [],
            "tool": None,
        },
        {
            "node": "Respuesta",
            "description": "Sintetiza una respuesta apoyada en evidencias y observaciones.",
            "weight": response_score,
            "status": "error" if tool_error else ("warning" if rag_status == "warning" else "ok"),
            "input": ", ".join(evidence_ids) or "sin evidencia suficiente",
            "output": "Borrador generado con límites explícitos." if rag_status == "warning" else "Borrador trazable generado.",
            "latency": 8.7,
            "evidence": evidence_ids,
            "tool": None,
        },
        {
            "node": "Groundedness",
            "description": "Contrasta respuesta, citas y documentos recuperados para detectar evidencia faltante.",
            "weight": 0.08,
            "status": grounded_status,
            "input": "respuesta preliminar + documentos citados",
            "output": f"Groundedness estimado: {round(evidence_score, 4)}.",
            "latency": 4.4,
            "evidence": evidence_ids,
            "tool": "groundedness.check",
        },
    ]

    total = sum(item["weight"] for item in raw_steps) or 1.0
    return [
        AgentDebugStep(
            step=index + 1,
            node=str(item["node"]),
            description=str(item["description"]),
            attention_weight=round(float(item["weight"]) / total, 4),
            evidence_ids=list(item["evidence"]),
            tool_name=item["tool"],
            status=item["status"],
            input_summary=str(item["input"]),
            output_summary=str(item["output"]),
            latency_ms=round(float(item["latency"]), 2),
        )
        for index, item in enumerate(raw_steps[: req.max_steps])
    ]


def _crear_respuesta(req: AgentDebugRequest, retrieved_count: int, tool_error: bool) -> str:
    if tool_error:
        return (
            "Borrador trazable: una herramienta simulada falló. La respuesta debe detenerse, "
            "declarar el error y pedir una nueva ejecución con configuración completa."
        )
    if req.scenario == "evidencia_insuficiente" or retrieved_count == 0:
        return (
            "Borrador trazable: no hay evidencia suficiente para responder con seguridad. "
            "El agente debe declarar el límite y solicitar más documentos o una consulta mejor definida."
        )
    return (
        "Borrador trazable: la respuesta debe usar los documentos recuperados, "
        "explicar qué herramienta influyó y declarar límites si la evidencia es insuficiente."
    )


def _crear_export_json(req: AgentDebugRequest, response_payload: dict) -> dict:
    return {
        "tipo": "agent_debugger_timeline",
        "version": "1.1.0-dev",
        "escenario": req.scenario,
        "traza": response_payload,
    }


def _crear_markdown(req: AgentDebugRequest, steps: list[AgentDebugStep], tools: list[AgentToolCall], groundedness: GroundednessReport) -> str:
    lines = [
        "### Reporte técnico Agent Debugger Timeline",
        "",
        "#### Escenario",
        "",
        req.scenario,
        "",
        "#### Timeline",
        "",
    ]
    for step in steps:
        lines.extend([
            f"- Paso {step.step}: {step.node}",
            f"  - Estado: {step.status}",
            f"  - Entrada: {step.input_summary}",
            f"  - Salida: {step.output_summary}",
            f"  - Latencia: {step.latency_ms:.1f} ms",
        ])
    lines.extend(["", "#### Tool calls", ""])
    for tool in tools:
        lines.extend([
            f"- {tool.name}",
            f"  - Estado: {tool.status}",
            f"  - Entrada: {tool.input}",
            f"  - Salida: {tool.output}",
            f"  - Latencia: {tool.latency_ms:.1f} ms",
        ])
    lines.extend([
        "",
        "#### Groundedness",
        "",
        f"- Score: {groundedness.score:.4f}",
        f"- Citas: {', '.join(groundedness.cited_document_ids) or 'sin citas'}",
        f"- Evidencia faltante: {', '.join(groundedness.missing_evidence) or 'sin faltantes'}",
        f"- Advertencia: {groundedness.warning}",
        "",
        "#### Límite",
        "",
        "Este reporte es didáctico y reproducible. No ejecuta herramientas externas reales.",
    ])
    return "\n".join(lines)


def depurar_agente(req: AgentDebugRequest) -> AgentDebugResponse:
    """Construye una traza determinista para depurar agentes con RAG y herramientas."""
    start = time.perf_counter()
    rag_result = rag_store.query(
        RagQueryRequest(
            query=req.rag_query or req.prompt,
            top_k=req.top_k,
            min_score=0.0,
        )
    )

    if req.scenario == "evidencia_insuficiente":
        rag_result.retrieved.clear()

    tools = _crear_herramientas(req, len(rag_result.retrieved))
    tool_error = any(tool.status == "error" for tool in tools)
    evidence_score = 0.08 if req.scenario == "evidencia_insuficiente" else min(1.0, 0.28 + 0.18 * len(rag_result.retrieved))
    steps = _crear_pasos(req, rag_result, tools, evidence_score)
    cited_ids = {doc.id for doc in rag_result.retrieved}
    missing_evidence = [] if cited_ids else ["No se recuperaron documentos suficientes."]
    if tool_error:
        missing_evidence.append("Una herramienta simulada falló antes de completar la validación.")

    groundedness = GroundednessReport(
        score=round(evidence_score, 4),
        cited_document_ids=sorted(cited_ids),
        missing_evidence=missing_evidence,
        warning=(
            "Error reproducible en herramienta simulada."
            if tool_error
            else "Groundedness didáctico: no es evaluación factual automática de producción."
        ),
    )
    latency_ms = (time.perf_counter() - start) * 1000
    answer_draft = _crear_respuesta(req, len(rag_result.retrieved), tool_error)
    response_payload = {
        "prompt": req.prompt,
        "scenario": req.scenario,
        "answer_draft": answer_draft,
        "retrieved_ids": sorted(cited_ids),
        "tool_calls": [tool.model_dump() for tool in tools],
        "steps": [step.model_dump() for step in steps],
        "groundedness": groundedness.model_dump(),
        "latency_ms": round(latency_ms, 2),
    }
    export_json = _crear_export_json(req, response_payload)
    export_markdown = _crear_markdown(req, steps, tools, groundedness)
    technical_report = json.dumps(export_json, ensure_ascii=False, indent=2)

    return AgentDebugResponse(
        prompt=req.prompt,
        answer_draft=answer_draft,
        retrieved=rag_result.retrieved,
        tool_calls=tools,
        steps=steps,
        groundedness=groundedness,
        latency_ms=latency_ms,
        notes=[
            "Agent Debugger Timeline usa trazas deterministas para enseñar depuración de agentes.",
            "Las herramientas son simuladas y seguras; no ejecutan acciones externas.",
            "Los escenarios de error permiten reproducir fallas sin servicios externos.",
        ],
        scenario=req.scenario,
        export_json=export_json,
        export_markdown=export_markdown,
        technical_report=technical_report,
    )


# Alias de compatibilidad para rutas o pruebas previas.
debug_agent = depurar_agente
