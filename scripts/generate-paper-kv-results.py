#!/usr/bin/env python3
"""Regenera las 71 configuraciones experimentales de KV cache del artículo.

El script reutiliza los servicios canónicos de Attention AI Lab y escribe tres
CSV deterministas: barrido de contexto (36), sensibilidad arquitectónica (15)
y sensibilidad a precisión (20). El total es 71 configuraciones.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path
from typing import Iterable

from app.schemas import LLMEstimateRequest
from app.services.llm_metrics import estimate_llm_costs
from app.services.sliding_window import swa_memory_gb

NUM_LAYERS = 32
DIMENSION = 4096
QUERY_HEADS = 32
BATCH_SIZE = 1
BASE_PRECISION = "fp16"

CONTEXTS = [4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576]
KV_HEADS = [32, 16, 8, 4, 2, 1]
WINDOWS = [2048, 4096, 8192, 16384, 32768]
LATENT_RANKS = [128, 256, 512, 1024]
PRECISIONS = ["fp32", "fp16", "bf16", "int8", "int4"]


def _request(
    *,
    context_length: int,
    kv_heads: int = QUERY_HEADS,
    mla_rank: int = 512,
    precision: str = BASE_PRECISION,
) -> LLMEstimateRequest:
    return LLMEstimateRequest(
        num_layers=NUM_LAYERS,
        dimension=DIMENSION,
        query_heads=QUERY_HEADS,
        kv_heads=kv_heads,
        mla_rank=mla_rank,
        context_length=context_length,
        batch_size=BATCH_SIZE,
        precision=precision,
        rope=True,
    )


def build_context_rows() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for context in CONTEXTS:
        base = estimate_llm_costs(_request(context_length=context))
        gqa = estimate_llm_costs(_request(context_length=context, kv_heads=8))
        latent = estimate_llm_costs(_request(context_length=context, mla_rank=512))
        values = {
            "MHA": base.kv_cache_mha_gb,
            "GQA-8 heads KV": gqa.kv_cache_gqa_gb,
            "SWA-4 096": round(
                swa_memory_gb(
                    NUM_LAYERS,
                    DIMENSION,
                    context,
                    4096,
                    BATCH_SIZE,
                    BASE_PRECISION,
                ),
                6,
            ),
            "Latente r=512": latent.kv_cache_mla_gb,
        }
        for method, value in values.items():
            rows.append(
                {
                    "experiment": "context",
                    "context": context,
                    "method": method,
                    "value_gb": value,
                }
            )
    return rows


def build_sensitivity_rows() -> list[dict[str, object]]:
    context = 131072
    rows: list[dict[str, object]] = []

    for kv_heads in KV_HEADS:
        result = estimate_llm_costs(
            _request(context_length=context, kv_heads=kv_heads)
        )
        rows.append(
            {
                "family": "GQA",
                "parameter": "kv_heads",
                "value": kv_heads,
                "memory_gb": result.kv_cache_gqa_gb,
                "ratio_to_mha": round(kv_heads / QUERY_HEADS, 6),
            }
        )

    for window in WINDOWS:
        memory_gb = round(
            swa_memory_gb(
                NUM_LAYERS,
                DIMENSION,
                context,
                window,
                BATCH_SIZE,
                BASE_PRECISION,
            ),
            6,
        )
        rows.append(
            {
                "family": "SWA",
                "parameter": "window",
                "value": window,
                "memory_gb": memory_gb,
                "ratio_to_mha": round(window / context, 6),
            }
        )

    for rank in LATENT_RANKS:
        result = estimate_llm_costs(
            _request(context_length=context, mla_rank=rank)
        )
        rows.append(
            {
                "family": "Latent",
                "parameter": "rank",
                "value": rank,
                "memory_gb": result.kv_cache_mla_gb,
                "ratio_to_mha": round(rank / DIMENSION, 6),
            }
        )

    return rows


def build_precision_rows() -> list[dict[str, object]]:
    context = 131072
    rows: list[dict[str, object]] = []
    for precision in PRECISIONS:
        base = estimate_llm_costs(
            _request(context_length=context, precision=precision)
        )
        gqa = estimate_llm_costs(
            _request(context_length=context, kv_heads=8, precision=precision)
        )
        latent = estimate_llm_costs(
            _request(context_length=context, mla_rank=512, precision=precision)
        )
        values = {
            "MHA": base.kv_cache_mha_gb,
            "GQA-8 heads KV": gqa.kv_cache_gqa_gb,
            "SWA-4 096": round(
                swa_memory_gb(
                    NUM_LAYERS,
                    DIMENSION,
                    context,
                    4096,
                    BATCH_SIZE,
                    precision,
                ),
                6,
            ),
            "Latente r=512": latent.kv_cache_mla_gb,
        }
        for method, memory_gb in values.items():
            rows.append(
                {
                    "precision": precision,
                    "method": method,
                    "memory_gb": memory_gb,
                }
            )
    return rows


def _write_csv(
    path: Path,
    fieldnames: list[str],
    rows: Iterable[dict[str, object]],
) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=fieldnames,
            lineterminator="\n",
        )
        writer.writeheader()
        writer.writerows(rows)


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def generate(output_dir: Path) -> dict[str, object]:
    output_dir.mkdir(parents=True, exist_ok=True)

    context_rows = build_context_rows()
    sensitivity_rows = build_sensitivity_rows()
    precision_rows = build_precision_rows()

    outputs = {
        "context_sweep.csv": (
            ["experiment", "context", "method", "value_gb"],
            context_rows,
        ),
        "sensitivity_128k.csv": (
            ["family", "parameter", "value", "memory_gb", "ratio_to_mha"],
            sensitivity_rows,
        ),
        "precision_128k.csv": (
            ["precision", "method", "memory_gb"],
            precision_rows,
        ),
    }

    for filename, (fieldnames, rows) in outputs.items():
        _write_csv(output_dir / filename, fieldnames, rows)

    counts = {
        "context_sweep": len(context_rows),
        "sensitivity_128k": len(sensitivity_rows),
        "precision_128k": len(precision_rows),
    }
    total = sum(counts.values())
    if total != 71:
        raise RuntimeError(f"se esperaban 71 configuraciones, se generaron {total}")

    manifest = {
        "schema_version": 1,
        "paper_configuration_count": total,
        "groups": counts,
        "assumptions": {
            "num_layers": NUM_LAYERS,
            "dimension": DIMENSION,
            "query_heads": QUERY_HEADS,
            "batch_size": BATCH_SIZE,
            "base_precision": BASE_PRECISION,
            "units": "GB decimales",
        },
        "files": {
            filename: {
                "rows": len(rows),
                "sha256": _sha256(output_dir / filename),
            }
            for filename, (_, rows) in outputs.items()
        },
    }
    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Regenera las 71 configuraciones de KV cache del artículo."
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/paper-kv-results"),
        help="Directorio de salida para CSV y manifest.json.",
    )
    args = parser.parse_args()

    manifest = generate(args.output_dir)
    print(
        f"Generadas {manifest['paper_configuration_count']} configuraciones en "
        f"{args.output_dir}"
    )


if __name__ == "__main__":
    main()
