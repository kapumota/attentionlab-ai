import type { BuilderConfig, SimulationConfig } from "../types";
import { calcularMetricasLlm } from "../core/llmMetrics";
import { CopyButton } from "./CopyButton";

interface Props {
  config: SimulationConfig;
  builder: BuilderConfig;
  contextLength: number;
  batchSize: number;
  onContextLengthChange: (value: number) => void;
  onBatchSizeChange: (value: number) => void;
  onApplyHeroPreset?: (preset: KvHeroPreset) => void;
}

export interface KvHeroPreset {
  id: string;
  title: string;
  description: string;
  contextLength: number;
  batchSize: number;
  config: Pick<SimulationConfig, "mode" | "queryHeads" | "kvHeads" | "tokens" | "windowSize">;
  builder: Pick<BuilderConfig, "numLayers" | "dimension" | "blockType" | "windowSize" | "mlaRank" | "rope">;
}

interface KvBar {
  label: string;
  value: number;
  detail: string;
}

const escenariosContexto = [32768, 65536, 131072, 1048576];

const heroPresets: KvHeroPreset[] = [
  {
    id: "mha-32k-baseline",
    title: "MHA baseline 32k",
    description: "Referencia para explicar el costo completo de guardar K/V por cada head.",
    contextLength: 32768,
    batchSize: 1,
    config: { mode: "causal", queryHeads: 16, kvHeads: 16, tokens: 12, windowSize: 4096 },
    builder: { numLayers: 24, dimension: 2048, blockType: "mha", windowSize: 4096, mlaRank: 128, rope: true }
  },
  {
    id: "gqa-128k-efficient",
    title: "GQA eficiente 128k",
    description: "Muestra cómo compartir K/V reduce memoria en contexto largo.",
    contextLength: 131072,
    batchSize: 1,
    config: { mode: "gqa", queryHeads: 32, kvHeads: 8, tokens: 12, windowSize: 4096 },
    builder: { numLayers: 32, dimension: 4096, blockType: "gqa", windowSize: 4096, mlaRank: 256, rope: true }
  },
  {
    id: "swa-128k-local",
    title: "SWA local 128k",
    description: "Compara una ventana local contra atención global para entender contexto activo.",
    contextLength: 131072,
    batchSize: 1,
    config: { mode: "ventana", queryHeads: 32, kvHeads: 8, tokens: 12, windowSize: 4096 },
    builder: { numLayers: 32, dimension: 4096, blockType: "swa_gqa", windowSize: 4096, mlaRank: 256, rope: true }
  },
  {
    id: "mla-1m-compressed",
    title: "MLA conceptual 1M",
    description: "Usa un rank latente para explicar compresión extrema de KV cache.",
    contextLength: 1048576,
    batchSize: 1,
    config: { mode: "gqa", queryHeads: 64, kvHeads: 8, tokens: 12, windowSize: 8192 },
    builder: { numLayers: 40, dimension: 5120, blockType: "mla", windowSize: 8192, mlaRank: 512, rope: true }
  }
];

function formatearGb(value: number) {
  if (value >= 1) return `${value.toFixed(2)} GB`;
  return `${(value * 1024).toFixed(1)} MB`;
}

function calcularAnchoBarra(value: number, max: number) {
  if (max <= 0) return "0%";
  return `${Math.max(4, Math.min(100, (value / max) * 100)).toFixed(1)}%`;
}

function calcularAhorroPorcentual(base: number, value: number) {
  if (base <= 0) return 0;
  return Math.max(0, Math.min(100, (1 - value / base) * 100));
}

function construirReporteMarkdown(params: {
  contextLength: number;
  batchSize: number;
  builder: BuilderConfig;
  config: SimulationConfig;
  metrics: ReturnType<typeof calcularMetricasLlm>;
}) {
  const { contextLength, batchSize, builder, config, metrics } = params;
  return `### Reporte KV Cache Estimator

#### Configuración

- Contexto: ${contextLength.toLocaleString()} tokens
- Batch: ${batchSize}
- Capas: ${builder.numLayers}
- Dimensión: ${builder.dimension}
- Query heads: ${config.queryHeads}
- KV heads: ${config.kvHeads}
- Ventana SWA: ${builder.windowSize}
- MLA rank: ${builder.mlaRank}

#### Resultados

- MHA: ${formatearGb(metrics.kvCacheMhaGB)}
- GQA: ${formatearGb(metrics.kvCacheGqaGB)}
- SWA: ${formatearGb(metrics.kvCacheSwaGB)}
- MLA: ${formatearGb(metrics.kvCacheMlaGB)}

#### Advertencia

Este estimador es didáctico. No reemplaza profiling real, benchmarks de GPU ni mediciones de memoria en producción.
`;
}

function KvBarRow({ bar, max }: { bar: KvBar; max: number }) {
  return (
    <div className="llm-bar-row">
      <div className="llm-bar-label">
        <strong>{bar.label}</strong>
        <small>{bar.detail}</small>
      </div>
      <div className="llm-bar-track" aria-label={`${bar.label}: ${formatearGb(bar.value)}`}>
        <div style={{ width: calcularAnchoBarra(bar.value, max) }} />
      </div>
      <span>{formatearGb(bar.value)}</span>
    </div>
  );
}

export function LLMPlayground({ config, builder, contextLength, batchSize, onContextLengthChange, onBatchSizeChange, onApplyHeroPreset }: Props) {
  const metrics = calcularMetricasLlm({
    contextLength,
    batchSize,
    dimension: builder.dimension,
    layers: builder.numLayers,
    queryHeads: config.queryHeads,
    kvHeads: config.kvHeads,
    mlaRank: builder.mlaRank,
    rope: builder.rope,
    windowSize: builder.windowSize
  });

  const kvBars: KvBar[] = [
    {
      label: "MHA",
      value: metrics.kvCacheMhaGB,
      detail: "baseline con todas las key/value heads"
    },
    {
      label: "GQA",
      value: metrics.kvCacheGqaGB,
      detail: "reduce memoria usando menos KV heads"
    },
    {
      label: "SWA",
      value: metrics.kvCacheSwaGB,
      detail: `limita contexto activo a ventana ${builder.windowSize}`
    },
    {
      label: "MLA",
      value: metrics.kvCacheMlaGB,
      detail: "usa representación latente comprimida"
    }
  ];

  const maxKv = Math.max(...kvBars.map((bar) => bar.value), 1e-9);
  const contextSeries = escenariosContexto.map((length) => {
    const values = calcularMetricasLlm({
      contextLength: length,
      batchSize,
      dimension: builder.dimension,
      layers: builder.numLayers,
      queryHeads: config.queryHeads,
      kvHeads: config.kvHeads,
      mlaRank: builder.mlaRank,
      rope: builder.rope,
      windowSize: builder.windowSize
    });
    return {
      length,
      mha: values.kvCacheMhaGB,
      gqa: values.kvCacheGqaGB,
      swa: values.kvCacheSwaGB,
      mla: values.kvCacheMlaGB
    };
  });
  const maxSeries = Math.max(...contextSeries.map((item) => item.mha), 1e-9);
  const comparisonRows = [
    {
      label: "MHA",
      kvCache: metrics.kvCacheMhaGB,
      relativeCost: 1,
      savings: 0,
      tokensPerSecond: Math.max(1, Math.round(metrics.estimatedTokensPerSecond * Math.max(1, 1 / Math.max(metrics.gqaVsMha, 0.01))))
    },
    {
      label: "GQA",
      kvCache: metrics.kvCacheGqaGB,
      relativeCost: metrics.gqaVsMha,
      savings: calcularAhorroPorcentual(metrics.kvCacheMhaGB, metrics.kvCacheGqaGB),
      tokensPerSecond: metrics.estimatedTokensPerSecond
    },
    {
      label: "SWA",
      kvCache: metrics.kvCacheSwaGB,
      relativeCost: metrics.swaVsMha,
      savings: calcularAhorroPorcentual(metrics.kvCacheMhaGB, metrics.kvCacheSwaGB),
      tokensPerSecond: Math.max(1, Math.round(metrics.estimatedTokensPerSecond / Math.max(0.2, metrics.swaVsMha)))
    },
    {
      label: "MLA",
      kvCache: metrics.kvCacheMlaGB,
      relativeCost: metrics.gqaVsMha * metrics.mlaVsGqa,
      savings: calcularAhorroPorcentual(metrics.kvCacheMhaGB, metrics.kvCacheMlaGB),
      tokensPerSecond: Math.max(1, Math.round(metrics.estimatedTokensPerSecond / Math.max(0.35, metrics.mlaVsGqa)))
    }
  ];

  const readmeExplanation = `KV Cache Estimator compara memoria aproximada para MHA, GQA, SWA y MLA con contexto ${contextLength}, batch ${batchSize}, ${builder.numLayers} capas y dimensión ${builder.dimension}. GQA reduce memoria usando ${config.kvHeads} KV heads frente a ${config.queryHeads} query heads; SWA limita el contexto activo a una ventana de ${builder.windowSize}; MLA comprime a rank ${builder.mlaRank}.`;

  const comparisonPayload = JSON.stringify({
    module: "KV Cache Estimator",
    disclaimer: "Estimador didáctico, no benchmark real.",
    contextLength,
    batchSize,
    layers: builder.numLayers,
    dimension: builder.dimension,
    queryHeads: config.queryHeads,
    kvHeads: config.kvHeads,
    swaWindowSize: builder.windowSize,
    mlaRank: builder.mlaRank,
    comparison: comparisonRows.map((row) => ({
      label: row.label,
      kvCacheGB: Number(row.kvCache.toFixed(4)),
      relativeCost: Number(row.relativeCost.toFixed(4)),
      savingsPercent: Number(row.savings.toFixed(2)),
      estimatedTokensPerSecond: row.tokensPerSecond
    }))
  }, null, 2);

  const markdownReport = construirReporteMarkdown({ contextLength, batchSize, builder, config, metrics });

  return (
    <section className="panel seccion llm-playground-visual">
      <p className="eyebrow">Hero feature · sistemas LLM</p>
      <h2>KV Cache Estimator</h2>
      <p className="mini-aviso">
        Compara memoria aproximada de KV cache para MHA, GQA, SWA y MLA en contexto largo. Las cifras son didácticas: sirven para explicar tendencias de arquitectura, no para reemplazar benchmarking real.
      </p>

      <div className="kv-warning-card" role="note">
        <strong>Advertencia técnica</strong>
        <p>
          Este módulo estima memoria de forma conceptual. No mide kernels CUDA, paginación real, memoria de activaciones, overhead del runtime ni optimizaciones específicas de un proveedor.
        </p>
      </div>

      <div className="copy-action-grid module-copy-actions">
        <CopyButton text={readmeExplanation}>Copiar explicación</CopyButton>
        <CopyButton text={comparisonPayload}>Copiar JSON</CopyButton>
        <CopyButton text={markdownReport}>Copiar Markdown</CopyButton>
      </div>

      <div className="kv-preset-grid" aria-label="Presets conceptuales de KV Cache Estimator">
        {heroPresets.map((preset) => (
          <button key={preset.id} type="button" className="kv-preset-card" onClick={() => onApplyHeroPreset?.(preset)}>
            <strong>{preset.title}</strong>
            <span>{preset.description}</span>
            <small>{preset.contextLength.toLocaleString()} tokens · batch {preset.batchSize}</small>
          </button>
        ))}
      </div>

      <div className="kv-scenario-strip" aria-label="Escenarios de contexto largo">
        {escenariosContexto.map((length) => (
          <button key={length} type="button" onClick={() => onContextLengthChange(length)} className={length === contextLength ? "active" : ""}>
            {length >= 1000000 ? "1M" : `${Math.round(length / 1024)}k`}
          </button>
        ))}
      </div>

      <div className="builder-grid llm-visual-grid">
        <div className="llm-control-panel">
          <label htmlFor="llmContextLength">Longitud de contexto: <span className="valor-control">{contextLength.toLocaleString()}</span></label>
          <input id="llmContextLength" type="range" min="1024" max="1048576" step="1024" value={contextLength} onChange={(e) => onContextLengthChange(Number(e.target.value))} />

          <label htmlFor="llmBatchSize">Batch de inferencia: <span className="valor-control">{batchSize}</span></label>
          <input id="llmBatchSize" type="range" min="1" max="16" step="1" value={batchSize} onChange={(e) => onBatchSizeChange(Number(e.target.value))} />

          <div className="llm-summary-cards" aria-label="Métricas principales de KV Cache Estimator">
            <article>
              <span>GQA vs MHA</span>
              <strong>{metrics.gqaVsMha.toFixed(2)}x</strong>
              <small>{calcularAhorroPorcentual(metrics.kvCacheMhaGB, metrics.kvCacheGqaGB).toFixed(1)}% menos memoria</small>
            </article>
            <article>
              <span>SWA vs MHA</span>
              <strong>{metrics.swaVsMha.toFixed(2)}x</strong>
              <small>ventana activa {builder.windowSize.toLocaleString()}</small>
            </article>
            <article>
              <span>MLA vs GQA</span>
              <strong>{metrics.mlaVsGqa.toFixed(2)}x</strong>
              <small>rank latente {builder.mlaRank}</small>
            </article>
          </div>
        </div>

        <div className="llm-chart-panel">
          <div className="chart-header">
            <div>
              <p className="eyebrow">Gráfico de barras</p>
              <h3>KV cache aproximado</h3>
            </div>
            <span className="status-badge ok"><span className="status-dot" aria-hidden="true" />Batch {batchSize}</span>
          </div>

          <div className="llm-bar-chart" role="img" aria-label="Comparación de KV cache aproximado entre MHA, GQA, SWA y MLA">
            {kvBars.map((bar) => <KvBarRow key={bar.label} bar={bar} max={maxKv} />)}
          </div>

          <div className="llm-interpretation-card">
            <strong>Interpretación didáctica</strong>
            <p>
              MHA guarda K/V para todas las heads. GQA reduce memoria al compartir K/V. SWA limita el contexto activo por ventana local. MLA comprime la representación cacheada mediante un rank latente.
            </p>
          </div>
        </div>
      </div>

      <div className="llm-comparison-panel">
        <div className="chart-header">
          <div>
            <p className="eyebrow">Panel de comparación</p>
            <h3>MHA vs GQA vs SWA vs MLA</h3>
          </div>
          <span className="status-badge ok"><span className="status-dot" aria-hidden="true" />Comparación lista</span>
        </div>

        <div className="comparison-table" role="table" aria-label="Comparación MHA GQA SWA MLA">
          <div className="comparison-row header" role="row">
            <strong>Configuración</strong>
            <strong>KV cache</strong>
            <strong>Costo relativo</strong>
            <strong>Ahorro</strong>
            <strong>Tokens/s estimados</strong>
          </div>
          {comparisonRows.map((row) => (
            <div className="comparison-row" role="row" key={row.label}>
              <span>{row.label}</span>
              <span>{formatearGb(row.kvCache)}</span>
              <span>{row.relativeCost.toFixed(2)}x</span>
              <span>{row.savings.toFixed(1)}%</span>
              <span>{row.tokensPerSecond}</span>
            </div>
          ))}
        </div>

        <p className="comparison-explanation">
          La tabla muestra tendencias de memoria para entrevistas, clases y documentación. No debe interpretarse como throughput real de un modelo desplegado.
        </p>
      </div>

      <div className="llm-context-panel">
        <div className="chart-header">
          <div>
            <p className="eyebrow">Contexto largo vs KV cache</p>
            <h3>Escenarios 32k, 64k, 128k y 1M</h3>
          </div>
          <span className="status-badge idle"><span className="status-dot" aria-hidden="true" />MHA · GQA · SWA · MLA</span>
        </div>

        <div className="context-growth-chart" role="img" aria-label="Crecimiento de KV cache por longitud de contexto">
          {contextSeries.map((item) => (
            <div className="context-row" key={item.length}>
              <strong>{item.length >= 1000000 ? "1M" : item.length.toLocaleString()}</strong>
              <div className="context-bars">
                <div className="context-bar mha" style={{ width: calcularAnchoBarra(item.mha, maxSeries) }}><span>MHA {formatearGb(item.mha)}</span></div>
                <div className="context-bar gqa" style={{ width: calcularAnchoBarra(item.gqa, maxSeries) }}><span>GQA {formatearGb(item.gqa)}</span></div>
                <div className="context-bar swa" style={{ width: calcularAnchoBarra(item.swa, maxSeries) }}><span>SWA {formatearGb(item.swa)}</span></div>
                <div className="context-bar mla" style={{ width: calcularAnchoBarra(item.mla, maxSeries) }}><span>MLA {formatearGb(item.mla)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <pre className="salida-metricas llm-technical-output">{`Resumen técnico
Máscara causal: activada en modo LLM autoregresivo
RoPE: ${builder.rope ? "sí" : "no"}
Dimensión: ${builder.dimension}
Capas: ${builder.numLayers}
Query heads: ${config.queryHeads}
KV heads: ${config.kvHeads}
Ventana SWA: ${builder.windowSize}
MLA rank: ${builder.mlaRank}

KV cache MHA aproximado: ${metrics.kvCacheMhaGB.toFixed(3)} GB
KV cache GQA aproximado: ${metrics.kvCacheGqaGB.toFixed(3)} GB
KV cache SWA aproximado: ${metrics.kvCacheSwaGB.toFixed(3)} GB
KV cache MLA aproximado: ${metrics.kvCacheMlaGB.toFixed(3)} GB

Fórmula MHA: capas * contexto * 2 * dimensión * bytes * batch
Fórmula GQA: MHA * KV_heads / Query_heads
Fórmula SWA conceptual: capas * ventana * 2 * dimensión * bytes * batch
Fórmula MLA conceptual: capas * contexto * 2 * rank_latente * bytes * batch

Costo long-context relativo: ${metrics.longContextRelationsMillions.toFixed(1)} millones de relaciones token-token
Perplexity aproximada: ${metrics.approximatePerplexity.toFixed(2)}
Tokens/segundo estimados: ${metrics.estimatedTokensPerSecond}`}</pre>
    </section>
  );
}
