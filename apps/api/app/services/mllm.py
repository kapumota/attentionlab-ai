from __future__ import annotations

import math
import random

from app.schemas import ContrastiveBatchRequest, ContrastiveBatchResponse
from app.services.attention import stable_softmax


def contrastive_batch(req: ContrastiveBatchRequest) -> ContrastiveBatchResponse:
    rng = random.Random(7 + req.batch_size)
    n = req.batch_size
    similarities = req.similarities
    if similarities is None:
        similarities = []
        for i in range(n):
            row = []
            for j in range(n):
                value = rng.uniform(-0.2, 0.4)
                if i == j:
                    value += rng.uniform(0.6, 1.1)
                row.append(value)
            similarities.append(row)

    probabilities: list[list[float]] = []
    row_losses: list[float] = []
    for i, row in enumerate(similarities):
        scaled = [v / req.temperature for v in row]
        probs = stable_softmax(scaled)
        probabilities.append(probs)
        row_losses.append(-math.log(max(1e-12, probs[i])))

    return ContrastiveBatchResponse(
        probabilities=probabilities,
        row_losses=[round(v, 6) for v in row_losses],
        mean_loss=round(sum(row_losses) / len(row_losses), 6),
        alignment_pairs=[f"Imagen {i + 1} ↔ Texto {i + 1}" for i in range(n)],
    )
