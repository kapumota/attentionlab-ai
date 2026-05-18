from __future__ import annotations

import hashlib
import math
import os
import time
from dataclasses import dataclass
from typing import Iterable


@dataclass
class BackendModelResult:
    adapter: str
    model_id: str
    output: str
    latency_ms: float
    tokens_per_second: float | None
    notes: list[str]


def _stable_hash_floats(text: str, dimensions: int) -> list[float]:
    """Embedding determinista ligero para pruebas y fallback.

    No intenta reemplazar un embedding real. Sirve para mantener la API estable
    aunque el contenedor no tenga torch/transformers instalados.
    """
    values: list[float] = []
    counter = 0
    while len(values) < dimensions:
      digest = hashlib.sha256(f"{text}|{counter}".encode("utf-8")).digest()
      for byte in digest:
          values.append((byte / 255.0) * 2.0 - 1.0)
          if len(values) >= dimensions:
              break
      counter += 1
    norm = math.sqrt(sum(v * v for v in values)) or 1.0
    return [v / norm for v in values]


def cosine_similarity(a: Iterable[float], b: Iterable[float]) -> float:
    va = list(a)
    vb = list(b)
    dot = sum(x * y for x, y in zip(va, vb))
    na = math.sqrt(sum(x * x for x in va)) or 1.0
    nb = math.sqrt(sum(y * y for y in vb)) or 1.0
    return dot / (na * nb)


def softmax(values: list[float], temperature: float) -> list[float]:
    tau = max(temperature, 1e-6)
    scaled = [v / tau for v in values]
    max_value = max(scaled)
    exp_values = [math.exp(v - max_value) for v in scaled]
    total = sum(exp_values) or 1.0
    return [v / total for v in exp_values]


class RealModelService:
    """Servicio v0.5 para modelos pequeños reales con fallback seguro.

    Modos:
    - deterministic: no requiere dependencias pesadas; útil para tests.
    - python-transformers: intenta cargar Hugging Face Transformers en backend.

    La carga real se activa con ATTENTIONLAB_ENABLE_REAL_MODELS=true. Si no hay
    dependencias o el modelo falla, se retorna fallback determinista con notas.
    """

    def __init__(self) -> None:
        self.enable_real_models = os.getenv("ATTENTIONLAB_ENABLE_REAL_MODELS", "false").lower() == "true"
        self.default_text_model = os.getenv("ATTENTIONLAB_TEXT_MODEL_ID", "distilbert-base-uncased")
        self.default_embedding_model = os.getenv("ATTENTIONLAB_EMBEDDING_MODEL_ID", "sentence-transformers/all-MiniLM-L6-v2")
        self._generator = None
        self._feature_pipeline = None

    def status(self) -> dict[str, object]:
        return {
            "enabled": self.enable_real_models,
            "browser_transformers_js": True,
            "onnx_runtime_web": True,
            "python_transformers_optional": True,
            "default_text_model": self.default_text_model,
            "default_embedding_model": self.default_embedding_model,
            "available_adapters": [
                "browser-transformers-js",
                "onnx-runtime-web",
                "deterministic-backend",
                "python-transformers-optional",
            ],
            "message": (
                "Modelos reales habilitados por entorno; se intentará cargar Transformers en backend."
                if self.enable_real_models
                else "Modo ligero: Transformers.js/ONNX en navegador y fallback determinista en backend."
            ),
        }

    def embed(self, texts: list[str], dimensions: int = 64, adapter: str = "deterministic-backend") -> dict[str, object]:
        start = time.perf_counter()
        notes: list[str] = []
        model_id = self.default_embedding_model if adapter != "deterministic-backend" else "deterministic-hash-embedding"

        embeddings: list[list[float]]
        if adapter == "python-transformers" and self.enable_real_models:
            try:
                embeddings = self._embed_with_python_transformers(texts)
                notes.append("Embeddings generados con backend Python/Transformers.")
            except Exception as exc:  # pragma: no cover - depende del entorno externo
                embeddings = [_stable_hash_floats(text, dimensions) for text in texts]
                model_id = "deterministic-hash-embedding"
                notes.append(f"Fallback determinista porque el adaptador real falló: {exc.__class__.__name__}.")
        else:
            embeddings = [_stable_hash_floats(text, dimensions) for text in texts]
            notes.append("Fallback determinista activo; use Transformers.js en navegador o active backend real.")

        latency_ms = (time.perf_counter() - start) * 1000
        return {
            "adapter": adapter,
            "model_id": model_id,
            "dimensions": len(embeddings[0]) if embeddings else 0,
            "embeddings": embeddings,
            "latency_ms": latency_ms,
            "notes": notes,
        }

    def generate(self, prompt: str, max_new_tokens: int = 64, adapter: str = "deterministic-backend") -> BackendModelResult:
        start = time.perf_counter()
        notes: list[str] = []
        model_id = "rule-based-explainer"
        output: str

        if adapter == "python-transformers" and self.enable_real_models:
            try:
                output = self._generate_with_python_transformers(prompt, max_new_tokens)
                model_id = self.default_text_model
                notes.append("Texto generado con backend Python/Transformers.")
            except Exception as exc:  # pragma: no cover - depende del entorno externo
                output = self._fallback_generation(prompt)
                notes.append(f"Fallback explicativo porque el adaptador real falló: {exc.__class__.__name__}.")
        else:
            output = self._fallback_generation(prompt)
            notes.append("Generación determinista de respaldo; active backend real para usar un modelo pequeño.")

        latency_ms = (time.perf_counter() - start) * 1000
        tokens = max(1, len(output.split()))
        tps = tokens / max(latency_ms / 1000, 1e-6)
        return BackendModelResult(
            adapter=adapter,
            model_id=model_id,
            output=output,
            latency_ms=latency_ms,
            tokens_per_second=tps,
            notes=notes,
        )

    def contrastive_texts(self, anchor: str, candidates: list[str], temperature: float) -> dict[str, object]:
        texts = [anchor, *candidates]
        embedding_payload = self.embed(texts, dimensions=64)
        embeddings = embedding_payload["embeddings"]
        anchor_embedding = embeddings[0]
        candidate_embeddings = embeddings[1:]
        similarities = [cosine_similarity(anchor_embedding, emb) for emb in candidate_embeddings]
        probabilities = softmax(similarities, temperature)
        best_index = max(range(len(probabilities)), key=lambda index: probabilities[index]) if probabilities else 0
        return {
            "anchor": anchor,
            "candidates": candidates,
            "similarities": similarities,
            "probabilities": probabilities,
            "best_index": best_index,
            "temperature": temperature,
            "embedding_adapter": embedding_payload["adapter"],
            "model_id": embedding_payload["model_id"],
            "notes": embedding_payload["notes"],
        }

    def _fallback_generation(self, prompt: str) -> str:
        clipped = prompt.strip()[:180]
        return (
            "Respuesta de respaldo v0.5: el sistema recibió el prompt "
            f"«{clipped}». Para usar un modelo real, active ATTENTIONLAB_ENABLE_REAL_MODELS=true "
            "e instale las dependencias opcionales de Transformers/PyTorch."
        )

    def _embed_with_python_transformers(self, texts: list[str]) -> list[list[float]]:
        # Importación diferida para que el Space siga siendo ligero por defecto.
        from transformers import AutoModel, AutoTokenizer  # type: ignore
        import torch  # type: ignore

        tokenizer = AutoTokenizer.from_pretrained(self.default_embedding_model)
        model = AutoModel.from_pretrained(self.default_embedding_model)
        encoded = tokenizer(texts, padding=True, truncation=True, return_tensors="pt")
        with torch.no_grad():
            output = model(**encoded)
        token_embeddings = output.last_hidden_state
        attention_mask = encoded["attention_mask"].unsqueeze(-1)
        pooled = (token_embeddings * attention_mask).sum(dim=1) / attention_mask.sum(dim=1).clamp(min=1)
        normalized = torch.nn.functional.normalize(pooled, p=2, dim=1)
        return normalized.cpu().tolist()

    def _generate_with_python_transformers(self, prompt: str, max_new_tokens: int) -> str:
        from transformers import pipeline  # type: ignore

        if self._generator is None:
            self._generator = pipeline("text-generation", model=self.default_text_model)
        result = self._generator(prompt, max_new_tokens=max_new_tokens, do_sample=False)
        return str(result[0]["generated_text"])


real_model_service = RealModelService()
