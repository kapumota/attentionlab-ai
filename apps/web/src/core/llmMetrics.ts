// Estimaciones didácticas para el playground LLM.
// No sustituyen mediciones reales con hardware, perfiles CUDA o benchmarks.

import type { LlmMetrics, LlmMetricsConfig } from "../types";

export function computeLlmMetrics(config: LlmMetricsConfig): LlmMetrics {
  const bytesPerFp16 = 2;

  // KV cache aproximado: capas * contexto * 2(K,V) * dimensión * bytes * batch.
  const kvCacheMhaGB =
    (config.layers * config.contextLength * 2 * config.dimension * bytesPerFp16 * config.batchSize) / 1e9;

  // GQA reduce el KV cache compartiendo K/V entre grupos de heads de consulta.
  const kvCacheGqaGB = kvCacheMhaGB * (config.kvHeads / config.queryHeads);

  // MLA conceptual: cachea una representación latente comprimida.
  const kvCacheMlaGB =
    (config.layers * config.contextLength * 2 * config.mlaRank * bytesPerFp16 * config.batchSize) / 1e9;

  const longContextRelationsMillions = (config.contextLength * config.contextLength) / 1e6;

  // Métrica pedagógica: sube levemente con contexto largo y con KV muy comprimido.
  const approximatePerplexity =
    8 + Math.log2(Math.max(2, config.contextLength / 1024)) * 0.35 +
    (config.kvHeads < config.queryHeads ? 0.15 : 0);

  // Métrica pedagógica: cae al crecer el contexto; mejora con más KV heads.
  const estimatedTokensPerSecond = Math.max(
    1,
    Math.round((1800 / Math.sqrt(config.contextLength / 1024)) * (config.kvHeads / config.queryHeads + 0.35))
  );

  return {
    kvCacheMhaGB,
    kvCacheGqaGB,
    kvCacheMlaGB,
    gqaVsMha: kvCacheGqaGB / Math.max(kvCacheMhaGB, 1e-9),
    mlaVsGqa: kvCacheMlaGB / Math.max(kvCacheGqaGB, 1e-9),
    longContextRelationsMillions,
    approximatePerplexity,
    estimatedTokensPerSecond
  };
}
