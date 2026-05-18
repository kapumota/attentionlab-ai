// Núcleo de simulación de atención.
// Aquí se concentran la matriz base, las máscaras y el softmax.

import type { AttentionMode, AttentionResult, SimulationConfig } from "../types";
import { randomBetween, stableSoftmax } from "./math";

export function generateBaseSimilarityMatrix(n: number, mode: AttentionMode): number[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      let value = randomBetween(-0.35, 0.45);

      // Diagonal fuerte: par correcto, token consigo mismo o elemento más alineado.
      if (i === j) value += randomBetween(0.65, 1.05);

      // Sesgo local: tokens cercanos suelen tener relación semántica o sintáctica.
      const distance = Math.abs(i - j);
      value += Math.max(0, 0.28 - distance * 0.07);

      // En MLLMs y agentes agregamos relaciones no triviales fuera de la diagonal.
      if ((mode === "cross" || mode === "agente") && j === (i + 2) % n) {
        value += randomBetween(0.25, 0.55);
      }

      return value;
    })
  );
}

export function createAttentionMask(base: number[][], config: SimulationConfig): boolean[][] {
  const n = config.tokens;
  const mask = Array.from({ length: n }, () => Array(n).fill(true));

  if (config.mode === "causal") {
    // En un LLM autoregresivo, el token i no puede ver tokens futuros j > i.
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) mask[i][j] = j <= i;
    }
  }

  if (config.mode === "ventana") {
    // Sliding Window Attention: cada token atiende solo a vecinos cercanos.
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) mask[i][j] = Math.abs(i - j) <= config.windowSize;
    }
  }

  if (config.mode === "sparse") {
    // Sparse Top-k: conserva por fila las k claves con mayor puntaje.
    for (let i = 0; i < n; i++) {
      const sorted = [...Array(n).keys()].sort((a, b) => base[i][b] - base[i][a]);
      const allowed = new Set(sorted.slice(0, Math.min(config.topK, n)));
      for (let j = 0; j < n; j++) mask[i][j] = allowed.has(j);
    }
  }

  return mask;
}

export function computeAttention(base: number[][], config: SimulationConfig): AttentionResult {
  const mask = createAttentionMask(base, config);
  const scaledScores: number[][] = [];
  const probabilities: number[][] = [];

  for (let i = 0; i < config.tokens; i++) {
    const row: number[] = [];
    for (let j = 0; j < config.tokens; j++) {
      // El head de atención visualizado introduce una variación suave para que cada head
      // pueda mostrar un patrón distinto sin requerir un modelo real.
      const headVariation = Math.sin((i + 1) * (j + 2) * config.visualHead) * 0.15;
      const value = (base[i][j] + headVariation) / config.temperature;
      row.push(mask[i][j] ? value : -Infinity);
    }
    scaledScores.push(row);
    probabilities.push(stableSoftmax(row));
  }

  return { scaledScores, probabilities, mask };
}

export function estimateRelativeCost(config: SimulationConfig): number {
  if (config.mode === "ventana") return Math.min(1, (2 * config.windowSize + 1) / config.tokens);
  if (config.mode === "sparse") return Math.min(1, config.topK / config.tokens);
  if (config.mode === "gqa") return Math.max(0.06, config.kvHeads / config.queryHeads);
  if (config.mode === "causal") return 0.5;
  return 1;
}
