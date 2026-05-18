### AttentionLab AI 

**AttentionLab AI** es un dashboard  full-stack para visualizar y experimentar conceptos modernos de IA: mecanismos de atención, arquitecturas Transformer, estimación de KV cache, comparación MHA/GQA/MLA, RAG visual, depuración de agentes, MLLM e integración con backend FastAPI.

Este lanzamiento está preparado para demostración pública, GitHub y Hugging Face Docker Spaces. Incluye frontend React/Vite, backend FastAPI, endpoints reproducibles, documentación técnica, ejemplos JSON, validación local, Dockerfile y flujo de despliegue.

#### Características principales

| Área | Incluye |
|---|---|
| Dashboard guiado | Navegación por secciones, demo guiada, presets y modos Básico/Técnico/Experto |
| Laboratorio de atención | Matriz interactiva con encabezados, inspector de celda, softmax, temperatura, máscaras causal/local/top-k, GQA e InfoNCE |
| Constructor Transformer | Bloques visuales de capas, SWA/GQA/MLA, RoPE, gating, JSON técnico colapsable y validación backend |
| Estimador LLM | KV cache MHA/GQA/MLA, gráficas, contexto largo, batch size, tokens/s estimados y panel comparativo |
| MLLM playground | Alineación imagen-texto, candidatos editables, ranking InfoNCE e interpretación didáctica |
| RAG + Agent Debugger | Pipeline visual, indexación, recuperación top-k, scores, citas, groundedness, tool tracing y timeline del agente |
| Backend / API | Consola visual con request, response, latencia, interpretación, errores comunes y botones de copia |
| Robustez frontend | ErrorBoundary, accesibilidad, role=status, aria-labels, mensajes de error guiados y copiado para README |

#### No requiere OpenAI API

El proyecto funciona por defecto sin credenciales externas:

```text
OpenAI API: no requerida
Modo backend: deterministic / fallback ligero
GPU: no requerida
```

Los modelos reales son opcionales y se activan solo si instalas dependencias adicionales y defines variables de entorno.

#### Estructura del repositorio

```text
attentionlab-ai-v1.0.9/
├── apps/
│   ├── web/                  # Frontend React + TypeScript + Vite
│   └── api/                  # Backend FastAPI + Pydantic
├── docs/                     # Documentación técnica
├── examples/                 # Payloads JSON reproducibles
├── screenshots/              # Capturas y GIF demo
├── scripts/                  # Validaciones local/Docker
├── Dockerfile                # Hugging Face Docker Space
├── docker-compose.yml
├── Makefile
├── .env.example
└── README.md
```

#### Ubicación del frontend

El frontend está en:

```text
apps/web
```

Archivos principales:

```text
apps/web/src/App.tsx                         # Dashboard principal
apps/web/src/main.tsx                        # Entrada React
apps/web/src/styles.css                      # Estilos globales
apps/web/src/components/                     # Componentes UI
apps/web/src/components/AttentionMatrix.tsx
apps/web/src/components/ControlPanel.tsx
apps/web/src/components/BackendPlayground.tsx
apps/web/src/components/AgentDebuggerPlayground.tsx
apps/web/src/components/ArchitectureBuilder.tsx
apps/web/src/components/LLMPlayground.tsx
apps/web/src/components/MLLMPlayground.tsx
apps/web/src/components/GlossaryPanel.tsx
apps/web/src/components/ErrorBoundary.tsx
apps/web/src/components/CopyButton.tsx
apps/web/src/core/apiClient.ts               # Cliente HTTP del frontend
apps/web/src/config/api.ts                   # Base URL de API
apps/web/vite.config.ts                      # Proxy local /api a FastAPI
```

#### Requisitos

- Node.js `^20.19.0` o `>=22.12.0`. Recomendado: Node 22 LTS.
- Python 3.10 o 3.11. Recomendado local: Python 3.10/3.11 con `pyenv`; Docker usa Python 3.11.
- Docker opcional para validar Hugging Face Docker Spaces.

#### Instalación local recomendada

##### 1. Python con pyenv y entorno `.atencion`

```bash
pyenv local 3.10.x
python --version

python -m venv .atencion
source .atencion/bin/activate

python -m pip install --upgrade pip
pip install -r apps/api/requirements-dev.txt
```

##### 2. Frontend con npm limpio

```bash
nvm use 22
npm config set registry https://registry.npmjs.org/
npm --prefix apps/web ci --no-audit --no-fund
```

`npm ci` se recomienda para una instalación reproducible basada en `package-lock.json`.

#### Ejecutar en desarrollo local

Usa dos terminales.

##### Terminal 1: backend FastAPI

```bash
cd attentionlab-ai-v1.0.9
source .atencion/bin/activate
PYTHONPATH=apps/api uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend:

```text
http://localhost:8000
http://localhost:8000/api/health
http://localhost:8000/docs
```

##### Terminal 2: frontend Vite

```bash
cd attentionlab-ai-v1.0.9
npm --prefix apps/web run dev
```

Frontend:

```text
http://localhost:5173
```

En desarrollo, Vite usa proxy para enviar `/api/*` hacia `http://localhost:8000`.

##### Ejecutar como aplicación integrada FastAPI

```bash
npm --prefix apps/web run build
export ATTENTIONLAB_STATIC_DIR="$PWD/apps/web/dist"
PYTHONPATH=apps/api uvicorn app.main:app --host 0.0.0.0 --port 7860
```

Abre:

```text
http://localhost:7860
http://localhost:7860/api/health
http://localhost:7860/docs
```

##### Docker

```bash
docker build -t attentionlab-ai:v1.0.9 .
docker run --rm -p 7860:7860 attentionlab-ai:v1.0.9
```

Con Docker Compose:

```bash
docker compose up --build
```

Luego abre:

```text
http://localhost:7860
```

##### Hugging Face Docker Space

Este repositorio está preparado para Hugging Face Docker Spaces mediante el bloque YAML superior del `README.md`:

```yaml
sdk: docker
app_port: 7860
```

Subida manual:

```bash
git remote add space https://huggingface.co/spaces/HF_USERNAME/attentionlab-ai
git push --force space main
```

También puedes usar GitHub Actions con `HF_TOKEN`, reemplazando `HF_USERNAME/attentionlab-ai` por tu repo real.

##### Validación

```bash
npm --prefix apps/web run check
PYTHONPATH=apps/api python -m pytest apps/api/tests -q
bash scripts/validate-local.sh
```

Validación Docker:

```bash
bash scripts/validate-docker.sh
```

#### Endpoints principales

```text
GET  /api/health
GET  /api/models/status
GET  /api/models/runtime
POST /api/models/embed
POST /api/models/generate
POST /api/models/contrastive-texts
POST /api/attention/compute
POST /api/architecture/validate
POST /api/llm/estimate
POST /api/mllm/contrastive-batch
POST /api/agents/trace
POST /api/agents/debug
GET  /api/rag/status
POST /api/rag/ingest
POST /api/rag/query
POST /api/experiments/save
GET  /api/experiments
```

#### Modelos reales opcionales

Por defecto el backend usa fallback determinista. Para activar modelos reales opcionales:

```bash
pip install -r apps/api/requirements-v1.0.optional.txt
export ATTENTIONLAB_ENABLE_REAL_MODELS=true
export ATTENTIONLAB_EMBEDDING_MODEL_ID=sentence-transformers/all-MiniLM-L6-v2
export ATTENTIONLAB_TEXT_MODEL_ID=distilbert-base-uncased
```

#### Archivos que no deben subirse

```text
.atencion/
apps/web/node_modules/
apps/web/dist/
__pycache__/
.pytest_cache/
.env
```

#### Licencia

MIT. Ver `LICENSE`.
