"""Memoria lógica de sliding-window attention (SWA).

Implementa la Ecuación (4) del artículo usando el contexto efectivo
``min(T, W)``. Este módulo es la fuente canónica para el cálculo de SWA
empleado por servicios, pruebas y reportes reproducibles.
"""

from __future__ import annotations

_BYTES_BY_PRECISION = {
    "fp32": 4,
    "fp16": 2,
    "bf16": 2,
    "int8": 1,
    "int4": 0.5,
}


def effective_context(context_length: int, window_size: int) -> int:
    """Devuelve el contexto activo de SWA: ``min(T, W)``."""
    if context_length <= 0:
        raise ValueError("context_length debe ser positivo")
    if window_size <= 0:
        raise ValueError("window_size debe ser positivo")
    return min(context_length, window_size)


def swa_ratio(context_length: int, window_size: int) -> float:
    """Calcula la razón SWA/MHA debida únicamente al contexto efectivo."""
    return effective_context(context_length, window_size) / context_length


def swa_memory_gb(
    num_layers: int,
    dimension: int,
    context_length: int,
    window_size: int,
    batch_size: int = 1,
    precision: str = "fp16",
) -> float:
    """Calcula memoria lógica SWA en GB decimales según la Ecuación (4)."""
    if num_layers <= 0:
        raise ValueError("num_layers debe ser positivo")
    if dimension <= 0:
        raise ValueError("dimension debe ser positivo")
    if batch_size <= 0:
        raise ValueError("batch_size debe ser positivo")
    if precision not in _BYTES_BY_PRECISION:
        raise ValueError(f"precision no soportada: {precision}")

    active_context = effective_context(context_length, window_size)
    bytes_per_value = _BYTES_BY_PRECISION[precision]
    return (
        num_layers
        * active_context
        * 2
        * dimension
        * bytes_per_value
        * batch_size
        / 1e9
    )
