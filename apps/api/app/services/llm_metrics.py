from __future__ import annotations

import math

from app.schemas import LLMEstimateRequest, LLMEstimateResponse

_BYTES_BY_PRECISION = {
    "fp32": 4,
    "fp16": 2,
    "bf16": 2,
    "int8": 1,
    "int4": 0.5,
}


def estimar_costos_llm(req: LLMEstimateRequest) -> LLMEstimateResponse:
    bytes_per_value = _BYTES_BY_PRECISION[req.precision]
    safe_heads = max(1, req.query_heads)
    safe_kv_heads = min(req.kv_heads, safe_heads)
    safe_swa_window = min(req.context_length, req.swa_window_size)

    kv_mha_gb = req.num_layers * req.context_length * 2 * req.dimension * bytes_per_value * req.batch_size / 1e9
    kv_gqa_gb = kv_mha_gb * (safe_kv_heads / safe_heads)
    kv_swa_gb = req.num_layers * safe_swa_window * 2 * req.dimension * bytes_per_value * req.batch_size / 1e9
    kv_mla_gb = req.num_layers * req.context_length * 2 * req.mla_rank * bytes_per_value * req.batch_size / 1e9
    relations = (req.context_length * req.context_length) / 1e6
    perplexity_proxy = 8 + math.log2(max(2, req.context_length / 1024)) * 0.35 + (0.15 if safe_kv_heads < safe_heads else 0)
    tokens_per_second_proxy = max(1, round(1800 / math.sqrt(req.context_length / 1024) * (safe_kv_heads / safe_heads + 0.35)))

    notes = [
        "Estimación didáctica, no benchmark real de GPU.",
        "GQA reduce KV cache compartiendo claves/valores entre query heads.",
        "SWA limita el contexto activo a una ventana local conceptual.",
        "MLA representa el KV cache mediante un rango latente comprimido.",
    ]
    if req.rope:
        notes.append("RoPE activado como codificación posicional conceptual.")

    return LLMEstimateResponse(
        kv_cache_mha_gb=round(kv_mha_gb, 6),
        kv_cache_gqa_gb=round(kv_gqa_gb, 6),
        kv_cache_swa_gb=round(kv_swa_gb, 6),
        kv_cache_mla_gb=round(kv_mla_gb, 6),
        gqa_vs_mha_ratio=round(kv_gqa_gb / max(kv_mha_gb, 1e-9), 6),
        swa_vs_mha_ratio=round(kv_swa_gb / max(kv_mha_gb, 1e-9), 6),
        mla_vs_gqa_ratio=round(kv_mla_gb / max(kv_gqa_gb, 1e-9), 6),
        long_context_relations_millions=round(relations, 3),
        perplexity_proxy=round(perplexity_proxy, 3),
        tokens_per_second_proxy=tokens_per_second_proxy,
        notes=notes,
    )


estimate_llm_costs = estimar_costos_llm
