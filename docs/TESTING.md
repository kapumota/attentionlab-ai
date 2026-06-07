### Pruebas y validación de Attentio AI Lab

Esta guía resume cómo validar frontend, backend, API, Docker y flujo completo.

#### Validación completa local

Desde la raíz del proyecto:

```bash
source .atencion/bin/activate
bash scripts/validate-local.sh
```

El script debe comprobar:

```text
Pruebas de backend
Frontend TypeScript
Compilación de producción del frontend
Validación local completada
```

#### Backend

```bash
source .atencion/bin/activate
PYTHONPATH=apps/api python -m pytest apps/api/tests -q
```

La suite cubre:

- health check,
- Tiempo de ejecución de modelos,
- Cálculo de atención
- Validación de arquitectura,
- Estimación LLM,
- Lote contrastivo MLLM
- Embeddings/retorno de generación
- Estado/consulta/ingesta RAG
- Depurador de agentes
- Rastreo de agentes
- Persistencia ligera de experimentos.

Resultado esperado:

```text
passed
```

#### Frontend

Instalación limpia:

```bash
npm --prefix apps/web ci --no-audit --no-fund
```

TypeScript + build:

```bash
npm --prefix apps/web run check
```

Build explícito:

```bash
npm --prefix apps/web run build
```

Resultado esperado:

```text
TypeScript OK
Vite build OK
```

#### API manual con curl

Primero levanta backend:

```bash
source .atencion/bin/activate
PYTHONPATH=apps/api uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

En otra terminal:

```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/api/models/status
curl http://localhost:8000/api/models/runtime
```

Validar arquitectura:

```bash
curl -X POST http://localhost:8000/api/architecture/validate   -H "Content-Type: application/json"   --data @examples/architecture-hybrid.json
```

Attention compute:

```bash
curl -X POST http://localhost:8000/api/attention/compute   -H "Content-Type: application/json"   --data @examples/attention-causal.json
```

RAG:

```bash
curl -X POST http://localhost:8000/api/rag/ingest   -H "Content-Type: application/json"   --data @examples/rag-ingest.json

curl -X POST http://localhost:8000/api/rag/query   -H "Content-Type: application/json"   --data @examples/rag-query.json
```

#### Frontend manual

Levanta backend y frontend:

```text
Terminal 1: http://localhost:8000
Terminal 2: http://localhost:5173
```

Revisa en navegador:

```text
http://localhost:5173
```

Validaciones visuales recomendadas:

1. Barra global: Backend OK.
2. Vista general: glosario y demo guiada.
3. Laboratorio de atención: matriz interactiva e interpretación automática.
4. Constructor Transformer: tarjetas y JSON colapsado.
5. LLM Cost: gráficas MHA/GQA/MLA.
6. RAG + Agent Debugger: indexar, consultar y depurar agente.
7. Backend / API: request, response, interpretación y curl.
8. Release: checklist colapsado.

#### Docker

```bash
bash scripts/validate-docker.sh
```

Validación manual:

```bash
docker build -t attentio-ai-lab:v1.1.0-dev .
docker run --rm -p 7860:7860 attentio-ai-lab:v1.1.0-dev
```

En otra terminal:

```bash
curl http://localhost:7860/api/health
```

Abre:

```text
http://localhost:7860
http://localhost:7860/docs
```

#### Criterio de lanzamiento

Antes de publicar, deben pasar:

```bash
npm --prefix apps/web ci --no-audit --no-fund
npm --prefix apps/web run check
PYTHONPATH=apps/api python -m pytest apps/api/tests -q
bash scripts/validate-local.sh
```

Y, si Docker está disponible:

```bash
bash scripts/validate-docker.sh
```


### Validación de despliegue cero fricción

La Fase 2 valida que Attentio AI Lab pueda ejecutarse localmente como contenedor y luego publicarse como Hugging Face Docker Space.

#### Validación local

```bash
git diff --check
PYTHONPATH=apps/api python -m pytest apps/api/tests -q
npm --prefix apps/web run check
```

#### Validación Docker

```bash
bash scripts/validate-docker.sh
```

#### Validación del Space público

Después de publicar el Space:

```bash
HF_SPACE_URL=https://HF_USERNAME-attentio-ai-lab.hf.space bash scripts/validate-hf-space.sh
```

La validación debe confirmar:

```text
/
/api/health
/docs
```

### Validación de recursos visuales

#### Objetivo

La Fase 2.1 valida que los GIFs usados por el README existan y no estén vacíos.

#### Comando

```bash
bash scripts/validate-visual-assets.sh
```

#### Archivos validados

```text
assets/gifs/kv-cache-estimator.gif
assets/gifs/agent-debugger.gif
assets/gifs/transformer-builder.gif
```

### Validación del Learning Path KV Cache

#### Objetivo

La Fase 4 valida que el primer learning path convierta KV Cache Estimator en una experiencia guiada con checkpoints y quiz de feedback inmediato.

#### Backend

```bash
PYTHONPATH=apps/api python -m pytest apps/api/tests/test_learning_paths.py -q
```

#### Suite completa

```bash
PYTHONPATH=apps/api python -m pytest apps/api/tests -q
npm --prefix apps/web run check
```

#### Endpoints cubiertos

- `GET /api/learning/kv-cache-path`
- `POST /api/learning/kv-cache-path/quiz`

#### Casos validados

- La ruta contiene cinco checkpoints.
- El quiz contiene tres preguntas.
- Las respuestas correctas devuelven feedback positivo.
- Las respuestas incorrectas devuelven explicación.
- El frontend puede usar fallback local si el backend no responde.
