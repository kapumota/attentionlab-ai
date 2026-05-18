import { useMemo, useState } from "react";
import {
  computeAttentionOnBackend,
  computeContrastiveBatchOnBackend,
  estimateLlmOnBackend,
  getApiHealth,
  traceAgentOnBackend,
  validateArchitectureOnBackend
} from "../core/apiClient";
import type { ArchitectureSpec, BuilderConfig, SimulationConfig } from "../types";
import { CopyButton } from "./CopyButton";

interface BackendPlaygroundProps {
  config: SimulationConfig;
  builder: BuilderConfig;
  architecture: ArchitectureSpec;
  contextLength: number;
  batchSize: number;
}

type ConsoleStatus = "idle" | "running" | "ok" | "error" | "disconnected";
type ConsoleTab = "request" | "response" | "interpretation" | "errors";

interface EndpointDefinition {
  id: string;
  label: string;
  method: "GET" | "POST";
  path: string;
  short: string;
  buildRequest: () => unknown;
  action: () => Promise<unknown>;
  interpretation: string[];
  commonErrors: string[];
}

function toBackendConfig(config: SimulationConfig) {
  return {
    mode: config.mode,
    tokens: config.tokens,
    temperature: config.temperature,
    window_size: config.windowSize,
    top_k: config.topK,
    query_heads: config.queryHeads,
    kv_heads: config.kvHeads,
    visual_head: config.visualHead
  };
}

function stringifyPayload(payload: unknown) {
  if (payload === null || typeof payload === "undefined") return "Sin body. Esta llamada usa GET.";
  return JSON.stringify(payload, null, 2);
}

function classifyError(error: unknown): ConsoleStatus {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("failed to fetch") || message.includes("networkerror") || message.includes("backend no disponible")) {
    return "disconnected";
  }
  return "error";
}

function statusLabel(status: ConsoleStatus) {
  if (status === "idle") return "Listo";
  if (status === "running") return "Ejecutando";
  if (status === "ok") return "OK";
  if (status === "disconnected") return "Backend desconectado";
  return "Error";
}

export function BackendPlayground({ config, builder, architecture, contextLength, batchSize }: BackendPlaygroundProps) {
  const endpoints = useMemo<EndpointDefinition[]>(
    () => [
      {
        id: "health",
        label: "Probar conexión backend",
        method: "GET",
        path: "/api/health",
        short: "Health check",
        buildRequest: () => null,
        action: () => getApiHealth(),
        interpretation: [
          "Confirma que FastAPI está activo y que el proxy /api del frontend responde.",
          "Si esta llamada falla, los demás endpoints también fallarán desde el navegador.",
          "Es la primera prueba recomendada antes de usar el playground."
        ],
        commonErrors: [
          "El backend no está corriendo en http://localhost:8000.",
          "El frontend fue abierto sin el proxy de Vite o sin VITE_API_BASE_URL correcto.",
          "El puerto 8000 está ocupado por otro servicio."
        ]
      },
      {
        id: "attention",
        label: "Atención API",
        method: "POST",
        path: "/api/attention/compute",
        short: "Scores y probabilidades",
        buildRequest: () => ({ config: toBackendConfig(config) }),
        action: () => computeAttentionOnBackend(config),
        interpretation: [
          "El backend calcula scores de atención, máscara, probabilidades normalizadas y métricas de costo.",
          "La respuesta permite comparar el cálculo del backend con la matriz visual del frontend.",
          "En modo causal o sliding window, la máscara explica qué conexiones quedan bloqueadas."
        ],
        commonErrors: [
          "404: el frontend está llamando una ruta sin /api o el proxy no está activo.",
          "422: el payload no coincide con el schema esperado por FastAPI.",
          "Backend apagado: ejecuta uvicorn en la Terminal 1."
        ]
      },
      {
        id: "architecture",
        label: "Validar arquitectura",
        method: "POST",
        path: "/api/architecture/validate",
        short: "Contrato Transformer",
        buildRequest: () => architecture,
        action: () => validateArchitectureOnBackend(architecture),
        interpretation: [
          "FastAPI valida el contrato JSON de arquitectura generado por el constructor Transformer.",
          "La validación revisa capas, dimensión, heads, kv_heads, RoPE, gating y parámetros de bloques.",
          "Es útil para demostrar que el frontend no solo dibuja bloques: produce un contrato técnico."
        ],
        commonErrors: [
          "422: falta layers u otro campo requerido en el contrato.",
          "Parámetros inconsistentes: kv_heads no debería superar query_heads.",
          "El JSON fue editado manualmente con tipos incorrectos."
        ]
      },
      {
        id: "llm",
        label: "Estimar LLM",
        method: "POST",
        path: "/api/llm/estimate",
        short: "KV cache y costo",
        buildRequest: () => ({
          num_layers: builder.numLayers,
          dimension: builder.dimension,
          query_heads: config.queryHeads,
          kv_heads: config.kvHeads,
          mla_rank: builder.mlaRank,
          context_length: contextLength,
          batch_size: batchSize,
          precision: "fp16",
          rope: builder.rope
        }),
        action: () =>
          estimateLlmOnBackend({
            numLayers: builder.numLayers,
            dimension: builder.dimension,
            queryHeads: config.queryHeads,
            kvHeads: config.kvHeads,
            mlaRank: builder.mlaRank,
            contextLength,
            batchSize,
            rope: builder.rope
          }),
        interpretation: [
          "El backend estima memoria de KV cache para MHA, GQA y MLA.",
          "Permite explicar por qué reducir KV heads o comprimir representaciones ayuda en contexto largo.",
          "La estimación no entrena un modelo; es una métrica didáctica de inferencia."
        ],
        commonErrors: [
          "422: context_length, batch_size o heads llegaron con un tipo inválido.",
          "Valores extremos pueden producir métricas difíciles de leer.",
          "Si el backend está apagado, la llamada no llegará a FastAPI."
        ]
      },
      {
        id: "mllm",
        label: "Batch InfoNCE (lote contrastivo)",
        method: "POST",
        path: "/api/mllm/contrastive-batch",
        short: "Contraste multimodal",
        buildRequest: () => ({ batch_size: 4, temperature: config.temperature }),
        action: () => computeContrastiveBatchOnBackend(config.temperature),
        interpretation: [
          "Simula un batch contrastivo con pares positivos y negativos.",
          "Muestra probabilidades, pérdidas por fila y una pérdida media tipo InfoNCE.",
          "Sirve para conectar modelos multimodales con alineación imagen-texto."
        ],
        commonErrors: [
          "422: temperatura fuera del rango esperado o payload incorrecto.",
          "404: ruta mal formada o proxy /api ausente.",
          "Timeout: backend no disponible."
        ]
      },
      {
        id: "agent-trace",
        label: "Traza agente",
        method: "POST",
        path: "/api/agents/trace",
        short: "Pasos del agente",
        buildRequest: () => ({
          prompt: "Explica el rol del KV cache en GQA y MLA",
          include_tools: true,
          include_rag: true,
          max_steps: 5
        }),
        action: () => traceAgentOnBackend("Explica el rol del KV cache en GQA y MLA"),
        interpretation: [
          "El backend devuelve una traza didáctica con pasos del agente y contexto dominante.",
          "Ayuda a explicar que un agente debe ser auditable, no solo producir una respuesta final.",
          "Complementa el módulo RAG + Agent Debugger, que muestra recuperación y groundedness."
        ],
        commonErrors: [
          "422: prompt vacío o campos incompatibles con el schema.",
          "Backend desconectado: ejecuta uvicorn antes de probar trazas.",
          "Si se usa un endpoint antiguo, valida que sea /api/agents/trace."
        ]
      }
    ],
    [architecture, batchSize, builder, config, contextLength]
  );

  const [selectedEndpointId, setSelectedEndpointId] = useState("health");
  const [activeTab, setActiveTab] = useState<ConsoleTab>("request");
  const [consoleStatus, setConsoleStatus] = useState<ConsoleStatus>("idle");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [responsePayload, setResponsePayload] = useState<unknown>("Ejecuta una acción para ver la respuesta JSON del backend.");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedEndpoint = endpoints.find((endpoint) => endpoint.id === selectedEndpointId) ?? endpoints[0];
  const selectedRequest = selectedEndpoint.buildRequest();

  async function runEndpoint(endpoint: EndpointDefinition) {
    setSelectedEndpointId(endpoint.id);
    setConsoleStatus("running");
    setLatencyMs(null);
    setErrorMessage(null);
    setActiveTab("response");
    const startedAt = performance.now();
    try {
      const response = await endpoint.action();
      setLatencyMs(performance.now() - startedAt);
      setConsoleStatus("ok");
      setResponsePayload(response);
    } catch (error) {
      setLatencyMs(performance.now() - startedAt);
      setConsoleStatus(classifyError(error));
      const message = error instanceof Error ? error.message : "Error desconocido al llamar el backend.";
      setErrorMessage(message);
      setResponsePayload({ error: message });
      setActiveTab("errors");
    }
  }

  const endpointTitle = `${selectedEndpoint.method} ${selectedEndpoint.path}`;
  const badgeClass = `status-badge ${consoleStatus}`;
  const displayedStatus = `${statusLabel(consoleStatus)}${latencyMs !== null ? ` · ${latencyMs.toFixed(0)} ms` : ""}`;
  const requestText = stringifyPayload(selectedRequest);
  const responseText = typeof responsePayload === "string" ? responsePayload : JSON.stringify(responsePayload, null, 2);
  const curlCommand = selectedEndpoint.method === "GET"
    ? `curl http://localhost:8000${selectedEndpoint.path}`
    : `curl -X ${selectedEndpoint.method} http://localhost:8000${selectedEndpoint.path} \
  -H "Content-Type: application/json" \
  --data '${JSON.stringify(selectedRequest)}'`;
  const readmeExplanation = `${endpointTitle}: ${selectedEndpoint.interpretation.join(" ")}`;

  return (
    <section className="panel backend-playground api-console">
      <div className="console-header">
        <div>
          <p className="eyebrow">Entorno de pruebas de backend</p>
          <h2>Consola visual FastAPI</h2>
          <p className="explicacion">
            Selecciona un endpoint, revisa el request, ejecuta la llamada y compara la respuesta con una interpretación técnica.
          </p>
        </div>
        <button className="secundario" onClick={() => runEndpoint(endpoints[0])}>Probar conexión backend</button>
      </div>

      <div className="endpoint-console-grid">
        <div className="endpoint-list" aria-label="Endpoints disponibles">
          {endpoints.map((endpoint) => (
            <button
              key={endpoint.id}
              type="button"
              className={endpoint.id === selectedEndpoint.id ? "endpoint-item activo" : "endpoint-item"}
              onClick={() => {
                setSelectedEndpointId(endpoint.id);
                setActiveTab("request");
              }}
            >
              <strong>{endpoint.label}</strong>
              <small>{endpoint.method} {endpoint.path}</small>
              <span>{endpoint.short}</span>
            </button>
          ))}
        </div>

        <div className="endpoint-console">
          <div className="endpoint-summary-card">
            <div>
              <span className="summary-label">Endpoint seleccionado</span>
              <strong>{endpointTitle}</strong>
            </div>
            <div className={badgeClass} role="status" aria-live="polite">
              <span className="status-dot" aria-hidden="true" />
              {displayedStatus}
            </div>
          </div>

          <div className="console-actions-row">
            <button onClick={() => runEndpoint(selectedEndpoint)} disabled={consoleStatus === "running"}>
              {consoleStatus === "running" ? "Ejecutando..." : "Ejecutar endpoint"}
            </button>
            <button className="secundario" onClick={() => setActiveTab("request")}>Ver request</button>
            <button className="secundario" onClick={() => setActiveTab("errors")}>Ayuda ante errores</button>
            <CopyButton text={readmeExplanation}>Copiar explicación</CopyButton>
            <CopyButton text={curlCommand}>Copiar curl</CopyButton>
          </div>

          <div className="console-tabs" role="tablist" aria-label="Detalles del endpoint">
            {([
              ["request", "Request"],
              ["response", "Response"],
              ["interpretation", "Interpretación"],
              ["errors", "Errores comunes"]
            ] as Array<[ConsoleTab, string]>).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={activeTab === tab ? "console-tab activo" : "console-tab"}
                onClick={() => setActiveTab(tab)}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "request" && (
            <div className="console-panel" role="tabpanel">
              <h3>Request</h3>
              <p>Lo que el frontend envía al backend para este endpoint.</p>
              <pre className="salida-json">{requestText}</pre>
              <CopyButton text={requestText}>Copiar request JSON</CopyButton>
            </div>
          )}

          {activeTab === "response" && (
            <div className="console-panel" role="tabpanel">
              <h3>Response</h3>
              <p>Lo que FastAPI devuelve después de ejecutar la llamada.</p>
              <pre className="salida-json">{responseText}</pre>
              <CopyButton text={responseText}>Copiar response</CopyButton>
            </div>
          )}

          {activeTab === "interpretation" && (
            <div className="console-panel" role="tabpanel">
              <h3>Interpretación</h3>
              <ul className="explanation-list">
                {selectedEndpoint.interpretation.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <CopyButton text={readmeExplanation}>Copiar interpretación para README</CopyButton>
            </div>
          )}

          {activeTab === "errors" && (
            <div className="console-panel error-help" role="tabpanel">
              <h3>Errores comunes</h3>
              {errorMessage && <div className="alerta-error">Último error: {errorMessage}</div>}
              <ol>
                {selectedEndpoint.commonErrors.map((item) => <li key={item}>{item}</li>)}
              </ol>
              <div className="terminal-help">
                <strong>Prueba rápida en Terminal 3</strong>
                <code>curl http://localhost:8000/api/health</code>
              </div>
              <div className="terminal-help">
                <strong>Comando para levantar FastAPI en Terminal 1</strong>
                <code>PYTHONPATH=apps/api uvicorn app.main:app --reload --host 0.0.0.0 --port 8000</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
