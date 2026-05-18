import { API_BASE_URL } from "../config/api";
import type { ArchitectureSpec, SimulationConfig } from "../types";

export interface ApiHealth {
  status: "ok";
  version: string;
  mode: "docker-space" | "local";
  v04_ready: boolean;
  enabled_model_adapters: boolean;
}

export interface ModelAdapterStatus {
  enabled: boolean;
  default_model_id: string | null;
  available_adapters: string[];
  message: string;
}

export interface BackendAttentionResponse {
  scores: Array<Array<number | null>>;
  probabilities: number[][];
  mask: boolean[][];
  row_losses: number[];
  focused_row_loss: number;
  max_probability: number;
  relative_cost: number;
}

export interface ArchitectureValidationResponse {
  valid: boolean;
  warnings: string[];
  normalized: ArchitectureSpec;
}

export interface LlmEstimateResponse {
  kv_cache_mha_gb: number;
  kv_cache_gqa_gb: number;
  kv_cache_mla_gb: number;
  gqa_vs_mha_ratio: number;
  mla_vs_gqa_ratio: number;
  long_context_relations_millions: number;
  perplexity_proxy: number;
  tokens_per_second_proxy: number;
  notes: string[];
}

export interface ContrastiveBatchResponse {
  probabilities: number[][];
  row_losses: number[];
  mean_loss: number;
  alignment_pairs: string[];
}

export interface AgentTraceResponse {
  trace: Array<{
    step: number;
    node: string;
    description: string;
    attention_weight: number;
  }>;
  dominant_context: string;
  summary: string;
}

function buildHttpError(path: string, status: number): Error {
  return new Error(
    `Error HTTP ${status} en ${path}. Verifica que FastAPI esté activo en http://localhost:8000 y que el frontend use el proxy /api o VITE_API_BASE_URL.`
  );
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw buildHttpError(path, response.status);
  }
  return response.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw buildHttpError(path, response.status);
  }
  return response.json() as Promise<T>;
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

export function getApiHealth(): Promise<ApiHealth> {
  return getJson<ApiHealth>("/api/health");
}

export function getModelAdapterStatus(): Promise<ModelAdapterStatus> {
  return getJson<ModelAdapterStatus>("/api/models/status");
}

export function computeAttentionOnBackend(config: SimulationConfig): Promise<BackendAttentionResponse> {
  return postJson<BackendAttentionResponse>("/api/attention/compute", {
    config: toBackendConfig(config)
  });
}

export function validateArchitectureOnBackend(architecture: ArchitectureSpec): Promise<ArchitectureValidationResponse> {
  return postJson<ArchitectureValidationResponse>("/api/architecture/validate", architecture);
}

export function estimateLlmOnBackend(params: {
  numLayers: number;
  dimension: number;
  queryHeads: number;
  kvHeads: number;
  mlaRank: number;
  contextLength: number;
  batchSize: number;
  rope: boolean;
}): Promise<LlmEstimateResponse> {
  return postJson<LlmEstimateResponse>("/api/llm/estimate", {
    num_layers: params.numLayers,
    dimension: params.dimension,
    query_heads: params.queryHeads,
    kv_heads: params.kvHeads,
    mla_rank: params.mlaRank,
    context_length: params.contextLength,
    batch_size: params.batchSize,
    precision: "fp16",
    rope: params.rope
  });
}

export function computeContrastiveBatchOnBackend(temperature: number): Promise<ContrastiveBatchResponse> {
  return postJson<ContrastiveBatchResponse>("/api/mllm/contrastive-batch", {
    batch_size: 4,
    temperature
  });
}

export function traceAgentOnBackend(prompt: string): Promise<AgentTraceResponse> {
  return postJson<AgentTraceResponse>("/api/agents/trace", {
    prompt,
    include_tools: true,
    include_rag: true,
    max_steps: 5
  });
}

export interface ModelRuntimeStatus {
  enabled: boolean;
  browser_transformers_js: boolean;
  onnx_runtime_web: boolean;
  python_transformers_optional: boolean;
  default_text_model: string;
  default_embedding_model: string;
  available_adapters: string[];
  message: string;
}

export interface TextContrastiveResponse {
  anchor: string;
  candidates: string[];
  similarities: number[];
  probabilities: number[];
  bestIndex: number;
  temperature: number;
  embedding_adapter: string;
  model_id: string;
  notes: string[];
}

interface TextContrastiveApiResponse {
  anchor: string;
  candidates: string[];
  similarities: number[];
  probabilities: number[];
  best_index: number;
  temperature: number;
  embedding_adapter: string;
  model_id: string;
  notes: string[];
}

export interface BackendGenerationResponse {
  adapter: string;
  model_id: string;
  output: string;
  latency_ms: number;
  tokens_per_second: number | null;
  notes: string[];
}

export function getModelRuntimeStatus(): Promise<ModelRuntimeStatus> {
  return getJson<ModelRuntimeStatus>("/api/models/runtime");
}

export function runTextContrastiveOnBackend(params: {
  anchor: string;
  candidates: string[];
  temperature: number;
}): Promise<TextContrastiveResponse> {
  return postJson<TextContrastiveApiResponse>("/api/models/contrastive-texts", {
    anchor: params.anchor,
    candidates: params.candidates,
    temperature: params.temperature
  }).then((response) => ({
    anchor: response.anchor,
    candidates: response.candidates,
    similarities: response.similarities,
    probabilities: response.probabilities,
    bestIndex: response.best_index,
    temperature: response.temperature,
    embedding_adapter: response.embedding_adapter,
    model_id: response.model_id,
    notes: response.notes
  }));
}

export function generateTextOnBackend(params: {
  prompt: string;
  maxNewTokens: number;
}): Promise<BackendGenerationResponse> {
  return postJson<BackendGenerationResponse>("/api/models/generate", {
    prompt: params.prompt,
    max_new_tokens: params.maxNewTokens,
    adapter: "deterministic-backend"
  });
}

// ============================
// API v0.5: RAG visual + Agent Debugger
// ============================

export interface RagDocumentInput {
  id?: string | null;
  title: string;
  text: string;
  source: string;
}

export interface RagRetrievedDocument {
  id: string;
  title: string;
  text: string;
  source: string;
  score: number;
  semantic_score: number;
  lexical_score: number;
  citation: string;
}

export interface RagQueryResponse {
  query: string;
  top_k: number;
  retrieved: RagRetrievedDocument[];
  latency_ms: number;
  notes: string[];
}

export interface RagIngestResponse {
  indexed_documents: number;
  total_documents: number;
  document_ids: string[];
  message: string;
}

export interface RagStatusResponse {
  documents: number;
  store: string;
  ready_for_v06: boolean;
  notes: string[];
}

export interface AgentToolCall {
  name: string;
  input: string;
  output: string;
  latency_ms: number;
  status: "ok" | "warning" | "error" | "skipped";
}

export interface AgentDebugStep {
  step: number;
  node: string;
  description: string;
  attention_weight: number;
  evidence_ids: string[];
  tool_name: string | null;
}

export interface AgentDebugResponse {
  prompt: string;
  answer_draft: string;
  retrieved: RagRetrievedDocument[];
  tool_calls: AgentToolCall[];
  steps: AgentDebugStep[];
  groundedness: {
    score: number;
    cited_document_ids: string[];
    missing_evidence: string[];
    warning: string;
  };
  latency_ms: number;
  notes: string[];
}

export interface ExperimentSaveResponse {
  id: string;
  total_experiments: number;
  message: string;
}

export function getRagStatus(): Promise<RagStatusResponse> {
  return getJson<RagStatusResponse>("/api/rag/status");
}

export function ingestRagDocuments(documents: RagDocumentInput[], reset = false): Promise<RagIngestResponse> {
  return postJson<RagIngestResponse>("/api/rag/ingest", { documents, reset });
}

export function queryRag(params: { query: string; topK: number }): Promise<RagQueryResponse> {
  return postJson<RagQueryResponse>("/api/rag/query", {
    query: params.query,
    top_k: params.topK,
    min_score: 0,
    max_chars: 520
  });
}

export function debugAgent(params: {
  prompt: string;
  ragQuery: string;
  topK: number;
}): Promise<AgentDebugResponse> {
  return postJson<AgentDebugResponse>("/api/agents/debug", {
    prompt: params.prompt,
    rag_query: params.ragQuery,
    top_k: params.topK,
    max_steps: 5,
    enable_tools: true,
    include_memory: true
  });
}

export function saveExperiment(params: {
  name: string;
  module: string;
  payload: Record<string, unknown>;
}): Promise<ExperimentSaveResponse> {
  return postJson<ExperimentSaveResponse>("/api/experiments/save", params);
}
