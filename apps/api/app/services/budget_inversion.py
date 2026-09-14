"""Inversión del presupuesto lógico de KV cache.

Implementa la Ecuación (8) del artículo usando GB decimales (1 GB = 1e9
bytes). Para MHA, ``d_cache = d``; para GQA, ``d_cache`` es la dimensión
agregada efectivamente cacheada; para la aproximación latente, ``d_cache = r``.

En SWA no existe un ``T_max`` global cuando ``T >= W`` porque el costo se
satura con la ventana. Por eso se expone una comprobación independiente de
si la ventana cabe en el presupuesto.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

_BYTES_BY_PRECISION = {
    "fp32": 4.0,
    "fp16": 2.0,
    "bf16": 2.0,
    "int8": 1.0,
    "int4": 0.5,
}


def _bytes_per_value(precision: str) -> float:
    try:
        return _BYTES_BY_PRECISION[precision]
    except KeyError as exc:
        valid = ", ".join(sorted(_BYTES_BY_PRECISION))
        raise ValueError(f"precision no soportada: {precision!r}; valores válidos: {valid}") from exc


def _validate_positive(name: str, value: int) -> None:
    if value <= 0:
        raise ValueError(f"{name} debe ser positivo")


def _logical_memory_gb(
    *,
    num_layers: int,
    context_length: int,
    d_cache: int,
    batch_size: int,
    precision: str,
) -> float:
    _validate_positive("num_layers", num_layers)
    if context_length < 0:
        raise ValueError("context_length no puede ser negativo")
    _validate_positive("d_cache", d_cache)
    _validate_positive("batch_size", batch_size)

    bytes_per_value = _bytes_per_value(precision)
    return num_layers * context_length * 2 * d_cache * bytes_per_value * batch_size / 1e9


def max_context_for_budget(
    budget_gb: float,
    num_layers: int,
    d_cache: int,
    batch_size: int = 1,
    precision: str = "fp16",
) -> int:
    """Devuelve el contexto entero máximo que cabe en ``budget_gb``.

    Corresponde a la Ecuación (8):

    ``floor(budget_gb * 1e9 / (L * 2 * d_cache * s * B))``.
    """
    if not math.isfinite(budget_gb) or budget_gb <= 0:
        raise ValueError("budget_gb debe ser finito y positivo")
    _validate_positive("num_layers", num_layers)
    _validate_positive("d_cache", d_cache)
    _validate_positive("batch_size", batch_size)

    bytes_per_value = _bytes_per_value(precision)
    denominator = num_layers * 2 * d_cache * bytes_per_value * batch_size
    return math.floor(budget_gb * 1e9 / denominator)


def swa_window_fits_budget(
    budget_gb: float,
    num_layers: int,
    dimension: int,
    window_size: int,
    batch_size: int = 1,
    precision: str = "fp16",
) -> bool:
    """Indica si la ventana SWA completa cabe en el presupuesto lógico."""
    if not math.isfinite(budget_gb) or budget_gb <= 0:
        raise ValueError("budget_gb debe ser finito y positivo")
    _validate_positive("window_size", window_size)

    memory_gb = _logical_memory_gb(
        num_layers=num_layers,
        context_length=window_size,
        d_cache=dimension,
        batch_size=batch_size,
        precision=precision,
    )
    return memory_gb <= budget_gb


@dataclass(frozen=True)
class BudgetRoundTripCheck:
    max_context: int
    memory_at_max_gb: float
    memory_at_next_gb: float
    fits_budget: bool
    next_exceeds_budget: bool


def verify_round_trip(
    budget_gb: float,
    num_layers: int,
    d_cache: int,
    batch_size: int = 1,
    precision: str = "fp16",
) -> BudgetRoundTripCheck:
    """Comprueba la inversión aplicando después la fórmula directa sin redondeo."""
    max_context = max_context_for_budget(
        budget_gb=budget_gb,
        num_layers=num_layers,
        d_cache=d_cache,
        batch_size=batch_size,
        precision=precision,
    )
    memory_at_max_gb = _logical_memory_gb(
        num_layers=num_layers,
        context_length=max_context,
        d_cache=d_cache,
        batch_size=batch_size,
        precision=precision,
    )
    memory_at_next_gb = _logical_memory_gb(
        num_layers=num_layers,
        context_length=max_context + 1,
        d_cache=d_cache,
        batch_size=batch_size,
        precision=precision,
    )

    return BudgetRoundTripCheck(
        max_context=max_context,
        memory_at_max_gb=memory_at_max_gb,
        memory_at_next_gb=memory_at_next_gb,
        fits_budget=memory_at_max_gb <= budget_gb,
        next_exceeds_budget=memory_at_next_gb > budget_gb,
    )
