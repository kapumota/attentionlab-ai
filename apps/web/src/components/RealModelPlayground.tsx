import { useState } from "react";
import {
  generateTextOnBackend,
  getModelRuntimeStatus,
  runTextContrastiveOnBackend,
  type BackendGenerationResponse,
  type ModelRuntimeStatus,
  type TextContrastiveResponse
} from "../core/apiClient";
import { contrastiveInBrowser, type BrowserContrastiveResult } from "../core/browserModels";

const defaultCandidates = [
  "Un perro juega con una pelota en el parque",
  "Una receta de pasta con tomate",
  "Un documento sobre atención causal",
  "Una ciudad de noche con autos"
];

export function RealModelPlayground() {
  const [modelId, setModelId] = useState("Xenova/all-MiniLM-L6-v2");
  const [anchor, setAnchor] = useState("Una imagen de un perro jugando con una pelota");
  const [candidatesText, setCandidatesText] = useState(defaultCandidates.join("\n"));
  const [temperature, setTemperature] = useState(0.2);
  const [prompt, setPrompt] = useState("Explica GQA y KV cache en una frase.");
  const [loading, setLoading] = useState<string | null>(null);
  const [browserResult, setBrowserResult] = useState<BrowserContrastiveResult | null>(null);
  const [backendContrastive, setBackendContrastive] = useState<TextContrastiveResponse | null>(null);
  const [generation, setGeneration] = useState<BackendGenerationResponse | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<ModelRuntimeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const candidates = candidatesText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);

  async function runBrowserModel() {
    setError(null);
    setLoading("browser");
    try {
      const result = await contrastiveInBrowser({ anchor, candidates, modelId, temperature });
      setBrowserResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo ejecutar Transformers.js en el navegador.");
    } finally {
      setLoading(null);
    }
  }

  async function runBackendContrastive() {
    setError(null);
    setLoading("backend-contrastive");
    try {
      const result = await runTextContrastiveOnBackend({ anchor, candidates, temperature });
      setBackendContrastive(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo ejecutar el endpoint contrastivo del backend.");
    } finally {
      setLoading(null);
    }
  }

  async function runBackendGeneration() {
    setError(null);
    setLoading("backend-generation");
    try {
      const result = await generateTextOnBackend({ prompt, maxNewTokens: 64 });
      setGeneration(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo ejecutar generación backend.");
    } finally {
      setLoading(null);
    }
  }

  async function refreshRuntimeStatus() {
    setError(null);
    setLoading("status");
    try {
      const result = await getModelRuntimeStatus();
      setRuntimeStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer el estado de modelos.");
    } finally {
      setLoading(null);
    }
  }

  const result = browserResult ?? backendContrastive;

  return (
    <section className="panel real-model-playground">
      <p className="eyebrow">v1.0 · modelos pequeños reales</p>
      <h2>Transformers.js / ONNX / Backend Python</h2>
      <p className="explicacion">
        Este panel permite ejecutar embeddings reales en el navegador con Transformers.js y comparar textos con una distribución tipo InfoNCE.
        El backend mantiene fallback determinista y queda listo para activar Python Transformers si el Space tiene recursos suficientes.
      </p>

      <div className="model-grid">
        <div>
          <label htmlFor="modelId">Modelo Transformers.js compatible ONNX</label>
          <input id="modelId" value={modelId} onChange={(event) => setModelId(event.target.value)} />

          <label htmlFor="anchorText">Anchor / consulta</label>
          <textarea id="anchorText" value={anchor} onChange={(event) => setAnchor(event.target.value)} rows={3} />

          <label htmlFor="candidateTexts">Candidatos, uno por línea</label>
          <textarea id="candidateTexts" value={candidatesText} onChange={(event) => setCandidatesText(event.target.value)} rows={6} />

          <label htmlFor="temperatureReal">Temperatura InfoNCE: <span className="valor-control">{temperature.toFixed(2)}</span></label>
          <input
            id="temperatureReal"
            type="range"
            min="0.05"
            max="1.5"
            step="0.05"
            value={temperature}
            onChange={(event) => setTemperature(Number(event.target.value))}
          />

          <div className="botonera-modelos">
            <button onClick={runBrowserModel} disabled={Boolean(loading)}>
              {loading === "browser" ? "Cargando modelo..." : "Ejecutar en navegador"}
            </button>
            <button className="secundario" onClick={runBackendContrastive} disabled={Boolean(loading)}>
              Backend contrastivo
            </button>
            <button className="secundario" onClick={refreshRuntimeStatus} disabled={Boolean(loading)}>
              Estado runtime
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="backendPrompt">Prompt para backend Python opcional</label>
          <textarea id="backendPrompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={4} />
          <button onClick={runBackendGeneration} disabled={Boolean(loading)}>
            {loading === "backend-generation" ? "Generando..." : "Probar generación backend"}
          </button>

          {error && <div className="alerta-error">{error}</div>}

          {runtimeStatus && (
            <pre className="salida-json compacta">{JSON.stringify(runtimeStatus, null, 2)}</pre>
          )}

          {generation && (
            <div className="resultado-modelo">
              <strong>Salida backend</strong>
              <p>{generation.output}</p>
              <span>{generation.model_id} · {generation.latency_ms.toFixed(1)} ms</span>
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="resultado-contrastivo">
          <h3>Resultado contrastivo</h3>
          <div className="resultado-grid">
            {result.candidates.map((candidate, index) => (
              <div className="resultado-item" key={`${candidate}-${index}`}>
                <strong>{index === result.bestIndex ? "✓ Mejor candidato" : `Candidato ${index + 1}`}</strong>
                <span>{candidate}</span>
                <div className="mini-barra"><div style={{ width: `${Math.max(2, result.probabilities[index] * 100)}%` }} /></div>
                <small>
                  sim={result.similarities[index].toFixed(3)} · p={(result.probabilities[index] * 100).toFixed(1)}%
                </small>
              </div>
            ))}
          </div>
          <pre className="salida-json compacta">
            {JSON.stringify({
              adapter: "adapter" in result ? result.adapter : result.embedding_adapter,
              model: "modelId" in result ? result.modelId : result.model_id,
              dimensions: "dimensions" in result ? result.dimensions : undefined,
              latency_ms: "latencyMs" in result ? result.latencyMs.toFixed(1) : undefined,
              notes: result.notes
            }, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}
