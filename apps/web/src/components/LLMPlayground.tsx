import type { BuilderConfig, SimulationConfig } from "../types";
import { computeLlmMetrics } from "../core/llmMetrics";
import { CopyButton } from "./CopyButton";

interface Props {
  config: SimulationConfig;
  builder: BuilderConfig;
  contextLength: number;
  batchSize: number;
  onContextLengthChange: (value: number) => void;
  onBatchSizeChange: (value: number) => void;
}

interface KvBar {
  label: string;
  value: number;
  detail: string;
}

function formatGB(value: number) {
  if (value >= 1) return `${value.toFixed(2)} GB`;
  return `${(value * 1024).toFixed(1)} MB`;
}

function barWidth(value: number, max: number) {
  if (max <= 0) return "0%";
  return `${Math.max(4, Math.min(100, (value / max) * 100)).toFixed(1)}%`;
}

function KvBarRow({ bar, max }: { bar: KvBar; max: number }) {
  return (
    <div className="llm-bar-row">
      <div className="llm-bar-label">
        <strong>{bar.label}</strong>
        <small>{bar.detail}</small>
      </div>
      <div className="llm-bar-track" aria-label={`${bar.label}: ${formatGB(bar.value)}`}>
        <div style={{ width: barWidth(bar.value, max) }} />
      </div>
      <span>{formatGB(bar.value)}</span>
    </div>
  );
}

export function LLMPlayground({ config, builder, contextLength, batchSize, onContextLengthChange, onBatchSizeChange }: Props) {
  const metrics = computeLlmMetrics({
    contextLength,
    batchSize,
    dimension: builder.dimension,
    layers: builder.numLayers,
    queryHeads: config.queryHeads,
    kvHeads: config.kvHeads,
    mlaRank: builder.mlaRank,
    rope: builder.rope
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
      label: "MLA",
      value: metrics.kvCacheMlaGB,
      detail: "usa representación latente comprimida"
    }
  ];

  const maxKv = Math.max(...kvBars.map((bar) => bar.value), 1e-9);
  const contextSeries = [8192, 16384, 32768, 65536, 131072].map((length) => {
    const values = computeLlmMetrics({
      contextLength: length,
      batchSize,
      dimension: builder.dimension,
      layers: builder.numLayers,
      queryHeads: config.queryHeads,
      kvHeads: config.kvHeads,
      mlaRank: builder.mlaRank,
      rope: builder.rope
    });
    return {
      length,
      mha: values.kvCacheMhaGB,
      gqa: values.kvCacheGqaGB,
      mla: values.kvCacheMlaGB
    };
  });
  const maxSeries = Math.max(...contextSeries.map((item) => item.mha), 1e-9);
  const comparisonRows = [
    {
      label: "Configuración A: MHA",
      kvCache: metrics.kvCacheMhaGB,
      relativeCost: 1,
      tokensPerSecond: Math.max(1, Math.round(metrics.estimatedTokensPerSecond * metrics.gqaVsMha))
    },
    {
      label: "Configuración B: GQA",
      kvCache: metrics.kvCacheGqaGB,
      relativeCost: metrics.gqaVsMha,
      tokensPerSecond: metrics.estimatedTokensPerSecond
    },
    {
      label: "Configuración C: MLA",
      kvCache: metrics.kvCacheMlaGB,
      relativeCost: metrics.gqaVsMha * metrics.mlaVsGqa,
      tokensPerSecond: Math.max(1, Math.round(metrics.estimatedTokensPerSecond / Math.max(0.35, metrics.mlaVsGqa)))
    }
  ];

  const readmeExplanation = `El estimador LLM compara KV cache aproximado para MHA, GQA y MLA con contexto ${contextLength}, batch ${batchSize}, ${builder.numLayers} capas y dimensión ${builder.dimension}. GQA reduce memoria usando ${config.kvHeads} KV heads frente a ${config.queryHeads} query heads; MLA reduce más al comprimir a rank ${builder.mlaRank}.`;

  const comparisonPayload = JSON.stringify({
    contextLength,
    batchSize,
    layers: builder.numLayers,
    dimension: builder.dimension,
    queryHeads: config.queryHeads,
    kvHeads: config.kvHeads,
    mlaRank: builder.mlaRank,
    comparison: comparisonRows.map((row) => ({
      label: row.label,
      kvCacheGB: Number(row.kvCache.toFixed(4)),
      relativeCost: Number(row.relativeCost.toFixed(4)),
      estimatedTokensPerSecond: row.tokensPerSecond
    }))
  }, null, 2);

  return (
    <section className="panel seccion llm-playground-visual">
      <p className="eyebrow">Módulo 3 · LLM playground visual</p>
      <h2>Estimador LLM / KV Cache</h2>
      <p className="mini-aviso">
        Compara memoria aproximada de KV cache y costo de contexto largo. Las cifras son didácticas: sirven para explicar tendencias, no para reemplazar benchmarking real.
      </p>

      <div className="copy-action-grid module-copy-actions">
        <CopyButton text={readmeExplanation}>Copiar explicación para README</CopyButton>
        <CopyButton text={comparisonPayload}>Copiar resultado JSON</CopyButton>
      </div>

      <div className="builder-grid llm-visual-grid">
        <div className="llm-control-panel">
          <label htmlFor="llmContextLength">Longitud de contexto: <span className="valor-control">{contextLength}</span></label>
          <input id="llmContextLength" type="range" min="1024" max="131072" step="1024" value={contextLength} onChange={(e) => onContextLengthChange(Number(e.target.value))} />

          <label htmlFor="llmBatchSize">Batch de inferencia: <span className="valor-control">{batchSize}</span></label>
          <input id="llmBatchSize" type="range" min="1" max="16" step="1" value={batchSize} onChange={(e) => onBatchSizeChange(Number(e.target.value))} />

          <div className="llm-summary-cards" aria-label="Métricas principales del estimador LLM">
            <article>
              <span>GQA vs MHA</span>
              <strong>{metrics.gqaVsMha.toFixed(2)}x</strong>
              <small>del KV cache baseline</small>
            </article>
            <article>
              <span>MLA vs GQA</span>
              <strong>{metrics.mlaVsGqa.toFixed(2)}x</strong>
              <small>del KV cache con GQA</small>
            </article>
            <article>
              <span>Throughput estimado</span>
              <strong>{metrics.estimatedTokensPerSecond}</strong>
              <small>tokens/s pedagógicos</small>
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

          <div className="llm-bar-chart" role="img" aria-label="Comparación de KV cache aproximado entre MHA, GQA y MLA">
            {kvBars.map((bar) => <KvBarRow key={bar.label} bar={bar} max={maxKv} />)}
          </div>

          <div className="llm-interpretation-card">
            <strong>Interpretación didáctica</strong>
            <p>
              Al duplicar la longitud de contexto, la KV cache crece de forma fuerte porque se guardan keys y values de más tokens. GQA reduce memoria al usar menos KV heads. MLA reduce todavía más al comprimir la representación latente.
            </p>
          </div>
        </div>
      </div>

      <div className="llm-comparison-panel">
        <div className="chart-header">
          <div>
            <p className="eyebrow">Panel de comparación</p>
            <h3>MHA vs GQA vs MLA</h3>
          </div>
          <span className="status-badge ok"><span className="status-dot" aria-hidden="true" />Comparación lista</span>
        </div>

        <div className="comparison-table" role="table" aria-label="Comparación MHA GQA MLA">
          <div className="comparison-row header" role="row">
            <strong>Configuración</strong>
            <strong>KV cache</strong>
            <strong>Costo relativo</strong>
            <strong>Tokens/s estimados</strong>
          </div>
          {comparisonRows.map((row) => (
            <div className="comparison-row" role="row" key={row.label}>
              <span>{row.label}</span>
              <span>{formatGB(row.kvCache)}</span>
              <span>{row.relativeCost.toFixed(2)}x</span>
              <span>{row.tokensPerSecond}</span>
            </div>
          ))}
        </div>

        <p className="comparison-explanation">
          GQA reduce KV cache porque guarda menos heads de key/value. MLA reduce todavía más al cachear una representación latente comprimida. Esta comparación es didáctica y sirve para explicar tendencias de arquitectura.
        </p>
      </div>

      <div className="llm-context-panel">
        <div className="chart-header">
          <div>
            <p className="eyebrow">Context length vs KV cache</p>
            <h3>Crecimiento por longitud de contexto</h3>
          </div>
          <span className="status-badge idle"><span className="status-dot" aria-hidden="true" />MHA · GQA · MLA</span>
        </div>

        <div className="context-growth-chart" role="img" aria-label="Crecimiento de KV cache por longitud de contexto">
          {contextSeries.map((item) => (
            <div className="context-row" key={item.length}>
              <strong>{item.length.toLocaleString()}</strong>
              <div className="context-bars">
                <div className="context-bar mha" style={{ width: barWidth(item.mha, maxSeries) }}><span>MHA {formatGB(item.mha)}</span></div>
                <div className="context-bar gqa" style={{ width: barWidth(item.gqa, maxSeries) }}><span>GQA {formatGB(item.gqa)}</span></div>
                <div className="context-bar mla" style={{ width: barWidth(item.mla, maxSeries) }}><span>MLA {formatGB(item.mla)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <pre className="salida-metricas llm-technical-output">{`Resumen técnico
Causal mask: activada en modo LLM autoregresivo
RoPE: ${builder.rope ? "sí" : "no"}
Dimensión: ${builder.dimension}
Capas: ${builder.numLayers}
Query heads: ${config.queryHeads}
KV heads: ${config.kvHeads}
MLA rank: ${builder.mlaRank}

KV cache MHA aproximado: ${metrics.kvCacheMhaGB.toFixed(3)} GB
KV cache GQA aproximado: ${metrics.kvCacheGqaGB.toFixed(3)} GB
KV cache MLA aproximado: ${metrics.kvCacheMlaGB.toFixed(3)} GB

Costo long-context relativo: ${metrics.longContextRelationsMillions.toFixed(1)} millones de relaciones token-token
Perplexity aproximada: ${metrics.approximatePerplexity.toFixed(2)}
Tokens/segundo estimados: ${metrics.estimatedTokensPerSecond}`}</pre>
    </section>
  );
}
