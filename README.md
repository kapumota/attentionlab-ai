---

title: Attention AI Lab
emoji: 🧠
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 7860
fullWidth: true
short_description: Lab visual de IA generativa sin GPU
---

### Attention AI Lab

[![Version](https://img.shields.io/badge/version-v1.2.0-orange)](RELEASE_NOTES.md)
[![CI](https://github.com/kapumota/attentionlab-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/kapumota/attentionlab-ai/actions/workflows/ci.yml)
[![Demo](https://img.shields.io/badge/demo-Hugging%20Face-blue)](https://kapumota-attentio-ai-lab.hf.space)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

> Laboratorio interactivo para entender KV cache, atención moderna, diseño Transformer y depuración de agentes sin GPU ni API keys.

### Identidad del proyecto

#### Nombre público

El sistema se presenta como **Attention AI Lab**.

#### Nombre del repositorio

El repositorio conserva el nombre `attentionlab-ai` por compatibilidad con enlaces, historial de pull requests, badges, scripts y despliegues previos.

#### Nombre del Space

El Hugging Face Space conserva el slug histórico `attentio-ai-lab` porque ya está publicado y validado.

### El problema

Entender atención, KV cache y agentes modernos suele requerir leer papers, preparar infraestructura, ejecutar modelos pesados y depurar código poco transparente.

Esta barrera dificulta explicar conceptos actuales de IA generativa en clases, talleres, entrevistas técnicas y revisiones de arquitectura.

### La solución

Attention AI Lab ofrece simulaciones visuales deterministas, contratos API validables y recorridos guiados para estudiar conceptos de IA moderna de manera reproducible.

#### Qué ofrece

* Visualización de atención y configuraciones Transformer.
* KV Cache Estimator para comparar MHA, GQA, SWA y MLA conceptual.
* Learning Path guiado para KV cache.
* Agent Debugger Timeline con trazas deterministas.
* Learning Path guiado para depuración de agentes.
* Backend FastAPI con contratos Pydantic.
* Frontend React y TypeScript.
* Validación técnica reproducible.
* CI y Quality Gate.
* Despliegue público en Hugging Face Spaces.

### Demostración en vivo

#### Hugging Face Space

[Probar Attention AI Lab](https://kapumota-attentio-ai-lab.hf.space)

#### Endpoints públicos

* Aplicación: https://kapumota-attentio-ai-lab.hf.space
* Health check: https://kapumota-attentio-ai-lab.hf.space/api/health
* OpenAPI: https://kapumota-attentio-ai-lab.hf.space/docs

### Vista rápida

#### Recursos visuales

Los GIFs y capturas se mantienen en GitHub para mostrar los flujos principales del proyecto.

* KV Cache Estimator: `assets/gifs/kv-cache-estimator.gif`
* Agent Debugger: `assets/gifs/agent-debugger.gif`
* Constructor Transformer: `assets/gifs/transformer-builder.gif`
* Demo visual vigente: Hugging Face Space y GIFs en `assets/gifs/`.

### Hero feature

#### KV Cache Estimator

KV Cache Estimator permite comparar arquitecturas de atención y entender el costo lógico de memoria de KV cache en contextos largos, sin GPU, sin API keys y sin ejecutar modelos reales.

#### Capacidades

* Comparación entre MHA, GQA, SWA y MLA conceptual.
* Escenarios de 32k, 64k, 128k y 1M tokens.
* Configuración de capas, dimensión, heads, precisión y batch size.
* Exportación de resultados como JSON.
* Exportación de reporte técnico en Markdown.
* Explicación didáctica de las fórmulas.
* Advertencia explícita: estimador didáctico, no benchmark real.

### Segunda firma técnica

#### Agent Debugger Timeline

Agent Debugger Timeline permite estudiar y depurar agentes mediante trazas deterministas, estados por paso, tool calls simulados y reportes técnicos reproducibles.

#### Capacidades

* Timeline exportable como JSON.
* Estados por paso: `ok`, `warning`, `error` y `skipped`.
* Tool calls simulados con entrada, salida, latencia y estado.
* Error reproducible de herramienta.
* Caso RAG con evidencia insuficiente.
* Reporte técnico copiable en Markdown.
* Contratos compatibles entre backend y frontend.

### Learning paths

#### Entiende KV Cache en 12 minutos

El primer recorrido guiado explica el crecimiento de KV cache y las diferencias entre patrones de atención.

* Checkpoint 1: qué es KV cache.
* Checkpoint 2: por qué crece con el contexto.
* Checkpoint 3: MHA frente a GQA.
* Checkpoint 4: MLA y compresión latente conceptual.
* Checkpoint 5: diseñar una configuración para 128k tokens.
* Quiz de tres preguntas con feedback inmediato.

#### Depura un agente paso a paso

El segundo recorrido guiado conecta con Agent Debugger Timeline y enseña a interpretar trazas deterministas.

* Checkpoint 1: qué es una traza de agente.
* Checkpoint 2: qué es un tool call.
* Checkpoint 3: cómo interpretar `warning`, `error` y `skipped`.
* Checkpoint 4: cómo reconocer RAG con evidencia insuficiente.
* Checkpoint 5: cómo exportar un reporte técnico.
* Quiz de tres preguntas con feedback inmediato.

#### Próximos recorridos

* Diseña un Transformer eficiente.
* Atención visual: del softmax al patrón causal.

### Arquitectura

#### Frontend

* React.
* TypeScript.
* Vite.
* Componentes visuales con estados deterministas.
* Error boundaries para robustez de interfaz.
* Tipos compatibles con los contratos del backend.

#### Backend

* FastAPI.
* Pydantic.
* Routers organizados por dominio.
* Servicios deterministas.
* Pruebas automatizadas con Pytest.

#### Despliegue

* Docker multi-stage.
* Hugging Face Space con SDK Docker.
* Puerto público 7860.
* Validación de `/`, `/api/health` y `/docs`.

### Calidad visible

#### Validación reproducible

El proyecto incluye un punto único de validación para backend, frontend, documentación y, opcionalmente, el Space público.

```bash
make validate
```

#### Qué valida

* Pruebas del backend con Pytest.
* Instalación reproducible del frontend.
* Compilación y chequeo TypeScript.
* Build de producción con Vite.
* Revisión de whitespace con `git diff --check`.
* Revisión de convenciones documentales.
* Validación opcional del Hugging Face Space.

#### Validación del Space

```bash
HF_SPACE_URL=https://kapumota-attentio-ai-lab.hf.space make validate
```

#### Documentos de calidad

* [`docs/QUALITY_GATE.md`](docs/QUALITY_GATE.md)
* [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md)
* [`docs/TESTING.md`](docs/TESTING.md)

### Evidencia técnica

#### Trazabilidad de capacidades

| Capacidad                               | Evidencia en el repositorio                           | Reproducción               |
| --------------------------------------- | ----------------------------------------------------- | -------------------------- |
| CI de documentación, backend y frontend | `.github/workflows/ci.yml`                            | GitHub Actions             |
| Quality Gate                            | `docs/QUALITY_GATE.md`                                | `make validate`            |
| Checklist de publicación                | `docs/RELEASE_CHECKLIST.md`                           | Revisión previa al release |
| Cinco invariantes de KV cache           | `apps/api/tests/test_kv_cache_validation.py`          | Pytest específico          |
| Escenarios reproducibles                | `examples/kv-cache-validation-scenarios.json`         | Generador de reporte       |
| Reporte técnico reproducible            | `scripts/generate-kv-cache-validation-report.py`      | Ejecución local            |
| Learning Path de KV cache               | `apps/api/tests/test_learning_paths.py`               | Suite de backend           |
| Learning Path de Agent Debugger         | `apps/api/tests/test_agent_debugger_learning_path.py` | Suite de backend           |
| Validación del Space                    | `scripts/validate-hf-space.sh`                        | Variable `HF_SPACE_URL`    |
| Historial de versión                    | `CHANGELOG.md` y `RELEASE_NOTES.md`                   | Tag `v1.2.0`               |

### Validación técnica de KV Cache Estimator

#### Fórmula base

El estimador utiliza la siguiente relación didáctica:

```text
memoria_gb =
    capas
    * contexto_efectivo
    * 2
    * dimension_cache
    * bytes_por_valor
    * batch
    / 1e9
```

El factor `2` representa keys y values.

#### Invariantes automatizados

La validación técnica comprueba cinco propiedades:

1. La memoria estimada de MHA crece linealmente con la longitud de contexto.
2. GQA reduce memoria frente a MHA cuando utiliza menos KV heads.
3. SWA utiliza la ventana local como contexto efectivo.
4. MLA conceptual depende del rango latente configurado.
5. El escenario de un millón de tokens produce valores finitos y conserva las advertencias didácticas.

#### Ejecutar las pruebas específicas

```bash
PYTHONPATH=apps/api \
python -m pytest apps/api/tests/test_kv_cache_validation.py -q
```

#### Generar el reporte reproducible

```bash
PYTHONPATH=apps/api \
python scripts/generate-kv-cache-validation-report.py
```

Para guardar el resultado:

```bash
PYTHONPATH=apps/api \
python scripts/generate-kv-cache-validation-report.py \
> docs/RESULTADO_VALIDACION_KV_CACHE.md
```

#### Alcance de la validación

La validación actual demuestra:

* consistencia matemática,
* relaciones esperadas entre las arquitecturas modeladas,
* determinismo de los escenarios,
* reproducibilidad de los resultados,
* trazabilidad entre fórmulas, pruebas y documentación.

No mide memoria física en GPU, kernels CUDA, latencia real ni throughput productivo.

### Validaciones principales

#### Backend

```bash
PYTHONPATH=apps/api python -m pytest apps/api/tests -q
```

#### Frontend

```bash
npm --prefix apps/web ci --include=dev
npm --prefix apps/web run check
```

#### Validación integral

```bash
make validate
```

#### Hugging Face Space

```bash
HF_SPACE_URL=https://kapumota-attentio-ai-lab.hf.space \
bash scripts/validate-hf-space.sh
```

### Documentación técnica

* [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md)
* [`docs/TESTING.md`](docs/TESTING.md)
* [`docs/QUALITY_GATE.md`](docs/QUALITY_GATE.md)
* [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md)
* [`docs/VALIDACION_KV_CACHE.md`](docs/VALIDACION_KV_CACHE.md)
* [`docs/RESULTADO_VALIDACION_KV_CACHE.md`](docs/RESULTADO_VALIDACION_KV_CACHE.md)
* [`docs/FASE_3_HERO_KV_CACHE.md`](docs/FASE_3_HERO_KV_CACHE.md)
* [`docs/FASE_4_LEARNING_PATH_KV_CACHE.md`](docs/FASE_4_LEARNING_PATH_KV_CACHE.md)
* [`docs/FASE_5_AGENT_DEBUGGER_TIMELINE.md`](docs/FASE_5_AGENT_DEBUGGER_TIMELINE.md)
* [`docs/FASE_8_VALIDACION_TECNICA_KV_CACHE.md`](docs/FASE_8_VALIDACION_TECNICA_KV_CACHE.md)
* [`docs/RESULTADO_VALIDACION_HF_SPACE.md`](docs/RESULTADO_VALIDACION_HF_SPACE.md)

### Cómo ejecutar localmente

#### Requisitos

* Python 3.12.
* Node.js 20 o superior.
* npm.
* Docker opcional.

#### Backend

```bash
PYTHONPATH=apps/api \
python -m uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000
```

El backend estará disponible en:

```text
http://localhost:8000
http://localhost:8000/docs
```

#### Frontend

```bash
npm --prefix apps/web ci --include=dev
npm --prefix apps/web run dev
```

El frontend estará disponible en:

```text
http://localhost:5173
```

#### Docker

```bash
docker build -t attention-ai-lab:v1.2.0 .
docker run --rm -p 7860:7860 attention-ai-lab:v1.2.0
```

La aplicación estará disponible en:

```text
http://localhost:7860
http://localhost:7860/api/health
http://localhost:7860/docs
```

### Completado en v1.2.0

* Fase 1: normalización de identidad y versión.
* Fase 2: despliegue reproducible en Hugging Face Spaces.
* Fase 2.1: recursos visuales y GIFs.
* Fase 2.2: publicación y validación del Space.
* Fase 3: KV Cache Estimator como hero feature.
* Fase 4: Learning Path de KV cache.
* Fase 5: Agent Debugger Timeline.
* Fase 6: README orientado a portfolio técnico.
* Fase 7: badges, CI, checklist de release y Quality Gate.
* Fase 8: cinco invariantes automatizados, escenarios matemáticos reproducibles y generación de reporte técnico.
* Fase 9: Learning Path de Agent Debugger.
* Fase 10: release pública con tag `v1.2.0`, `CHANGELOG.md` y `RELEASE_NOTES.md`.

### Roadmap siguiente, posterior a v1.2.0

#### Fase 11: validación física en GPU

Medir memoria asignada y reservada en GPU mediante implementaciones controladas en PyTorch.

El protocolo deberá incluir:

* calentamiento previo,
* sincronización CUDA,
* reinicio de estadísticas de pico,
* múltiples repeticiones,
* reporte de variabilidad,
* descripción completa del hardware y software.

El objetivo será evaluar una calibración de la forma:

```text
M_observada = α * M_estimada + M_aux
```

#### Fase 12: comparación con runtimes de inferencia

Evaluar runtimes como:

* Hugging Face Transformers,
* vLLM,
* llama.cpp.

Las comparaciones deberán documentar:

* modelo,
* versión,
* precisión,
* batch size,
* longitud de contexto,
* patrón de atención,
* hardware,
* configuración del runtime.

No se presentarán arquitecturas o aproximaciones no equivalentes como comparaciones directas.

#### Fase 13: memoria, calidad y latencia

Medir:

* memoria pico,
* latencia,
* throughput,
* calidad bajo un protocolo reproducible.

Los resultados se utilizarán para construir una frontera de Pareto entre memoria, calidad y latencia.

Las comparaciones de calidad se realizarán solamente entre configuraciones metodológicamente comparables.

#### Fase 14: caso de estudio reproducible

Documentar un escenario de despliegue con:

* presupuesto fijo de memoria,
* configuración recomendada por el estimador,
* configuración realmente ejecutada,
* diferencia entre predicción y medición,
* calidad obtenida,
* latencia y throughput observados,
* limitaciones del experimento.

### Límites

Attention AI Lab es una herramienta didáctica y un marco experimental reproducible.

No es:

* un LLM entrenado desde cero,
* un sistema RAG productivo,
* un benchmark de rendimiento,
* un profiler real de GPU,
* un runtime de inferencia,
* un framework productivo de agentes.

#### Qué no intenta reemplazar

* Profilers reales de GPU.
* Benchmarks productivos de inferencia.
* Sistemas RAG persistentes.
* Frameworks productivos de agentes.
* Implementaciones optimizadas de kernels.
* Entrenamiento o fine-tuning de modelos reales.

### Disponibilidad de código

El código fuente, las pruebas, los escenarios, los scripts de reproducción y la documentación técnica están disponibles públicamente en este repositorio.

Para trabajos académicos se recomienda citar:

* la versión o tag utilizado,
* el commit exacto,
* el archivo de escenarios,
* el comando de validación ejecutado,
* las características del entorno experimental.

### Licencia

MIT. Ver [`LICENSE`](LICENSE).
