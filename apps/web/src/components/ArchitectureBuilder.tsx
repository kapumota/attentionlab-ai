import { useMemo, useState } from "react";
import { validateArchitectureOnBackend, type ArchitectureValidationResponse } from "../core/apiClient";
import { CopyButton } from "./CopyButton";
import type { ArchitectureBlock, ArchitectureSpec, AttentionBlockType, BuilderConfig, SimulationConfig } from "../types";

interface Props {
  config: SimulationConfig;
  builder: BuilderConfig;
  architecture: ArchitectureSpec;
  onBuilderChange: (builder: BuilderConfig) => void;
  onAddBlock: () => void;
  onClear: () => void;
}

const blockTypes: Array<[AttentionBlockType, string]> = [
  ["mha", "MHA"],
  ["gqa", "GQA"],
  ["swa_gqa", "SWA + GQA"],
  ["mla", "MLA"],
  ["sparse_topk", "Sparse Top-k"],
  ["gated_full_attention", "Gated Full Attention"],
  ["cross_attention", "Cross-Attention"]
];

const blockLabels: Record<AttentionBlockType, string> = {
  mha: "Multi-Head Attention",
  gqa: "Grouped Query Attention",
  swa_gqa: "Sliding Window + GQA",
  mla: "Multi-head Latent Attention",
  sparse_topk: "Sparse Top-k",
  gated_full_attention: "Gated Full Attention",
  cross_attention: "Cross-Attention"
};

const blockDescriptions: Record<AttentionBlockType, string> = {
  mha: "Atención completa clásica: expresiva, pero costosa en contexto largo.",
  gqa: "Reduce KV cache compartiendo keys/values entre grupos de query heads.",
  swa_gqa: "Limita la atención a una ventana local y conserva eficiencia de GQA.",
  mla: "Comprime representaciones latentes para reducir memoria de inferencia.",
  sparse_topk: "Conserva solo las conexiones más relevantes por token.",
  gated_full_attention: "Usa gating para modular qué información pasa al bloque.",
  cross_attention: "Conecta dos fuentes, por ejemplo texto consultando visión o memoria."
};

function formatBlockType(type: AttentionBlockType) {
  return blockTypes.find(([value]) => value === type)?.[1] ?? type;
}

function getBlockDetails(block: ArchitectureBlock, index: number, architecture: ArchitectureSpec) {
  const details: Array<[string, string | number | boolean]> = [
    ["repeat", architecture.repeat],
    ["heads", architecture.heads],
    ["kv_heads", architecture.kv_heads]
  ];

  if (block.window) details.unshift(["window", block.window]);
  if (block.compression_rank) details.unshift(["rank", block.compression_rank]);
  if (block.top_k) details.unshift(["top_k", block.top_k]);
  if (block.gating) details.push(["gating", true]);
  if (block.position_encoding) details.push(["pos", block.position_encoding]);

  return {
    title: `Bloque de capa ${index + 1}`,
    label: formatBlockType(block.type),
    description: blockDescriptions[block.type],
    details
  };
}

export function ArchitectureBuilder({ config, builder, architecture, onBuilderChange, onAddBlock, onClear }: Props) {
  const [showJson, setShowJson] = useState(false);
  const [copyStatus, setCopyStatus] = useState("Copiar JSON");
  const [validationState, setValidationState] = useState<"idle" | "running" | "ok" | "error">("idle");
  const [validationMessage, setValidationMessage] = useState("Aún no validado en backend.");
  const [validationResult, setValidationResult] = useState<ArchitectureValidationResponse | null>(null);

  const json = useMemo(() => JSON.stringify(architecture, null, 2), [architecture]);
  const visualBlocks = useMemo(
    () => architecture.layers.map((block, index) => getBlockDetails(block, index, architecture)),
    [architecture]
  );
  const architectureExplanation = `El Constructor Transformer representa una arquitectura con ${architecture.num_layers} capas, dimensión ${architecture.dimension}, ${architecture.heads} query heads y ${architecture.kv_heads} KV heads. Los bloques visuales permiten explicar GQA, SWA, MLA, Sparse Top-k, gating y cross-attention antes de abrir el JSON técnico.`;

  function update<K extends keyof BuilderConfig>(key: K, value: BuilderConfig[K]) {
    onBuilderChange({ ...builder, [key]: value });
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(json);
      setCopyStatus("JSON copiado");
      window.setTimeout(() => setCopyStatus("Copiar JSON"), 1600);
    } catch {
      setCopyStatus("No se pudo copiar");
      window.setTimeout(() => setCopyStatus("Copiar JSON"), 1800);
    }
  }

  async function validateInBackend() {
    setValidationState("running");
    setValidationMessage("Validando arquitectura en POST /api/architecture/validate...");
    setValidationResult(null);

    try {
      const result = await validateArchitectureOnBackend(architecture);
      setValidationResult(result);
      setValidationState(result.valid ? "ok" : "error");
      setValidationMessage(
        result.valid
          ? "Arquitectura válida. El backend aceptó capas, heads, KV heads y parámetros globales."
          : "El backend respondió, pero la arquitectura tiene advertencias o inconsistencias."
      );
    } catch (error) {
      setValidationState("error");
      setValidationMessage(error instanceof Error ? error.message : "No se pudo validar la arquitectura.");
    }
  }

  return (
    <section className="panel seccion architecture-visual-builder">
      <div className="builder-heading">
        <div>
          <p className="eyebrow">Constructor Transformer visual</p>
          <h2>Módulo 2: Constructor de arquitecturas</h2>
          <p className="mini-aviso">
            Diseña bloques como tarjetas primero. El JSON técnico queda disponible para copiarlo o validarlo contra FastAPI.
          </p>
        </div>
        <div className="architecture-summary-chip" aria-label="Resumen de configuración global">
          <strong>{architecture.num_layers} capas</strong>
          <span>{architecture.dimension} dim · {config.queryHeads} query heads · {config.kvHeads} KV heads</span>
        </div>
      </div>

      <div className="builder-grid builder-grid-visual">
        <div className="builder-controls-card">
          <div className="fila-doble">
            <div>
              <label>Número de capas: <span className="valor-control">{builder.numLayers}</span></label>
              <input type="range" min="1" max="48" step="1" value={builder.numLayers} onChange={(e) => update("numLayers", Number(e.target.value))} />
            </div>
            <div>
              <label>Dimensión: <span className="valor-control">{builder.dimension}</span></label>
              <input type="range" min="128" max="4096" step="128" value={builder.dimension} onChange={(e) => update("dimension", Number(e.target.value))} />
            </div>
          </div>

          <div className="fila-doble">
            <div>
              <label>Tipo de atención</label>
              <select value={builder.blockType} onChange={(e) => update("blockType", e.target.value as AttentionBlockType)}>
                {blockTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label>Window size: <span className="valor-control">{builder.windowSize}</span></label>
              <input type="range" min="128" max="8192" step="128" value={builder.windowSize} onChange={(e) => update("windowSize", Number(e.target.value))} />
            </div>
          </div>

          <div className="fila-doble">
            <div>
              <label>MLA compression rank: <span className="valor-control">{builder.mlaRank}</span></label>
              <input type="range" min="8" max="512" step="8" value={builder.mlaRank} onChange={(e) => update("mlaRank", Number(e.target.value))} />
            </div>
            <div>
              <label>Repeat: <span className="valor-control">{builder.repeat}</span></label>
              <input type="range" min="1" max="12" step="1" value={builder.repeat} onChange={(e) => update("repeat", Number(e.target.value))} />
            </div>
          </div>

          <div className="fila-doble checks">
            <label className="campo-check"><input type="checkbox" checked={builder.rope} onChange={(e) => update("rope", e.target.checked)} /> RoPE activado</label>
            <label className="campo-check"><input type="checkbox" checked={builder.gating} onChange={(e) => update("gating", e.target.checked)} /> Gating activado</label>
          </div>

          <div className="botonera espacio-arriba">
            <button onClick={onAddBlock}>Agregar bloque</button>
            <button className="secundario" onClick={onClear}>Limpiar</button>
          </div>
        </div>

        <div className="architecture-visual-panel">
          <div className="chart-header">
            <div>
              <p className="eyebrow">Arquitectura visual</p>
              <h3>Bloques configurados</h3>
            </div>
            <span className="mode-badge">{architecture.layers.length} bloques</span>
          </div>

          {visualBlocks.length > 0 ? (
            <div className="layer-card-grid">
              {visualBlocks.map((block) => (
                <article className="layer-block-card" key={block.title}>
                  <span className="layer-index">{block.title}</span>
                  <strong>{block.label}</strong>
                  <p>{block.description}</p>
                  <dl>
                    {block.details.map(([label, value]) => (
                      <div key={`${block.title}-${label}`}>
                        <dt>{label}</dt>
                        <dd>{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-architecture-card">
              <strong>Sin bloques personalizados</strong>
              <span>Agrega bloques para construir una arquitectura visual. El contrato JSON conservará la configuración global.</span>
            </div>
          )}
        </div>
      </div>

      <div className="json-toolbox">
        <div>
          <p className="eyebrow">JSON generado</p>
          <h3>Contrato técnico de arquitectura</h3>
          <p className="mini-aviso">Úsalo para documentar experimentos, enviarlo al backend o reproducir la arquitectura.</p>
        </div>
        <div className="json-actions">
          <button className="secundario" onClick={() => setShowJson((value) => !value)}>
            {showJson ? "Ocultar JSON técnico" : "Mostrar JSON técnico"}
          </button>
          <button className="secundario" onClick={copyJson}>{copyStatus}</button>
          <CopyButton text={architectureExplanation}>Copiar explicación</CopyButton>
          <button onClick={validateInBackend} disabled={validationState === "running"}>
            {validationState === "running" ? "Validando..." : "Validar en backend"}
          </button>
        </div>
      </div>

      <div className={`architecture-validation ${validationState}`} role="status" aria-live="polite">
        <span className={`status-badge ${validationState === "idle" ? "idle" : validationState}`}>
          <span className="status-dot" />
          {validationState === "idle" ? "Sin validar" : validationState === "running" ? "Ejecutando" : validationState === "ok" ? "OK" : "Error"}
        </span>
        <p>{validationMessage}</p>
        {validationResult?.warnings?.length ? (
          <ul>
            {validationResult.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        ) : null}
      </div>

      {showJson ? <pre className="salida-json architecture-json-output">{json}</pre> : null}
    </section>
  );
}
