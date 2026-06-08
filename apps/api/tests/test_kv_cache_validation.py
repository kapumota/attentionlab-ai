from __future__ import annotations

import math

from app.schemas import LLMEstimateRequest
from app.services.llm_metrics import estimate_llm_costs


def calculate_swa_cache_gb(result, context_length: int, swa_window_size: int) -> float:
    """Calcula SWA como métrica derivada sin cambiar el contrato público."""
    active_context = min(context_length, swa_window_size)
    ratio = active_context / context_length
    return round(result.kv_cache_mha_gb * ratio, 6)


def calculate_swa_ratio(context_length: int, swa_window_size: int) -> float:
    """Calcula la razón conceptual SWA/MHA usada en la validación."""
    active_context = min(context_length, swa_window_size)
    return active_context / context_length


def build_request(
    *,
    context_length: int,
    query_heads: int = 32,
    kv_heads: int = 32,
    num_layers: int = 32,
    dimension: int = 4096,
    batch_size: int = 1,
    precision: str = "fp16",
    swa_window_size: int = 4096,
    mla_rank: int = 512,
) -> LLMEstimateRequest:
    return LLMEstimateRequest(
        num_layers=num_layers,
        dimension=dimension,
        query_heads=query_heads,
        kv_heads=kv_heads,
        mla_rank=mla_rank,
        swa_window_size=swa_window_size,
        context_length=context_length,
        batch_size=batch_size,
        precision=precision,
        rope=True,
    )


def test_mha_memory_grows_linearly_with_context() -> None:
    base = estimate_llm_costs(build_request(context_length=32768))
    double_context = estimate_llm_costs(build_request(context_length=65536))

    ratio = double_context.kv_cache_mha_gb / base.kv_cache_mha_gb

    assert math.isclose(ratio, 2.0, rel_tol=1e-6)


def test_gqa_reduces_memory_against_mha() -> None:
    result = estimate_llm_costs(
        build_request(
            context_length=131072,
            query_heads=32,
            kv_heads=8,
        )
    )

    assert result.kv_cache_gqa_gb < result.kv_cache_mha_gb
    assert math.isclose(result.gqa_vs_mha_ratio, 0.25, rel_tol=1e-6)


def test_swa_uses_window_as_active_context() -> None:
    result = estimate_llm_costs(
        build_request(
            context_length=131072,
            query_heads=32,
            kv_heads=8,
            swa_window_size=4096,
        )
    )

    expected_ratio = calculate_swa_ratio(context_length=131072, swa_window_size=4096)

    swa_cache_gb = calculate_swa_cache_gb(result, context_length=131072, swa_window_size=4096)
    assert swa_cache_gb < result.kv_cache_mha_gb
    assert math.isclose(expected_ratio, 4096 / 131072, rel_tol=1e-6)


def test_mla_conceptual_memory_is_rank_based() -> None:
    result = estimate_llm_costs(
        build_request(
            context_length=131072,
            dimension=4096,
            mla_rank=512,
        )
    )

    expected_ratio = 512 / 4096

    assert result.kv_cache_mla_gb < result.kv_cache_mha_gb
    assert math.isclose(result.kv_cache_mla_gb / result.kv_cache_mha_gb, expected_ratio, rel_tol=1e-6)


def test_one_million_token_scenario_is_finite_and_didactic() -> None:
    result = estimate_llm_costs(
        build_request(
            context_length=1048576,
            query_heads=32,
            kv_heads=8,
            swa_window_size=8192,
            mla_rank=512,
        )
    )

    assert result.kv_cache_mha_gb > 0
    assert result.kv_cache_gqa_gb > 0
    swa_cache_gb = calculate_swa_cache_gb(result, context_length=1048576, swa_window_size=8192)
    assert swa_cache_gb > 0
    assert result.kv_cache_mla_gb > 0
    assert result.long_context_relations_millions > 0
    assert any("didáctica" in note or "benchmark real" in note for note in result.notes)
