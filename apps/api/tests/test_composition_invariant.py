from __future__ import annotations

import pytest

from app.schemas import LLMEstimateRequest
from app.services.composition import apply_sliding_window_ratio, compose_gqa_swa_ratio
from app.services.llm_metrics import estimate_llm_costs


def test_composicion_gqa_swa_reproduce_escenario_del_articulo():
    """Reproduce GQA-8 + SWA-8192 a 1 048 576 tokens en FP16."""
    req = LLMEstimateRequest(
        num_layers=32,
        dimension=4096,
        query_heads=32,
        kv_heads=8,
        mla_rank=512,
        context_length=1048576,
        batch_size=1,
        precision="fp16",
        rope=True,
    )
    result = estimate_llm_costs(req)

    assert result.kv_cache_mha_gb == pytest.approx(549.755814, abs=1e-6)
    assert result.kv_cache_gqa_gb == pytest.approx(137.438953, abs=1e-6)

    composed_gb = apply_sliding_window_ratio(
        base_gb=result.kv_cache_gqa_gb,
        context_length=req.context_length,
        window_size=8192,
    )
    assert composed_gb == pytest.approx(1.073741824, abs=1e-6)

    ratio = compose_gqa_swa_ratio(
        query_heads=req.query_heads,
        kv_heads=req.kv_heads,
        context_length=req.context_length,
        window_size=8192,
    )
    assert ratio == pytest.approx((8 / 32) * (8192 / 1048576), rel=1e-12)
    assert result.kv_cache_mha_gb * ratio == pytest.approx(composed_gb, abs=1e-6)


def test_composicion_es_independiente_del_orden_de_aplicacion():
    base_mha_gb = 549.755814
    query_heads = 32
    kv_heads = 8
    context_length = 1048576
    window_size = 8192

    gqa_then_swa = apply_sliding_window_ratio(
        base_gb=base_mha_gb * (kv_heads / query_heads),
        context_length=context_length,
        window_size=window_size,
    )
    direct = base_mha_gb * compose_gqa_swa_ratio(
        query_heads=query_heads,
        kv_heads=kv_heads,
        context_length=context_length,
        window_size=window_size,
    )

    assert gqa_then_swa == pytest.approx(direct, rel=1e-12)


def test_swa_no_reduce_si_la_ventana_cubre_el_contexto():
    assert apply_sliding_window_ratio(10.0, 4096, 8192) == pytest.approx(10.0)
    assert compose_gqa_swa_ratio(32, 8, 4096, 8192) == pytest.approx(0.25)


@pytest.mark.parametrize(
    ("base_gb", "context_length", "window_size"),
    [
        (-1.0, 1024, 512),
        (float("nan"), 1024, 512),
        (float("inf"), 1024, 512),
        (1.0, 0, 512),
        (1.0, 1024, 0),
    ],
)
def test_apply_sliding_window_ratio_rechaza_parametros_invalidos(
    base_gb: float,
    context_length: int,
    window_size: int,
):
    with pytest.raises(ValueError):
        apply_sliding_window_ratio(base_gb, context_length, window_size)


@pytest.mark.parametrize(
    ("query_heads", "kv_heads", "context_length", "window_size"),
    [
        (0, 1, 1024, 512),
        (32, 0, 1024, 512),
        (8, 16, 1024, 512),
        (32, 8, 0, 512),
        (32, 8, 1024, 0),
    ],
)
def test_compose_gqa_swa_ratio_rechaza_parametros_invalidos(
    query_heads: int,
    kv_heads: int,
    context_length: int,
    window_size: int,
):
    with pytest.raises(ValueError):
        compose_gqa_swa_ratio(query_heads, kv_heads, context_length, window_size)
