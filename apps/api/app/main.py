from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import agent_debugger, agents, architecture, attention, experiments, health, llm, mllm, models, rag, real_models

APP_VERSION = "1.1.0-dev"

app = FastAPI(
    title="API de Attentio AI Lab",
    version=APP_VERSION,
    description="Backend FastAPI para atención, métricas LLM, modelos pequeños reales, RAG visual, MLLM y depuración de agentes.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [health.router, attention.router, architecture.router, llm.router, mllm.router, agents.router, agent_debugger.router, rag.router, experiments.router, models.router, real_models.router]:
    app.include_router(router, prefix="/api")

static_dir = Path(os.getenv("ATTENTIONLAB_STATIC_DIR", "static"))
if static_dir.exists():
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="web")
else:
    @app.get("/")
    def root() -> dict[str, str]:
        return {
            "name": "Attentio AI Lab",
            "version": APP_VERSION,
            "message": "API activa. Compila el frontend para servir la app estática.",
            "docs": "/docs",
            "health": "/api/health",
        }
