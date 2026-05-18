from __future__ import annotations

import os

from app.schemas import ModelAdapterStatus


class ModelGateway:
    """Capa de preparación para v0.5.

    En v0.5 el gateway convive con endpoints reales ligeros. Por defecto mantiene fallback determinista para que el Space no dependa de PyTorch.
    """

    def __init__(self) -> None:
        self.enabled = os.getenv("ATTENTIONLAB_ENABLE_MODEL_ADAPTERS", "false").lower() == "true"
        self.default_model_id = os.getenv("ATTENTIONLAB_DEFAULT_MODEL_ID") or None

    def status(self) -> ModelAdapterStatus:
        return ModelAdapterStatus(
            enabled=self.enabled,
            default_model_id=self.default_model_id,
            available_adapters=["browser-transformers-js", "onnx-runtime-web", "deterministic-backend", "python-transformers-optional"],
            message=(
                "v0.5 incluye endpoints de modelos; por defecto usa fallback determinista y Transformers.js/ONNX en navegador."
                if not self.enabled
                else "Adaptadores backend habilitados; se intentará usar Python Transformers si las dependencias están instaladas."
            ),
        )


model_gateway = ModelGateway()
