#!/usr/bin/env python3
from __future__ import annotations

from app.schemas import LLMEstimateRequest
from app.services.llm_metrics import estimate_llm_costs


SCENARIOS = [
    {
        "nombre": "MHA 32k baseline",
        "context_length": 32768,
        "query_heads": 32,
        "kv_heads": 32,
        "swa_window_size": 4096,
        "mla_rank": 512,
    },
    {
        "nombre": "GQA 64k eficiente",
        "context_length": 65536,
        "query_heads": 32,
        "kv_heads": 8,
        "swa_window_size": 4096,
        "mla_rank": 512,
    },
    {
        "nombre": "SWA 128k local",
        "context_length": 131072,
        "query_heads": 32,
        "kv_heads": 8,
        "swa_window_size": 4096,
        "mla_rank": 512,
    },
    {
        "nombre": "MLA conceptual 1M",
        "context_length": 1048576,
        "query_heads": 32,
        "kv_heads": 8,
        "swa_window_size": 8192,
        "mla_rank": 512,
    },
]


def calculate_swa_cache_gb(result, context_length: int, swa_window_size: int) -> float:
    """Calcula SWA como métrica derivada para el reporte reproducible."""
    active_context = min(context_length, swa_window_size)
    ratio = active_context / context_length
    return round(result.kv_cache_mha_gb * ratio, 6)


def calculate_swa_ratio(context_length: int, swa_window_size: int) -> float:
    """Calcula la razón conceptual SWA/MHA para documentación."""
    active_context = min(context_length, swa_window_size)
    return active_context / context_length


def build_request(scenario: dict[str, int | str]) -> LLMEstimateRequest:
    return LLMEstimateRequest(
        num_layers=32,
        dimension=4096,
        query_heads=int(scenario["query_heads"]),
        kv_heads=int(scenario["kv_heads"]),
        mla_rank=int(scenario["mla_rank"]),
        swa_window_size=int(scenario["swa_window_size"]),
        context_length=int(scenario["context_length"]),
        batch_size=1,
        precision="fp16",
        rope=True,
    )


def format_gb(value: float) -> str:
    return f"{value:.3f} GB"


def build_markdown_report() -> str:
    lines = [
        "### Resultado reproducible de KV Cache Estimator",
        "",
        "#### Supuestos",
        "",
        "- 32 capas.",
        "- Dimensión 4096.",
        "- Precisión fp16.",
        "- Batch size 1.",
        "- RoPE activado como codificación posicional conceptual.",
        "- Estimación didáctica, no benchmark real.",
        "",
        "#### Tabla de escenarios",
        "",
        "| Escenario | Contexto | MHA | GQA | SWA | MLA |",
        "| --- | ---: | ---: | ---: | ---: | ---: |",
    ]

    for scenario in SCENARIOS:
        result = estimate_llm_costs(build_request(scenario))
        lines.append(
            "| "
            f"{scenario['nombre']} | "
            f"{scenario['context_length']} | "
            f"{format_gb(result.kv_cache_mha_gb)} | "
            f"{format_gb(result.kv_cache_gqa_gb)} | "
            f"{format_gb(calculate_swa_cache_gb(result, context_length=scenario['context_length'], swa_window_size=scenario['swa_window_size']))} | "
            f"{format_gb(result.kv_cache_mla_gb)} |"
        )

    lines.extend(
        [
            "",
            "#### Interpretación",
            "",
            "- MHA sirve como baseline porque guarda keys y values para todas las heads.",
            "- GQA reduce memoria al usar menos KV heads que query heads.",
            "- SWA reduce memoria activa al limitar la ventana local conceptual.",
            "- MLA se modela como cache latente de menor rango.",
            "",
            "#### Límite",
            "",
            "Este reporte no mide kernels, latencia real ni memoria GPU. Sirve para validar consistencia matemática del estimador.",
        ]
    )

    return "\n".join(lines) + "\n"


def main() -> None:
    print(build_markdown_report())


if __name__ == "__main__":
    main()
