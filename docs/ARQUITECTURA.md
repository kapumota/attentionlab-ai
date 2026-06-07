### Arquitectura de Attentio AI Lab

Attentio AI Lab  usa una arquitectura full-stack ligera:

```text
Frontend React/Vite
  a
Backend FastAPI
  a
Servicios didácticos de atención, LLM, MLLM, RAG y agentes
```

El objetivo de diseño es que la demo funcione sin GPU, sin OpenAI API y sin servicios externos obligatorios.

#### Vista general

```text
apps/web
  React + TypeScript + Vite
  Componentes didácticos
  Panel guiado
  Cliente API /api/*

apps/api
  FastAPI + Pydantic
  Routers REST
  Servicios deterministas
  Tests pytest

Dockerfile
  Compila frontend
  Instala backend
  Sirve /api/* y frontend estático en un solo puerto
```

#### Frontend

Ubicación:

```text
apps/web
```

Responsabilidades:

- Panel principal con navegación por secciones.
- Modos Básico, Técnico y Experto.
- Laboratorio visual de atención.
- Constructor visual de arquitectura Transformer.
- Estimador de KV cache y comparación MHA/GQA/MLA.
- MLLM playground con alineación imagen-texto.
- RAG visual y Agent Debugger.
- Consola de backend/API con request, response e interpretación.
- Glosario técnico.
- ErrorBoundary para módulos pesados.

Componentes principales:

```text
App.tsx
components/AttentionMatrix.tsx
components/ControlPanel.tsx
components/BackendPlayground.tsx
components/AgentDebuggerPlayground.tsx
components/ArchitectureBuilder.tsx
components/LLMPlayground.tsx
components/MLLMPlayground.tsx
components/GlossaryPanel.tsx
components/ErrorBoundary.tsx
components/CopyButton.tsx
core/apiClient.ts
config/api.ts
styles.css
```

#### Backend

Ubicación:

```text
apps/api
```

Responsabilidades:

- Exponer API REST con FastAPI.
- Validar contratos con Pydantic.
- Calcular atención didáctica.
- Estimar métricas de arquitectura LLM.
- Simular embeddings, RAG y agentes con fallback determinista.
- Servir frontend estático cuando `ATTENTIONLAB_STATIC_DIR` está definido.

Rutas principales:

```text
/api/health
/api/models/status
/api/models/runtime
/api/attention/compute
/api/architecture/validate
/api/llm/estimate
/api/mllm/contrastive-batch
/api/rag/status
/api/rag/ingest
/api/rag/query
/api/agents/trace
/api/agents/debug
/api/experiments/save
/api/experiments
```

#### Modo desarrollo local

En desarrollo se usan dos procesos:

```text
Terminal 1: FastAPI en http://localhost:8000
Terminal 2: Vite en http://localhost:5173
```

El frontend llama a rutas relativas `/api/*`. Vite redirige esas rutas hacia FastAPI mediante el proxy de `apps/web/vite.config.ts`.

```text
Navegador localhost:5173
  a
Vite dev server
  a
/api/* proxy
  a
FastAPI localhost:8000
```

#### Modo integrado FastAPI

Para probar frontend compilado con backend:

```text
npm --prefix apps/web run build
ATTENTIONLAB_STATIC_DIR=apps/web/dist
uvicorn app.main:app --port 7860
```

Flujo:

```text
FastAPI localhost:7860
  /       sirve frontend compilado
  /api/*  sirve endpoints REST
  /docs   sirve Swagger/OpenAPI
```

#### Modo Docker /Hugging Face Space

Docker usa dos etapas:

1. Node compila `apps/web`.
2. Python instala `apps/api` y copia el frontend compilado a `/app/static`.

```text
Dockerfile
  web-build: npm ci + npm run build
  runtime: python:3.11-slim + FastAPI + /app/static
```

En Docker y Hugging Face se usa un solo puerto:

```text
7860
```

#### Decisiones de diseño

#### Sin OpenAI API obligatoria

El proyecto no requiere `OPENAI_API_KEY`. Esto permite que la demo sea reproducible, gratuita y apta para despliegue público.

#### Fallback determinista

El backend usa servicios deterministas para mantener resultados reproducibles y evitar dependencias pesadas.

#### Modelos reales opcionales

Los adaptadores reales se activan solo con variables de entorno y dependencias opcionales:

```bash
export ATTENTIONLAB_ENABLE_REAL_MODELS=true
```

#### RAG educativo

El módulo RAG está diseñado para enseñanza: indexación, recuperación top-k, scores y groundedness. No pretende reemplazar una base vectorial de producción.

#### Siguientes mejoras posibles

- Persistencia real de experimentos.
- RAG persistente con SQLite, Chroma, FAISS o pgvector.
- Tests frontend con Vitest o Playwright.
- Exportación de reportes Markdown/PDF.
- Métricas reales de latencia por servicio.
