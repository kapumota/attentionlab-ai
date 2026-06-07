// Estimaciones didácticas para el KV Cache Estimator.
// No sustituyen mediciones reales con hardware, perfiles CUDA o benchmarks.

import type { LlmMetrics, LlmMetricsConfig } from "../types";

export function calcularMetricasLlm(config: LlmMetricsConfig): LlmMetrics {
  const bytesPerFp16 = 2;
  const safeQueryHeads = Math.max(1, config.queryHeads);
  const safeKvHeads = Math.max(1, Math.min(config.kvHeads, safeQueryHeads));
  const safeWindow = Math.max(1, Math.min(config.windowSize, config.contextLength));

  // KV cache aproximado: capas * contexto * 2(K,V) * dimensión * bytes * batch.
  const kvCacheMhaGB =
    (config.layers * config.contextLength * 2 * config.dimension * bytesPerFp16 * config.batchSize) / 1e9;

  // GQA reduce KV cache compartiendo K/V entre grupos de heads de consulta.
  const kvCacheGqaGB = kvCacheMhaGB * (safeKvHeads / safeQueryHeads);

  // SWA conceptual: limita el contexto activo a una ventana local.
  const kvCacheSwaGB =
    (config.layers * safeWindow * 2 * config.dimension * bytesPerFp16 * config.batchSize) / 1e9;

  // MLA conceptual: cachea una representación latente comprimida.
  const kvCacheMlaGB =
    (config.layers * config.contextLength * 2 * config.mlaRank * bytesPerFp16 * config.batchSize) / 1e9;

  const longContextRelationsMillions = (config.contextLength * config.contextLength) / 1e6;

  // Métrica pedagógica: sube levemente con contexto largo y con KV muy comprimido.
  const approximatePerplexity =
    8 + Math.log2(Math.max(2, config.contextLength / 1024)) * 0.35 +
    (safeKvHeads < safeQueryHeads ? 0.15 : 0);

  // Métrica pedagógica: cae al crecer el contexto; mejora con más KV heads.
  const estimatedTokensPerSecond = Math.max(
    1,
    Math.round((1800 / Math.sqrt(config.contextLength / 1024)) * (safeKvHeads / safeQueryHeads + 0.35))
  );

  return {
    kvCacheMhaGB,
    kvCacheGqaGB,
    kvCacheSwaGB,
    kvCacheMlaGB,
    gqaVsMha: kvCacheGqaGB / Math.max(kvCacheMhaGB, 1e-9),
    swaVsMha: kvCacheSwaGB / Math.max(kvCacheMhaGB, 1e-9),
    mlaVsGqa: kvCacheMlaGB / Math.max(kvCacheGqaGB, 1e-9),
    longContextRelationsMillions,
    approximatePerplexity,
    estimatedTokensPerSecond
  };
}

export const computeLlmMetrics = calcularMetricasLlm;
