"""Learning path determinista para depuración de agentes."""

from __future__ import annotations


AGENT_DEBUGGER_PATH = {
    "id": "agent-debugger-step-by-step",
    "titulo": "Depura un agente paso a paso",
    "duracion_minutos": 12,
    "resumen": "Ruta guiada para entender trazas de agentes, tool calls, estados, evidencia insuficiente y reportes técnicos.",
    "checkpoints": [
        {
            "id": "traza-agente",
            "titulo": "Checkpoint 1 - Qué es una traza de agente",
            "objetivo": "Entender que una traza registra decisiones, pasos, herramientas y resultados de un agente.",
            "concepto": "Una traza permite revisar qué hizo el agente, en qué orden lo hizo y qué evidencia usó para justificar su respuesta.",
            "accion": "Abrir Agent Debugger Timeline y revisar los pasos generados.",
            "resultado_esperado": "El usuario identifica que cada paso tiene propósito, estado y salida auditable."
        },
        {
            "id": "tool-call",
            "titulo": "Checkpoint 2 - Qué es un tool call",
            "objetivo": "Distinguir entre razonamiento interno, llamada a herramienta y resultado observado.",
            "concepto": "Un tool call representa una acción externa simulada. En Attentio AI Lab se modela de forma determinista para explicar depuración sin depender de servicios reales.",
            "accion": "Ejecutar un escenario con herramienta simulada y revisar entrada, salida, latencia y estado.",
            "resultado_esperado": "El usuario reconoce qué datos entran a la herramienta y qué resultado vuelve al agente."
        },
        {
            "id": "estados",
            "titulo": "Checkpoint 3 - Cómo detectar warning, error y skipped",
            "objetivo": "Interpretar estados de depuración sin confundir advertencias con fallos definitivos.",
            "concepto": "Los estados ok, warning, error y skipped ayudan a separar pasos correctos, señales de riesgo, fallos reproducibles y pasos omitidos.",
            "accion": "Comparar un timeline exitoso con un escenario de error reproducible.",
            "resultado_esperado": "El usuario explica qué paso falló, qué pasos quedaron omitidos y por qué la traza sigue siendo útil."
        },
        {
            "id": "rag-evidencia-insuficiente",
            "titulo": "Checkpoint 4 - RAG con evidencia insuficiente",
            "objetivo": "Detectar cuándo una respuesta no está bien apoyada por documentos recuperados.",
            "concepto": "Un agente con RAG debe reconocer cuando la evidencia disponible no alcanza. La depuración debe mostrar esa debilidad en vez de ocultarla.",
            "accion": "Ejecutar el caso de RAG con evidencia insuficiente y revisar groundedness.",
            "resultado_esperado": "El usuario identifica la diferencia entre respuesta plausible y respuesta suficientemente fundamentada."
        },
        {
            "id": "reporte-tecnico",
            "titulo": "Checkpoint 5 - Exportar reporte técnico",
            "objetivo": "Convertir una traza en evidencia revisable para clases, talleres o entrevistas.",
            "concepto": "Un reporte técnico resume timeline, tool calls, estados, errores y advertencias. Sirve para explicar decisiones del agente de forma reproducible.",
            "accion": "Copiar el reporte Markdown y el JSON exportable.",
            "resultado_esperado": "El usuario obtiene evidencia portable de la depuración."
        }
    ],
    "quiz": [
        {
            "id": "q1",
            "pregunta": "¿Qué representa una traza de agente?",
            "opciones": [
                "Una lista de pasos auditables del agente",
                "Un entrenamiento de pesos del modelo",
                "Un benchmark real de GPU"
            ],
            "respuesta_correcta": "Una lista de pasos auditables del agente",
            "explicacion": "La traza registra pasos, estados, tool calls y resultados para depurar el comportamiento del agente."
        },
        {
            "id": "q2",
            "pregunta": "¿Qué indica un estado warning?",
            "opciones": [
                "Una señal de riesgo que requiere revisión",
                "Un fallo que siempre detiene el sistema",
                "Un paso que nunca se ejecutó"
            ],
            "respuesta_correcta": "Una señal de riesgo que requiere revisión",
            "explicacion": "Un warning no siempre detiene el flujo, pero señala evidencia débil, riesgo o condición que debe revisarse."
        },
        {
            "id": "q3",
            "pregunta": "¿Por qué es útil el caso de RAG con evidencia insuficiente?",
            "opciones": [
                "Porque muestra cuándo una respuesta no está bien fundamentada",
                "Porque reemplaza una base vectorial productiva",
                "Porque entrena automáticamente un modelo nuevo"
            ],
            "respuesta_correcta": "Porque muestra cuándo una respuesta no está bien fundamentada",
            "explicacion": "El caso enseña a detectar respuestas plausibles pero insuficientemente apoyadas por evidencia recuperada."
        }
    ]
}


def get_agent_debugger_path() -> dict:
    """Devuelve el learning path de Agent Debugger."""
    return AGENT_DEBUGGER_PATH


def evaluate_agent_debugger_quiz(payload: dict) -> dict:
    """Evalúa respuestas del quiz de Agent Debugger con feedback inmediato."""
    respuestas = payload.get("respuestas", {})
    preguntas = AGENT_DEBUGGER_PATH["quiz"]
    resultados = []
    correctas = 0

    for pregunta in preguntas:
        respuesta_usuario = respuestas.get(pregunta["id"], "")
        es_correcta = respuesta_usuario == pregunta["respuesta_correcta"]

        if es_correcta:
            correctas += 1

        resultados.append(
            {
                "id": pregunta["id"],
                "correcta": es_correcta,
                "respuesta": respuesta_usuario,
                "respuesta_correcta": pregunta["respuesta_correcta"],
                "feedback": pregunta["explicacion"],
            }
        )

    return {
        "path_id": AGENT_DEBUGGER_PATH["id"],
        "total": len(preguntas),
        "correctas": correctas,
        "resultados": resultados,
    }
