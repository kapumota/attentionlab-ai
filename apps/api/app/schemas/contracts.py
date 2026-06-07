from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field, field_validator

AttentionMode = Literal[
    "infonce",
    "completa",
    "causal",
    "ventana",
    "sparse",
    "gqa",
    "cross",
    "agente",
]

BlockType = Literal[
    "mha",
    "gqa",
    "swa_gqa",
    "mla",
    "sparse_topk",
    "gated_full_attention",
    "cross_attention",
]

Precision = Literal["fp32", "fp16", "bf16", "int8", "int4"]


class SimulationConfig(BaseModel):
    """Configuración compartida entre el frontend y el backend."""

    mode: AttentionMode = "infonce"
    tokens: int = Field(default=8, ge=2, le=64)
    temperature: float = Field(default=0.2, gt=0, le=5)
    window_size: int = Field(default=2, ge=1, le=32)
    top_k: int = Field(default=3, ge=1, le=64)
    query_heads: int = Field(default=8, ge=1, le=128)
    kv_heads: int = Field(default=2, ge=1, le=128)
    visual_head: int = Field(default=1, ge=1, le=128)

    @field_validator("kv_heads")
    @classmethod
    def kv_heads_positive(cls, value: int) -> int:
        return max(1, value)


class AttentionRequest(BaseModel):
    config: SimulationConfig
    matrix: list[list[float]] | None = None


class AttentionResponse(BaseModel):
    scores: list[list[float | None]]
    probabilities: list[list[float]]
    mask: list[list[bool]]
    row_losses: list[float]
    focused_row_loss: float
    max_probability: float
    relative_cost: float


class ArchitectureBlock(BaseModel):
    type: BlockType
    window: int | None = None
    compression_rank: int | None = None
    top_k: int | None = None
    gating: bool | None = None
    position_encoding: Literal["RoPE", "ALiBi", "none"] | None = None


class ArchitectureSpec(BaseModel):
    name: str = "Hybrid-GQA-SWA-MLA"
    num_layers: int = Field(default=12, ge=1, le=256)
    dimension: int = Field(default=768, ge=64, le=32768)
    heads: int = Field(default=8, ge=1, le=256)
    kv_heads: int = Field(default=2, ge=1, le=256)
    rope: bool = True
    gating: bool = False
    mla_compression_rank: int = Field(default=64, ge=1, le=8192)
    sparse_top_k: int = Field(default=3, ge=1, le=4096)
    repeat: int = Field(default=6, ge=1, le=128)
    layers: list[ArchitectureBlock]


class ArchitectureValidationResponse(BaseModel):
    valid: bool
    warnings: list[str]
    normalized: ArchitectureSpec


class LLMEstimateRequest(BaseModel):
    num_layers: int = Field(default=12, ge=1, le=256)
    dimension: int = Field(default=768, ge=64, le=32768)
    query_heads: int = Field(default=8, ge=1, le=256)
    kv_heads: int = Field(default=2, ge=1, le=256)
    mla_rank: int = Field(default=64, ge=1, le=8192)
    context_length: int = Field(default=8192, ge=128, le=1048576)
    batch_size: int = Field(default=1, ge=1, le=128)
    precision: Precision = "fp16"
    rope: bool = True


class LLMEstimateResponse(BaseModel):
    kv_cache_mha_gb: float
    kv_cache_gqa_gb: float
    kv_cache_mla_gb: float
    gqa_vs_mha_ratio: float
    mla_vs_gqa_ratio: float
    long_context_relations_millions: float
    perplexity_proxy: float
    tokens_per_second_proxy: int
    notes: list[str]


class ContrastiveBatchRequest(BaseModel):
    batch_size: int = Field(default=4, ge=2, le=64)
    temperature: float = Field(default=0.2, gt=0, le=5)
    similarities: list[list[float]] | None = None


class ContrastiveBatchResponse(BaseModel):
    probabilities: list[list[float]]
    row_losses: list[float]
    mean_loss: float
    alignment_pairs: list[str]


class AgentTraceRequest(BaseModel):
    prompt: str = Field(default="Explica el rol del KV cache en GQA", max_length=2000)
    include_tools: bool = True
    include_rag: bool = True
    max_steps: int = Field(default=5, ge=1, le=20)


class AgentTraceStep(BaseModel):
    step: int
    node: str
    description: str
    attention_weight: float


class AgentTraceResponse(BaseModel):
    trace: list[AgentTraceStep]
    dominant_context: str
    summary: str


class HealthResponse(BaseModel):
    status: Literal["ok"]
    version: str
    mode: Literal["docker-space", "local"]
    v04_ready: bool
    enabled_model_adapters: bool


class ModelAdapterStatus(BaseModel):
    enabled: bool
    default_model_id: str | None
    available_adapters: list[str]
    message: str

# ---
# Contratos v1.1.0-dev: modelos reales pequeños
# ---

ModelAdapter = Literal["deterministic-backend", "python-transformers", "browser-transformers-js", "onnx-runtime-web"]


class ModelRuntimeStatus(BaseModel):
    enabled: bool
    browser_transformers_js: bool
    onnx_runtime_web: bool
    python_transformers_optional: bool
    default_text_model: str
    default_embedding_model: str
    available_adapters: list[str]
    message: str


class EmbeddingRequest(BaseModel):
    texts: list[str] = Field(default_factory=lambda: ["atención causal", "KV cache en GQA"], min_length=1, max_length=16)
    dimensions: int = Field(default=64, ge=8, le=1024)
    adapter: ModelAdapter = "deterministic-backend"


class EmbeddingResponse(BaseModel):
    adapter: str
    model_id: str
    dimensions: int
    embeddings: list[list[float]]
    latency_ms: float
    notes: list[str]


class BackendGenerationRequest(BaseModel):
    prompt: str = Field(default="Explica GQA en una frase", min_length=1, max_length=2000)
    max_new_tokens: int = Field(default=64, ge=1, le=512)
    adapter: ModelAdapter = "deterministic-backend"


class BackendGenerationResponse(BaseModel):
    adapter: str
    model_id: str
    output: str
    latency_ms: float
    tokens_per_second: float | None
    notes: list[str]


class TextContrastiveRequest(BaseModel):
    anchor: str = Field(default="Una imagen de un perro jugando con una pelota", min_length=1, max_length=1000)
    candidates: list[str] = Field(
        default_factory=lambda: [
            "Un perro juega con una pelota en el parque",
            "Una receta de pasta con tomate",
            "Un documento sobre atención causal",
            "Una ciudad de noche con autos",
        ],
        min_length=2,
        max_length=16,
    )
    temperature: float = Field(default=0.2, gt=0, le=5)


class TextContrastiveResponse(BaseModel):
    anchor: str
    candidates: list[str]
    similarities: list[float]
    probabilities: list[float]
    best_index: int
    temperature: float
    embedding_adapter: str
    model_id: str
    notes: list[str]

# ---
# Contratos v1.1.0-dev: Agent Debugger + RAG visual
# ---

class RagDocument(BaseModel):
    id: str | None = Field(default=None, max_length=120)
    title: str = Field(default="Documento sin título", min_length=1, max_length=160)
    text: str = Field(default="", min_length=1, max_length=8000)
    source: str = Field(default="manual", max_length=160)


class RagIngestRequest(BaseModel):
    documents: list[RagDocument] = Field(default_factory=list, min_length=1, max_length=32)
    reset: bool = False


class RagIngestResponse(BaseModel):
    indexed_documents: int
    total_documents: int
    document_ids: list[str]
    message: str


class RagQueryRequest(BaseModel):
    query: str = Field(default="¿Cómo ayuda GQA al KV cache?", min_length=1, max_length=2000)
    top_k: int = Field(default=3, ge=1, le=10)
    min_score: float = Field(default=0.0, ge=0.0, le=1.0)
    max_chars: int = Field(default=420, ge=80, le=2000)


class RagRetrievedDocument(BaseModel):
    id: str
    title: str
    text: str
    source: str
    score: float
    semantic_score: float
    lexical_score: float
    citation: str


class RagQueryResponse(BaseModel):
    query: str
    top_k: int
    retrieved: list[RagRetrievedDocument]
    latency_ms: float
    notes: list[str]


class RagStatusResponse(BaseModel):
    documents: int
    store: str
    ready_for_v06: bool
    notes: list[str]


ToolStatus = Literal["ok", "warning", "error", "skipped"]


class AgentToolCall(BaseModel):
    name: str
    input: str
    output: str
    latency_ms: float
    status: ToolStatus = "ok"


class AgentDebugStep(BaseModel):
    step: int
    node: str
    description: str
    attention_weight: float
    evidence_ids: list[str] = Field(default_factory=list)
    tool_name: str | None = None


class GroundednessReport(BaseModel):
    score: float
    cited_document_ids: list[str]
    missing_evidence: list[str]
    warning: str


class AgentDebugRequest(BaseModel):
    prompt: str = Field(default="Explica por qué GQA reduce memoria en un LLM", min_length=1, max_length=3000)
    rag_query: str | None = Field(default=None, max_length=2000)
    top_k: int = Field(default=3, ge=1, le=10)
    max_steps: int = Field(default=5, ge=3, le=10)
    enable_tools: bool = True
    include_memory: bool = True


class AgentDebugResponse(BaseModel):
    prompt: str
    answer_draft: str
    retrieved: list[RagRetrievedDocument]
    tool_calls: list[AgentToolCall]
    steps: list[AgentDebugStep]
    groundedness: GroundednessReport
    latency_ms: float
    notes: list[str]


class ExperimentRecord(BaseModel):
    id: str | None = Field(default=None, max_length=120)
    name: str = Field(default="Experimento Attentio", max_length=160)
    module: str = Field(default="agent-debugger", max_length=80)
    payload: dict = Field(default_factory=dict)


class ExperimentSaveResponse(BaseModel):
    id: str
    total_experiments: int
    message: str


class ExperimentListResponse(BaseModel):
    experiments: list[ExperimentRecord]
