from __future__ import annotations

import hashlib
import math
import re
import time
from dataclasses import dataclass, field

from app.schemas import (
    RagDocument,
    RagIngestRequest,
    RagIngestResponse,
    RagQueryRequest,
    RagQueryResponse,
    RagRetrievedDocument,
    RagStatusResponse,
)


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-záéíóúñü0-9]+", text.lower())


def _stable_embedding(text: str, dimensions: int = 64) -> list[float]:
    """Embedding determinista ligero para RAG visual.

    No reemplaza un embedding semántico real. Mantiene el contrato de API estable
    en Hugging Face Spaces sin instalar dependencias pesadas por defecto.
    """
    values: list[float] = []
    counter = 0
    while len(values) < dimensions:
        digest = hashlib.sha256(f"rag|{text}|{counter}".encode("utf-8")).digest()
        for byte in digest:
            values.append((byte / 255.0) * 2.0 - 1.0)
            if len(values) >= dimensions:
                break
        counter += 1
    norm = math.sqrt(sum(v * v for v in values)) or 1.0
    return [v / norm for v in values]


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(y * y for y in b)) or 1.0
    return dot / (na * nb)


def _keyword_score(query: str, text: str) -> float:
    q = set(_tokenize(query))
    d = set(_tokenize(text))
    if not q or not d:
        return 0.0
    return len(q & d) / len(q | d)


@dataclass
class _StoredDocument:
    id: str
    title: str
    text: str
    source: str
    embedding: list[float] = field(default_factory=list)


class RagStore:
    """Vector store en memoria para v1.1.0-dev.

    Está pensado para demo, tests y Space gratuito. La una fase posterior podría reemplazarlo
    por SQLite + FAISS, Chroma, LanceDB u otro almacén persistente.
    """

    def __init__(self) -> None:
        self.documents: list[_StoredDocument] = []
        self.seed_defaults()

    def seed_defaults(self) -> None:
        if self.documents:
            return
        self.ingest(
            RagIngestRequest(
                documents=[
                    RagDocument(
                        id="doc-kv-cache",
                        title="KV cache y GQA",
                        text="GQA reduce el KV cache al compartir claves y valores entre grupos de query heads. Esto mejora memoria y throughput en inferencia.",
                        source="preset:llm",
                    ),
                    RagDocument(
                        id="doc-infonce",
                        title="InfoNCE para alineación multimodal",
                        text="InfoNCE aumenta la probabilidad del par correcto imagen-texto frente a negativos dentro del batch. Es útil en CLIP, retrieval y MLLMs.",
                        source="preset:mllm",
                    ),
                    RagDocument(
                        id="doc-agent-trace",
                        title="Trazas de agentes",
                        text="Un agent debugger registra plan, acción, herramienta, observación, documentos recuperados y respuesta final para auditar decisiones.",
                        source="preset:agents",
                    ),
                ],
                reset=True,
            )
        )

    def ingest(self, req: RagIngestRequest) -> RagIngestResponse:
        if req.reset:
            self.documents.clear()
        start_count = len(self.documents)
        for index, doc in enumerate(req.documents):
            doc_id = doc.id or f"doc-{start_count + index + 1}"
            self.documents.append(
                _StoredDocument(
                    id=doc_id,
                    title=doc.title,
                    text=doc.text,
                    source=doc.source,
                    embedding=_stable_embedding(f"{doc.title}\n{doc.text}"),
                )
            )
        return RagIngestResponse(
            indexed_documents=len(req.documents),
            total_documents=len(self.documents),
            document_ids=[doc.id for doc in self.documents],
            message="Documentos indexados en el vector store visual en memoria.",
        )

    def query(self, req: RagQueryRequest) -> RagQueryResponse:
        start = time.perf_counter()
        query_embedding = _stable_embedding(req.query)
        scored: list[tuple[float, float, float, _StoredDocument]] = []
        for doc in self.documents:
            semantic = (_cosine(query_embedding, doc.embedding) + 1.0) / 2.0
            lexical = _keyword_score(req.query, f"{doc.title} {doc.text}")
            score = 0.68 * semantic + 0.32 * lexical
            if score >= req.min_score:
                scored.append((score, semantic, lexical, doc))
        scored.sort(key=lambda item: item[0], reverse=True)
        retrieved = [
            RagRetrievedDocument(
                id=doc.id,
                title=doc.title,
                text=doc.text[: req.max_chars],
                source=doc.source,
                score=round(score, 4),
                semantic_score=round(semantic, 4),
                lexical_score=round(lexical, 4),
                citation=f"{doc.source}:{doc.id}",
            )
            for score, semantic, lexical, doc in scored[: req.top_k]
        ]
        latency_ms = (time.perf_counter() - start) * 1000
        return RagQueryResponse(
            query=req.query,
            top_k=req.top_k,
            retrieved=retrieved,
            latency_ms=latency_ms,
            notes=[
                "Recuperación híbrida determinista: similitud vectorial ligera + solapamiento léxico.",
                "Para producción, sustituir por embeddings reales y vector store persistente.",
            ],
        )

    def status(self) -> RagStatusResponse:
        return RagStatusResponse(
            documents=len(self.documents),
            store="in-memory-deterministic-vector-store",
            ready_for_v06=True,
            notes=[
                "v1.1.0-dev implementa RAG visual reproducible.",
                "La siguiente evolución natural es persistencia y embeddings reales por colección.",
            ],
        )


rag_store = RagStore()
