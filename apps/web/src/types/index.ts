// Tipos centrales del proyecto.
// Se separan para que el simulador pueda crecer hacia backend PyTorch/FastAPI.

export type LearningMode = "basic" | "technical" | "expert";

export interface MatrixCellSelection {
  row: number;
  col: number;
}

export type AttentionMode =
  | "infonce"
  | "completa"
  | "causal"
  | "ventana"
  | "sparse"
  | "gqa"
  | "cross"
  | "agente";

export type AttentionBlockType =
  | "mha"
  | "gqa"
  | "swa_gqa"
  | "mla"
  | "sparse_topk"
  | "gated_full_attention"
  | "cross_attention";

export interface SimulationConfig {
  mode: AttentionMode;
  tokens: number;
  temperature: number;
  windowSize: number;
  topK: number;
  queryHeads: number;
  kvHeads: number;
  visualHead: number;
}

export interface AttentionResult {
  scaledScores: number[][];
  probabilities: number[][];
  mask: boolean[][];
}

export interface BuilderConfig {
  numLayers: number;
  dimension: number;
  blockType: AttentionBlockType;
  windowSize: number;
  mlaRank: number;
  repeat: number;
  rope: boolean;
  gating: boolean;
}

export interface ArchitectureBlock {
  type: AttentionBlockType;
  window?: number;
  compression_rank?: number;
  top_k?: number;
  gating?: boolean;
  position_encoding?: "RoPE";
}

export interface ArchitectureSpec {
  layers: ArchitectureBlock[];
  repeat: number;
  dimension: number;
  num_layers: number;
  heads: number;
  kv_heads: number;
  rope: boolean;
  gating: boolean;
  mla_compression_rank: number;
  sparse_top_k: number;
}

export interface LlmMetricsConfig {
  contextLength: number;
  batchSize: number;
  dimension: number;
  layers: number;
  queryHeads: number;
  kvHeads: number;
  mlaRank: number;
  rope: boolean;
}

export interface LlmMetrics {
  kvCacheMhaGB: number;
  kvCacheGqaGB: number;
  kvCacheMlaGB: number;
  gqaVsMha: number;
  mlaVsGqa: number;
  longContextRelationsMillions: number;
  approximatePerplexity: number;
  estimatedTokensPerSecond: number;
}
