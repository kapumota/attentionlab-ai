from __future__ import annotations

from app.schemas import AgentTraceRequest, AgentTraceResponse, AgentTraceStep


def build_agent_trace(req: AgentTraceRequest) -> AgentTraceResponse:
    candidates = [
        ("Prompt actual", "Interpreta la intención y restricciones del usuario.", 0.22),
        ("Plan", "Divide la tarea en pasos verificables.", 0.18),
        ("Memoria corta", "Mantiene decisiones recientes del diálogo.", 0.13),
        ("Memoria larga", "Recupera preferencias o contexto persistente.", 0.1),
        ("Documentos RAG", "Aporta evidencia externa o cargada por el usuario.", 0.16 if req.include_rag else 0.04),
        ("Herramientas", "Ejecuta cálculos, búsqueda o validación.", 0.14 if req.include_tools else 0.03),
        ("Observación", "Integra resultados de herramientas antes de responder.", 0.11),
        ("Respuesta", "Sintetiza la salida final.", 0.06),
    ]
    selected = candidates[: req.max_steps]
    total = sum(weight for _, _, weight in selected) or 1.0
    trace = [
        AgentTraceStep(step=i + 1, node=node, description=desc, attention_weight=round(weight / total, 4))
        for i, (node, desc, weight) in enumerate(selected)
    ]
    dominant = max(trace, key=lambda item: item.attention_weight).node if trace else "Prompt actual"
    return AgentTraceResponse(
        trace=trace,
        dominant_context=dominant,
        summary=f"El agente priorizó '{dominant}' para responder: {req.prompt[:120]}",
    )
