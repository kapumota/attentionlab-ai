"""Composición de reducciones de memoria entre mecanismos independientes.

La Ecuación (7) del artículo combina mecanismos que actúan sobre factores
distintos del KV cache. Para GQA + SWA, la reducción respecto de MHA es el
producto de la reducción por cabezas KV y la reducción por contexto efectivo.
"""

from __future__ import annotations

import math

from app.services.sliding_window import swa_ratio


def apply_sliding_window_ratio(
    base_gb: float,
    context_length: int,
    window_size: int,
) -> float:
    """Aplica la reducción SWA de la Ecuación (4) a una memoria base."""
    if not math.isfinite(base_gb) or base_gb < 0:
        raise ValueError("base_gb debe ser finito y no negativo")

    return base_gb * swa_ratio(context_length, window_size)


def compose_gqa_swa_ratio(
    query_heads: int,
    kv_heads: int,
    context_length: int,
    window_size: int,
) -> float:
    """Calcula la razón GQA+SWA de la Ecuación (7) respecto de MHA.

    La función modela el dominio científico del artículo: el número de
    cabezas KV debe estar entre 1 y ``query_heads``.
    """
    if query_heads <= 0:
        raise ValueError("query_heads debe ser positivo")
    if kv_heads <= 0:
        raise ValueError("kv_heads debe ser positivo")
    if kv_heads > query_heads:
        raise ValueError("kv_heads no puede exceder query_heads")

    gqa_ratio = kv_heads / query_heads
    return gqa_ratio * swa_ratio(context_length, window_size)
