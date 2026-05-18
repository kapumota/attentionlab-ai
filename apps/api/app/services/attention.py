from __future__ import annotations

import math
import random
from typing import Iterable

from app.schemas import AttentionResponse, SimulationConfig


def generate_base_matrix(n: int, mode: str) -> list[list[float]]:
    """Genera una matriz didáctica de similitudes.

    La diagonal se refuerza para simular pares correctos o tokens altamente relacionados.
    """
    rng = random.Random(42 + n + len(mode))
    matrix: list[list[float]] = []
    for i in range(n):
        row: list[float] = []
        for j in range(n):
            value = rng.uniform(-0.35, 0.45)
            if i == j:
                value += rng.uniform(0.65, 1.05)
            distance = abs(i - j)
            value += max(0.0, 0.28 - distance * 0.07)
            if mode in {"cross", "agente"} and j == (i + 2) % n:
                value += rng.uniform(0.25, 0.55)
            row.append(value)
        matrix.append(row)
    return matrix


def create_mask(matrix: list[list[float]], config: SimulationConfig) -> list[list[bool]]:
    n = len(matrix)
    mask = [[True for _ in range(n)] for _ in range(n)]

    if config.mode == "causal":
        for i in range(n):
            for j in range(n):
                mask[i][j] = j <= i

    if config.mode == "ventana":
        for i in range(n):
            for j in range(n):
                mask[i][j] = abs(i - j) <= config.window_size

    if config.mode == "sparse":
        k = min(config.top_k, n)
        for i, row in enumerate(matrix):
            ranked = sorted(range(n), key=lambda idx: row[idx], reverse=True)
            allowed = set(ranked[:k])
            for j in range(n):
                mask[i][j] = j in allowed

    return mask


def stable_softmax(values: Iterable[float | None]) -> list[float]:
    finite = [v for v in values if v is not None and math.isfinite(v)]
    if not finite:
        return [0.0 for _ in values]
    max_value = max(finite)
    exp_values = [math.exp((v or 0.0) - max_value) if v is not None and math.isfinite(v) else 0.0 for v in values]
    total = sum(exp_values)
    return [v / total if total else 0.0 for v in exp_values]


def relative_cost(config: SimulationConfig, n: int) -> float:
    if config.mode == "ventana":
        return min(1.0, (2 * config.window_size + 1) / n)
    if config.mode == "sparse":
        return min(1.0, config.top_k / n)
    if config.mode == "gqa":
        return max(0.06, min(config.kv_heads, config.query_heads) / config.query_heads)
    if config.mode == "causal":
        return 0.5
    return 1.0


def compute_attention(config: SimulationConfig, matrix: list[list[float]] | None = None) -> AttentionResponse:
    n = config.tokens
    base = matrix or generate_base_matrix(n, config.mode)
    mask = create_mask(base, config)

    scores: list[list[float | None]] = []
    probabilities: list[list[float]] = []

    for i in range(n):
        score_row: list[float | None] = []
        for j in range(n):
            head_variation = math.sin((i + 1) * (j + 2) * config.visual_head) * 0.15
            value = (base[i][j] + head_variation) / config.temperature
            score_row.append(value if mask[i][j] else None)
        scores.append(score_row)
        probabilities.append(stable_softmax(score_row))

    row_losses: list[float] = []
    for i, row in enumerate(probabilities):
        p = max(1e-12, row[min(i, len(row) - 1)])
        row_losses.append(-math.log(p))

    focused_loss = row_losses[0] if row_losses else 0.0
    max_probability = max(max(row) for row in probabilities) if probabilities else 0.0

    return AttentionResponse(
        scores=scores,
        probabilities=probabilities,
        mask=mask,
        row_losses=row_losses,
        focused_row_loss=focused_loss,
        max_probability=max_probability,
        relative_cost=relative_cost(config, n),
    )
