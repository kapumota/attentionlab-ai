#!/usr/bin/env python3
"""Comprobación empírica de storage de KV cache con PyTorch en CPU.

Cada medición se ejecuta en un proceso nuevo. El tensor se materializa y se toca
para comprometer sus páginas. Se comparan bytes lógicos, bytes del storage de
PyTorch y el incremento de RSS del proceso. Esta comprobación no representa
memoria física de un runtime de inferencia ni profiling de GPU.
"""
from __future__ import annotations

import argparse
import csv
import gc
import json
import os
import statistics
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path

import psutil


@dataclass(frozen=True)
class Scenario:
    name: str
    layers: int
    context: int
    dimension: int
    batch: int
    dtype: str

    @property
    def bytes_per_value(self) -> int:
        return {"float16": 2, "float32": 4}[self.dtype]

    @property
    def logical_bytes(self) -> int:
        return self.layers * self.context * 2 * self.dimension * self.bytes_per_value * self.batch


SCENARIOS = {
    "mha": Scenario("MHA", layers=4, context=8192, dimension=1024, batch=1, dtype="float16"),
    "gqa": Scenario("GQA-4/16", layers=4, context=8192, dimension=256, batch=1, dtype="float16"),
}


def worker(key: str) -> None:
    import torch

    scenario = SCENARIOS[key]
    process = psutil.Process(os.getpid())
    gc.collect()
    rss_before = process.memory_info().rss
    dtype = {"float16": torch.float16, "float32": torch.float32}[scenario.dtype]
    tensor = torch.empty(
        (scenario.layers, 2, scenario.batch, scenario.context, scenario.dimension),
        dtype=dtype,
        device="cpu",
    )
    tensor.fill_(1.0)
    _ = float(tensor.reshape(-1)[::4096].sum().item())
    time.sleep(0.05)
    rss_after = process.memory_info().rss
    storage_bytes = tensor.untyped_storage().nbytes()
    print(
        json.dumps(
            {
                "scenario": scenario.name,
                "logical_bytes": scenario.logical_bytes,
                "storage_bytes": storage_bytes,
                "rss_delta_bytes": max(0, rss_after - rss_before),
                "torch_version": torch.__version__,
                "device": "cpu",
            }
        )
    )


def run_parent(repetitions: int, output: Path) -> None:
    rows: list[dict[str, object]] = []
    env = os.environ.copy()
    env.setdefault("OMP_NUM_THREADS", "1")
    env.setdefault("MKL_NUM_THREADS", "1")

    for key, scenario in SCENARIOS.items():
        samples: list[dict[str, object]] = []
        for _ in range(repetitions):
            result = subprocess.run(
                [sys.executable, __file__, "--worker", key],
                check=True,
                text=True,
                capture_output=True,
                env=env,
            )
            samples.append(json.loads(result.stdout.strip().splitlines()[-1]))

        logical = int(samples[0]["logical_bytes"])
        storage = int(samples[0]["storage_bytes"])
        rss_values = [int(sample["rss_delta_bytes"]) for sample in samples]
        rss_median = int(statistics.median(rss_values))
        rows.append(
            {
                "scenario": scenario.name,
                "layers": scenario.layers,
                "context_tokens": scenario.context,
                "cached_dimension": scenario.dimension,
                "dtype": scenario.dtype,
                "analytical_mb": logical / 1e6,
                "pytorch_storage_mb": storage / 1e6,
                "storage_relative_error_pct": 100.0 * abs(storage - logical) / logical,
                "rss_delta_median_mb": rss_median / 1e6,
                "rss_over_logical_pct": 100.0 * (rss_median - logical) / logical,
                "repetitions": repetitions,
                "device": samples[0]["device"],
                "torch_version": samples[0]["torch_version"],
            }
        )

    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(json.dumps(rows, indent=2, ensure_ascii=False))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--worker", choices=SCENARIOS.keys())
    parser.add_argument("--repetitions", type=int, default=5)
    parser.add_argument("--output", type=Path, default=Path("data/pytorch_memory_profile.csv"))
    args = parser.parse_args()
    if args.worker:
        worker(args.worker)
    else:
        run_parent(args.repetitions, args.output)


if __name__ == "__main__":
    main()
