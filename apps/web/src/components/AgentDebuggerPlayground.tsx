import { useEffect, useMemo, useState } from "react";
import {
  debugAgent,
  getRagStatus,
  ingestRagDocuments,
  queryRag,
  saveExperiment,
  type AgentDebugResponse,
  type RagQueryResponse,
  type RagStatusResponse,
  type RagRetrievedDocument
} from "../core/apiClient";
import { CopyButton } from "./CopyButton";

const documentosIniciales = `KV cache y GQA|GQA reduce el KV cache compartiendo claves y valores entre grupos de query heads. Esto mejora memoria y throughput en inferencia.|manual:llm
InfoNCE multimodal|InfoNCE ayuda a alinear pares imagen-texto correctos frente a negativos dentro del batch. Es útil en CLIP, retrieval y MLLMs.|manual:mllm
Agent debugger|Un depurador de agentes registra plan, acción, herramienta, observación, documentos recuperados y respuesta final para auditar decisiones.|manual:agents`;

function parseDocuments(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [title, text, source] = line.split("|");
      return {
        id: `ui-doc-${index + 1}`,
        title: title?.trim() || `Documento ${index + 1}`,
        text: text?.trim() || line,
        source: source?.trim() || "ui"
      };
    });
}

function percent(value: number) {
  return `${Math.max(0, Math.min(100, value * 100)).toFixed(1)}%`;
}

function retrievalExplanation(doc: RagRetrievedDocument) {
  const semantic = doc.semantic_score >= doc.lexical_score;
  return semantic
    ? "Este documento fue recuperado principalmente por similitud semántica con la consulta."
    : "Este documento fue recuperado porque comparte términos relevantes con la consulta.";
}

interface PipelineCardProps {
  step: number;
  title: string;
  status: string;
  active: boolean;
  detail: string;
}

function PipelineCard({ step, title, status, active, detail }: PipelineCardProps) {
  return (
    <div className={active ? "pipeline-card activo" : "pipeline-card"}>
      <span className="pipeline-step">Paso {step}</span>
      <strong>{title}</strong>
      <small>{status}</small>
      <p>{detail}</p>
    </div>
  );
}


interface AgentTimelineItem {
  step: number;
  title: string;
  input: string;
  action: string;
  output: string;
  latencyMs: number;
  status: "ok" | "warning" | "error" | "pending" | "skipped";
  evidence: string;
}

function clipText(value: string, max = 110) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function getStatusLabel(status: AgentTimelineItem["status"]) {
  if (status === "ok") return "OK";
  if (status === "warning") return "Advertencia";
  if (status === "error") return "Error";
  if (status === "skipped") return "Omitido";
  return "Pendiente";
}

function buildAgentTimeline(params: {
  prompt: string;
  query: string;
  topK: number;
  ragResult: RagQueryResponse | null;
  debugResult: AgentDebugResponse;
}): AgentTimelineItem[] {
  const { prompt, query, topK, ragResult, debugResult } = params;
  const tool = debugResult.tool_calls[0] ?? null;
  const evidenceIds = debugResult.retrieved.map((doc) => doc.citation || doc.id);
  const cited = debugResult.groundedness.cited_document_ids.join(", ") || "sin citas";
  const retrievalLatency = ragResult?.latency_ms ?? debugResult.latency_ms * 0.28;
  const toolLatency = tool?.latency_ms ?? debugResult.latency_ms * 0.18;
  const planningLatency = Math.max(0.4, debugResult.latency_ms * 0.08);
  const answerLatency = Math.max(0.8, debugResult.latency_ms * 0.22);
  const groundingLatency = Math.max(0.5, debugResult.latency_ms * 0.12);

  return [
    {
      step: 1,
      title: "Recibe pregunta",
      input: clipText(prompt),
      action: "Normaliza la intención del usuario y prepara el flujo de recuperación.",
      output: "Prompt listo para análisis.",
      latencyMs: planningLatency,
      status: "ok",
      evidence: "No aplica todavía."
    },
    {
      step: 2,
      title: "Genera consulta RAG",
      input: clipText(prompt),
      action: "Transforma el prompt en una consulta orientada a recuperar evidencia.",
      output: clipText(query),
      latencyMs: planningLatency,
      status: "ok",
      evidence: "Consulta textual preparada."
    },
    {
      step: 3,
      title: "Recupera documentos",
      input: clipText(query),
      action: `Ejecuta retrieval top-k con k = ${topK}.`,
      output: `${debugResult.retrieved.length} documentos recuperados.`,
      latencyMs: retrievalLatency,
      status: debugResult.retrieved.length > 0 ? "ok" : "warning",
      evidence: evidenceIds.join(", ") || "sin evidencia recuperada"
    },
    {
      step: 4,
      title: "Usa herramienta simulada",
      input: tool ? clipText(tool.input) : "Sin herramienta registrada.",
      action: tool ? `Llama herramienta ${tool.name}.` : "No se necesitó herramienta externa.",
      output: tool ? clipText(tool.output) : "Paso omitido.",
      latencyMs: toolLatency,
      status: tool ? tool.status : "pending",
      evidence: tool ? "Salida de herramienta disponible." : "No aplica."
    },
    {
      step: 5,
      title: "Produce respuesta",
      input: evidenceIds.join(", ") || "contexto recuperado",
      action: "Combina prompt, documentos y observaciones para crear una respuesta auditable.",
      output: clipText(debugResult.answer_draft, 150),
      latencyMs: answerLatency,
      status: "ok",
      evidence: cited
    },
    {
      step: 6,
      title: "Evalúa groundedness",
      input: "Respuesta preliminar + documentos citados.",
      action: "Contrasta la respuesta contra la evidencia recuperada y emite advertencias de cobertura.",
      output: `Groundedness ${percent(debugResult.groundedness.score)}.`,
      latencyMs: groundingLatency,
      status: debugResult.groundedness.warning ? "warning" : "ok",
      evidence: debugResult.groundedness.warning || cited
    }
  ];
}

function AgentTimelineCard({ item }: { item: AgentTimelineItem }) {
  return (
    <article className={`agent-timeline-card ${item.status}`}>
      <div className="timeline-marker" aria-hidden="true">{item.step}</div>
      <div className="timeline-card-body">
        <div className="timeline-card-header">
          <div>
            <span className="pipeline-step">Paso {item.step}</span>
            <strong>{item.title}</strong>
          </div>
          <span className={`status-badge ${item.status === "ok" ? "ok" : (item.status === "pending" || item.status === "skipped") ? "idle" : "error"}`}>
            <span className="status-dot" aria-hidden="true" />{getStatusLabel(item.status)} · {item.latencyMs.toFixed(1)} ms
          </span>
        </div>

        <div className="timeline-detail-grid">
          <div>
            <small>Entrada</small>
            <p>{item.input}</p>
          </div>
          <div>
            <small>Acción</small>
            <p>{item.action}</p>
          </div>
          <div>
            <small>Salida</small>
            <p>{item.output}</p>
          </div>
          <div>
            <small>Evidencia usada</small>
            <p>{item.evidence}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function AgentDebuggerPlayground() {
  const [prompt, setPrompt] = useState("Explica cómo un agente usa RAG para responder con evidencia.");
  const [query, setQuery] = useState("RAG documentos recuperados herramienta observación agente");
  const [docsRaw, setDocsRaw] = useState(documentosIniciales);
  const [topK, setTopK] = useState(3);
  const [status, setStatus] = useState<RagStatusResponse | null>(null);
  const [ragResult, setRagResult] = useState<RagQueryResponse | null>(null);
  const [debugResult, setDebugResult] = useState<AgentDebugResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getRagStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  const parsedDocs = useMemo(() => parseDocuments(docsRaw), [docsRaw]);
  const docsReady = Boolean(status && status.documents > 0);
  const hasRetrieved = Boolean(ragResult && ragResult.retrieved.length > 0);
  const hasDebug = Boolean(debugResult);
  const groundednessScore = debugResult ? debugResult.groundedness.score : 0;
  const timelineItems = debugResult ? buildAgentTimeline({ prompt, query, topK, ragResult, debugResult }) : [];
  const timelineText = debugResult
    ? timelineItems.map((item) => [
        `${item.step}. ${item.title}`,
        `Entrada: ${item.input}`,
        `Acción: ${item.action}`,
        `Salida: ${item.output}`,
        `Latencia: ${item.latencyMs.toFixed(1)} ms`,
        `Estado: ${getStatusLabel(item.status)}`,
        `Evidencia: ${item.evidence}`
      ].join("\n")).join("\n\n")
    : "Ejecuta Depurar agente para generar una línea de tiempo.";

  async function handleIngest() {
    setLoading(true);
    setError(null);
    try {
      const docs = parseDocuments(docsRaw);
      const result = await ingestRagDocuments(docs, false);
      const nextStatus = await getRagStatus();
      setStatus(nextStatus);
      setMessage(`${result.indexed_documents} documentos indexados. Total: ${result.total_documents}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo indexar documentos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuery() {
    setLoading(true);
    setError(null);
    try {
      const result = await queryRag({ query, topK });
      setRagResult(result);
      setMessage(`RAG recuperó ${result.retrieved.length} documentos en ${result.latency_ms.toFixed(1)} ms.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo consultar RAG.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDebug() {
    setLoading(true);
    setError(null);
    try {
      const result = await debugAgent({ prompt, ragQuery: query, topK });
      setDebugResult(result);
      setRagResult({
        query,
        top_k: topK,
        retrieved: result.retrieved,
        latency_ms: result.latency_ms,
        notes: result.notes
      });
      setMessage(`Traza generada con groundedness ${(result.groundedness.score * 100).toFixed(0)}%.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo depurar el agente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!debugResult) return;
    setLoading(true);
    setError(null);
    try {
      const saved = await saveExperiment({
        name: "Traza v1.1.0-dev Agent Debugger",
        module: "agent-debugger",
        payload: debugResult as unknown as Record<string, unknown>
      });
      setMessage(`Experimento guardado con id ${saved.id}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el experimento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel seccion agent-debugger rag-visual">
      <p className="eyebrow">v1.1.0-dev · Agent Debugger + RAG visual</p>
      <h2>Depurador visual de agentes</h2>
      <p className="mini-aviso">
        El flujo muestra documentos, indexación, consulta, recuperación top-k, respuesta del agente y evidencia citada.
      </p>

      <div className="rag-pipeline" aria-label="Pipeline visual de RAG y agente">
        <PipelineCard
          step={1}
          title="Documentos"
          status={`${parsedDocs.length} preparados`}
          active={parsedDocs.length > 0}
          detail="Textos fuente que se cargarán al almacén vectorial didáctico."
        />
        <PipelineCard
          step={2}
          title="Indexación"
          status={docsReady ? `${status?.documents ?? 0} documentos cargados` : "pendiente"}
          active={docsReady}
          detail="El backend registra documentos para que puedan recuperarse por consulta."
        />
        <PipelineCard
          step={3}
          title="Query"
          status={`Top-k = ${topK}`}
          active={query.trim().length > 0}
          detail="La consulta guía la búsqueda de evidencia relevante."
        />
        <PipelineCard
          step={4}
          title="Recuperación top-k"
          status={hasRetrieved ? `${ragResult?.retrieved.length ?? 0} recuperados` : "sin resultados"}
          active={hasRetrieved}
          detail="El retriever ordena documentos por score total, semántico y léxico."
        />
        <PipelineCard
          step={5}
          title="Respuesta del agente"
          status={hasDebug ? "traza generada" : "pendiente"}
          active={hasDebug}
          detail="El agente usa evidencia y herramientas simuladas para construir una respuesta auditable."
        />
        <PipelineCard
          step={6}
          title="Groundedness"
          status={hasDebug ? percent(groundednessScore) : "pendiente"}
          active={hasDebug && groundednessScore > 0}
          detail="Mide qué tanto la respuesta está respaldada por documentos recuperados."
        />
      </div>

      <div className="agent-debugger-grid">
        <div>
          <label htmlFor="agentPrompt">Prompt del usuario</label>
          <textarea id="agentPrompt" rows={4} value={prompt} onChange={(event) => setPrompt(event.target.value)} />

          <label htmlFor="ragQuery">Consulta RAG</label>
          <textarea id="ragQuery" rows={3} value={query} onChange={(event) => setQuery(event.target.value)} />

          <label htmlFor="ragTopK">Top-k documentos: <span className="valor-control">{topK}</span></label>
          <input id="ragTopK" type="range" min="1" max="6" value={topK} onChange={(event) => setTopK(Number(event.target.value))} />

          <div className="botonera-modelos">
            <button onClick={handleQuery} disabled={loading}>Consultar RAG</button>
            <button onClick={handleDebug} disabled={loading}>Depurar agente</button>
            <button className="secundario" onClick={handleSave} disabled={loading || !debugResult}>Guardar traza</button>
          </div>
        </div>

        <div>
          <label htmlFor="ragDocs">Documentos para indexar: título | texto | fuente</label>
          <textarea id="ragDocs" rows={10} value={docsRaw} onChange={(event) => setDocsRaw(event.target.value)} />
          <button onClick={handleIngest} disabled={loading}>Indexar documentos</button>
          <div className="resultado-modelo">
            <strong>Vector store</strong>
            <p>{status ? `${status.documents} documentos · ${status.store}` : "Consultando estado del RAG..."}</p>
          </div>
        </div>
      </div>

      {message && <div className="alerta-ok" role="status" aria-live="polite">{message}</div>}
      {error && (
        <div className="alerta-error" role="alert">
          <strong>No se pudo completar la acción.</strong>
          <p>{error}</p>
          <small>Verifica que el backend esté activo en http://localhost:8000 y prueba curl http://localhost:8000/api/health.</small>
        </div>
      )}

      {ragResult && (
        <div className="resultado-contrastivo rag-results-panel">
          <div className="results-header">
            <div>
              <p className="eyebrow">Paso 4 · recuperación top-k</p>
              <h3>Documentos recuperados</h3>
              <p>Consulta: <strong>{ragResult.query}</strong> · latencia {ragResult.latency_ms.toFixed(1)} ms</p>
            </div>
            <span className="status-badge ok"><span className="status-dot" aria-hidden="true" />{ragResult.retrieved.length} documentos</span>
          </div>

          <div className="resultado-grid rag-doc-grid">
            {ragResult.retrieved.map((doc) => (
              <article className="resultado-item rag-doc-card" key={doc.id}>
                <div className="doc-card-title">
                  <strong>{doc.title}</strong>
                  <small>{doc.citation}</small>
                </div>
                <span>{doc.text}</span>

                <div className="score-stack">
                  <div>
                    <small>Score total: {percent(doc.score)}</small>
                    <div className="mini-barra"><div style={{ width: percent(doc.score) }} /></div>
                  </div>
                  <div>
                    <small>Score semántico: {percent(doc.semantic_score)}</small>
                    <div className="mini-barra semantic"><div style={{ width: percent(doc.semantic_score) }} /></div>
                  </div>
                  <div>
                    <small>Score léxico: {percent(doc.lexical_score)}</small>
                    <div className="mini-barra lexical"><div style={{ width: percent(doc.lexical_score) }} /></div>
                  </div>
                </div>

                <p className="doc-explanation">{retrievalExplanation(doc)}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {debugResult && (
        <div className="resultado-contrastivo agent-trace-panel">
          <div className="results-header">
            <div>
              <p className="eyebrow">Paso 5 y 6 · timeline del agente</p>
              <h3>Timeline del agente</h3>
              <p>Latencia total: {debugResult.latency_ms.toFixed(1)} ms · traza defendible con entrada, acción, salida, estado y evidencia.</p>
            </div>
            <div className="timeline-actions">
              <span className="status-badge ok"><span className="status-dot" aria-hidden="true" />Groundedness {percent(debugResult.groundedness.score)}</span>
              <CopyButton text={timelineText}>Copiar timeline</CopyButton>
            </div>
          </div>

          <div className="agent-timeline" aria-label="Timeline detallado del agente">
            {timelineItems.map((item) => (
              <AgentTimelineCard item={item} key={item.step} />
            ))}
          </div>

          <div className="groundedness-card">
            <strong>Respuesta preliminar y groundedness visual: {percent(debugResult.groundedness.score)}</strong>
            <small>Qué significa groundedness: mide cuánto la respuesta está respaldada por documentos recuperados.</small>
            <p>{debugResult.answer_draft}</p>
            <small>Citas: {debugResult.groundedness.cited_document_ids.join(", ") || "sin citas"}</small>
            {debugResult.groundedness.warning && <small>Advertencia: {debugResult.groundedness.warning}</small>}
          </div>

          <div className="agent-internal-grid">
            <div>
              <h3>Nodos internos de la traza</h3>
              <div className="trace-grid timeline-trace compact-trace">
                {debugResult.steps.map((step) => (
                  <div className="trace-step" key={`${step.step}-${step.node}`}>
                    <strong>{step.step}. {step.node}</strong>
                    <span>{step.description}</span>
                    <div className="mini-barra"><div style={{ width: percent(step.attention_weight) }} /></div>
                    <small>Peso {percent(step.attention_weight)}{step.tool_name ? ` · herramienta: ${step.tool_name}` : ""}</small>
                    {step.evidence_ids.length > 0 && <small>Evidencia: {step.evidence_ids.join(", ")}</small>}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3>Trazado de herramientas</h3>
              <p className="mini-aviso">Qué significa: registro de llamadas a herramientas con entrada, salida, latencia y estado.</p>
              <div className="resultado-grid tool-tracing-grid">
                {debugResult.tool_calls.map((tool) => (
                  <div className="resultado-item" key={tool.name}>
                    <strong>{tool.name}</strong>
                    <span>{tool.output}</span>
                    <small>Entrada: {tool.input}</small>
                    <small>{tool.status} · {tool.latency_ms.toFixed(1)} ms</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
