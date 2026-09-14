"""Pruebas basadas en propiedades sobre invariantes del KV cache.

Complementan los casos de regresión fijos con generación automatizada de
configuraciones válidas y búsqueda de contraejemplos. No constituyen una
verificación exhaustiva de todas las combinaciones posibles del dominio.
"""

from __future__ import annotations

from hypothesis import assume, given, settings, strategies as st

from app.schemas import LLMEstimateRequest
from app.services.composition import compose_gqa_swa_ratio
from app.services.llm_metrics import estimate_llm_costs

_RESOLUTION_API_GB = 1e-6
_PRECISION_FLOOR_GB = 1e-3
_PROPERTY_SETTINGS = settings(
    max_examples=200,
    deadline=None,
    database=None,
    derandomize=True,
)

_num_layers = st.integers(min_value=1, max_value=256)
_dimension = st.integers(min_value=64, max_value=32768)
_query_heads = st.integers(min_value=1, max_value=256)
_batch_size = st.integers(min_value=1, max_value=128)
_context_length_half = st.integers(min_value=128, max_value=524288)
_context_length = st.integers(min_value=128, max_value=1048576)
_precision = st.sampled_from(["fp32", "fp16", "bf16", "int8", "int4"])


def _build(
    num_layers: int,
    dimension: int,
    query_heads: int,
    kv_heads: int,
    context_length: int,
    batch_size: int,
    precision: str,
) -> LLMEstimateRequest:
    return LLMEstimateRequest(
        num_layers=num_layers,
        dimension=dimension,
        query_heads=query_heads,
        kv_heads=kv_heads,
        mla_rank=max(1, min(dimension - 1, 512)),
        context_length=context_length,
        batch_size=batch_size,
        precision=precision,
        rope=True,
    )


@given(
    num_layers=_num_layers,
    dimension=_dimension,
    query_heads=_query_heads,
    batch_size=_batch_size,
    context_length=_context_length_half,
    precision=_precision,
)
@_PROPERTY_SETTINGS
def test_mha_es_lineal_en_contextos_generados(
    num_layers: int,
    dimension: int,
    query_heads: int,
    batch_size: int,
    context_length: int,
    precision: str,
) -> None:
    """Invariante 1: al duplicar T, la memoria MHA se duplica."""
    req_base = _build(
        num_layers,
        dimension,
        query_heads,
        query_heads,
        context_length,
        batch_size,
        precision,
    )
    req_double = _build(
        num_layers,
        dimension,
        query_heads,
        query_heads,
        context_length * 2,
        batch_size,
        precision,
    )

    memory_base = estimate_llm_costs(req_base).kv_cache_mha_gb
    memory_double = estimate_llm_costs(req_double).kv_cache_mha_gb
    assume(memory_base >= _PRECISION_FLOOR_GB)

    expected = memory_base * 2
    tolerance = _RESOLUTION_API_GB * 6
    assert abs(memory_double - expected) <= tolerance


@given(
    num_layers=_num_layers,
    dimension=_dimension,
    query_heads=_query_heads,
    context_length=_context_length,
    batch_size=_batch_size,
    precision=_precision,
    data=st.data(),
)
@_PROPERTY_SETTINGS
def test_razon_gqa_es_kv_heads_sobre_query_heads_en_casos_generados(
    num_layers: int,
    dimension: int,
    query_heads: int,
    context_length: int,
    batch_size: int,
    precision: str,
    data: st.DataObject,
) -> None:
    """Invariante 2: GQA/MHA = h_kv/h_q para configuraciones válidas."""
    kv_heads = data.draw(st.integers(min_value=1, max_value=query_heads))
    req = _build(
        num_layers,
        dimension,
        query_heads,
        kv_heads,
        context_length,
        batch_size,
        precision,
    )
    result = estimate_llm_costs(req)
    assume(result.kv_cache_mha_gb >= _PRECISION_FLOOR_GB)

    expected_ratio = kv_heads / query_heads
    observed_ratio = result.kv_cache_gqa_gb / result.kv_cache_mha_gb
    tolerance = max(1e-6, (_RESOLUTION_API_GB / result.kv_cache_mha_gb) * 2)
    assert abs(observed_ratio - expected_ratio) <= tolerance


@given(
    num_layers=_num_layers,
    dimension=_dimension,
    query_heads=_query_heads,
    context_length=_context_length,
    batch_size=_batch_size,
)
@_PROPERTY_SETTINGS
def test_int8_es_la_mitad_de_fp16_en_casos_generados(
    num_layers: int,
    dimension: int,
    query_heads: int,
    context_length: int,
    batch_size: int,
) -> None:
    """Invariante 5: INT8 consume la mitad que FP16 a igualdad de parámetros."""
    req_fp16 = _build(
        num_layers,
        dimension,
        query_heads,
        query_heads,
        context_length,
        batch_size,
        "fp16",
    )
    req_int8 = _build(
        num_layers,
        dimension,
        query_heads,
        query_heads,
        context_length,
        batch_size,
        "int8",
    )

    memory_fp16 = estimate_llm_costs(req_fp16).kv_cache_mha_gb
    memory_int8 = estimate_llm_costs(req_int8).kv_cache_mha_gb
    assume(memory_fp16 >= _PRECISION_FLOOR_GB)

    assert abs(memory_int8 - memory_fp16 * 0.5) <= _RESOLUTION_API_GB * 2


@given(
    query_heads=_query_heads,
    context_length=_context_length,
    window_size=st.integers(min_value=1, max_value=1048576),
    data=st.data(),
)
@_PROPERTY_SETTINGS
def test_composicion_gqa_swa_no_excede_factores_individuales(
    query_heads: int,
    context_length: int,
    window_size: int,
    data: st.DataObject,
) -> None:
    """La razón compuesta de la Ecuación (7) no supera sus factores."""
    kv_heads = data.draw(st.integers(min_value=1, max_value=query_heads))
    gqa_ratio = kv_heads / query_heads
    window_ratio = min(context_length, window_size) / context_length

    composed = compose_gqa_swa_ratio(
        query_heads=query_heads,
        kv_heads=kv_heads,
        context_length=context_length,
        window_size=window_size,
    )

    assert composed <= gqa_ratio + 1e-12
    assert composed <= window_ratio + 1e-12
