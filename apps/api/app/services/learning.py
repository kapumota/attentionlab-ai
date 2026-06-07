from __future__ import annotations

from app.schemas import LearningPathResponse, LearningQuizResponse


KV_CACHE_PATH_ID = "kv-cache-12-min"


_RUTA_KV_CACHE = {
    "id": KV_CACHE_PATH_ID,
    "titulo": "Entiende KV Cache en 12 minutos",
    "resumen": "Ruta guiada para pasar de la intuición de KV cache a una configuración defendible para 128k tokens.",
    "duracion_total_minutos": 12,
    "checkpoints": [
        {
            "id": "concepto-kv-cache",
            "titulo": "Checkpoint 1 - Qué es KV cache",
            "duracion_minutos": 2,
            "objetivo": "Entender que KV cache guarda keys y values para no recalcular todo el contexto en cada token nuevo.",
            "concepto": "Durante inferencia autoregresiva, el modelo reutiliza K/V de tokens anteriores. Esto acelera generación, pero consume memoria proporcional al contexto, capas, dimensión, batch y precisión.",
            "accion": "Aplicar el preset MHA 32k y observar la memoria base.",
            "resultado_esperado": "MHA funciona como referencia: es fácil de explicar, pero crece rápido con contexto largo.",
            "preset": {
                "modo": "causal",
                "tokens": 12,
                "query_heads": 16,
                "kv_heads": 16,
                "longitud_contexto": 32768,
                "batch_size": 1,
                "capas": 24,
                "dimension": 2048,
                "ventana_swa": 4096,
                "rango_mla": 128,
                "tipo_bloque": "mha",
            },
        },
        {
            "id": "crecimiento-contexto",
            "titulo": "Checkpoint 2 - Por qué crece con el contexto",
            "duracion_minutos": 2,
            "objetivo": "Relacionar longitud de contexto con memoria acumulada.",
            "concepto": "La KV cache crece casi linealmente con el número de tokens almacenados. En atención completa, además, las relaciones token-token crecen de forma cuadrática para el cálculo de atención.",
            "accion": "Cambiar de 32k a 64k y luego 128k tokens.",
            "resultado_esperado": "La memoria estimada sube al aumentar el contexto. La comparación permite explicar por qué contexto largo exige optimizaciones.",
            "preset": {
                "modo": "causal",
                "tokens": 12,
                "query_heads": 32,
                "kv_heads": 32,
                "longitud_contexto": 131072,
                "batch_size": 1,
                "capas": 32,
                "dimension": 4096,
                "ventana_swa": 4096,
                "rango_mla": 256,
                "tipo_bloque": "mha",
            },
        },
        {
            "id": "mha-vs-gqa",
            "titulo": "Checkpoint 3 - MHA vs GQA",
            "duracion_minutos": 3,
            "objetivo": "Comparar guardar K/V por todas las heads contra compartir K/V entre grupos.",
            "concepto": "GQA conserva muchas query heads, pero reduce la cantidad de KV heads. El resultado didáctico es menos memoria de cache sin eliminar completamente la estructura multi-head.",
            "accion": "Aplicar GQA eficiente 128k y comparar GQA vs MHA.",
            "resultado_esperado": "GQA reduce memoria respecto de MHA porque kv_heads es menor que query_heads.",
            "preset": {
                "modo": "gqa",
                "tokens": 12,
                "query_heads": 32,
                "kv_heads": 8,
                "longitud_contexto": 131072,
                "batch_size": 1,
                "capas": 32,
                "dimension": 4096,
                "ventana_swa": 4096,
                "rango_mla": 256,
                "tipo_bloque": "gqa",
            },
        },
        {
            "id": "mla-compresion-latente",
            "titulo": "Checkpoint 4 - MLA y compresión latente",
            "duracion_minutos": 3,
            "objetivo": "Interpretar MLA como compresión conceptual de la representación cacheada.",
            "concepto": "MLA se explica aquí como una cache latente de menor rango. El estimador no reproduce una implementación exacta de proveedor, pero ayuda a razonar sobre compresión de memoria.",
            "accion": "Aplicar MLA conceptual 1M y revisar MHA vs GQA vs MLA.",
            "resultado_esperado": "MLA aparece como alternativa conceptual para reducir memoria en contexto extremo.",
            "preset": {
                "modo": "gqa",
                "tokens": 12,
                "query_heads": 64,
                "kv_heads": 8,
                "longitud_contexto": 1048576,
                "batch_size": 1,
                "capas": 40,
                "dimension": 5120,
                "ventana_swa": 8192,
                "rango_mla": 512,
                "tipo_bloque": "mla",
            },
        },
        {
            "id": "diseno-128k",
            "titulo": "Checkpoint 5 - Diseña una configuración para 128k tokens",
            "duracion_minutos": 2,
            "objetivo": "Elegir una configuración defendible para contexto largo equilibrando memoria y explicabilidad.",
            "concepto": "Una configuración 128k defendible puede combinar GQA con ventana SWA para reducir memoria activa y mantener una explicación técnica simple.",
            "accion": "Aplicar SWA local 128k y exportar el reporte Markdown.",
            "resultado_esperado": "El usuario puede justificar una decisión de arquitectura con números, fórmulas y advertencias de alcance.",
            "preset": {
                "modo": "ventana",
                "tokens": 12,
                "query_heads": 32,
                "kv_heads": 8,
                "longitud_contexto": 131072,
                "batch_size": 1,
                "capas": 32,
                "dimension": 4096,
                "ventana_swa": 4096,
                "rango_mla": 256,
                "tipo_bloque": "swa_gqa",
            },
        },
    ],
    "quiz": [
        {
            "id": "q1-crecimiento",
            "pregunta": "¿Qué variable hace crecer directamente la memoria de KV cache en el estimador?",
            "opciones": ["Longitud de contexto", "Color del gráfico", "Nombre del preset"],
            "respuesta_correcta": 0,
            "explicacion": "La memoria crece con contexto, capas, dimensión, batch y bytes por elemento. El color o nombre del preset no cambia el cálculo.",
        },
        {
            "id": "q2-gqa",
            "pregunta": "¿Por qué GQA reduce memoria frente a MHA en esta explicación?",
            "opciones": ["Porque elimina todas las query heads", "Porque usa menos KV heads que query heads", "Porque reduce el batch a cero"],
            "respuesta_correcta": 1,
            "explicacion": "GQA comparte keys y values entre grupos de query heads. Por eso reduce la memoria de KV cache respecto de MHA.",
        },
        {
            "id": "q3-alcance",
            "pregunta": "¿Cómo debe interpretarse KV Cache Estimator?",
            "opciones": ["Como benchmark real de GPU", "Como herramienta didáctica reproducible", "Como prueba de entrenamiento de un LLM"],
            "respuesta_correcta": 1,
            "explicacion": "El módulo es didáctico. Ayuda a razonar, pero no reemplaza profiler, benchmark real ni mediciones de producción.",
        },
    ],
}


def obtener_ruta_kv_cache() -> LearningPathResponse:
    return LearningPathResponse.model_validate(_RUTA_KV_CACHE)


def validar_respuesta_quiz(pregunta_id: str, opcion: int) -> LearningQuizResponse:
    ruta = obtener_ruta_kv_cache()
    pregunta = next((item for item in ruta.quiz if item.id == pregunta_id), None)

    if pregunta is None:
        return LearningQuizResponse(
            correcta=False,
            respuesta_correcta=-1,
            explicacion="La pregunta no existe en la ruta de aprendizaje.",
        )

    correcta = pregunta.respuesta_correcta == opcion
    return LearningQuizResponse(
        correcta=correcta,
        respuesta_correcta=pregunta.respuesta_correcta,
        explicacion=pregunta.explicacion,
    )
