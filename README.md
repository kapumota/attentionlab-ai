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

El repositorio conserva el nombre `attentionlab-ai` por compatibilidad con enlaces, historial de PRs, badges, scripts y despliegues previos.

#### Nombre del Space

El Hugging Face Space conserva el slug histórico `attentio-ai-lab` porque ya está publicado y validado.


### El problema

Entender atención, KV cache y agentes modernos suele requerir leer papers, montar infraestructura, ejecutar modelos pesados y depurar código opaco. Esa barrera hace difícil explicar conceptos actuales de IA generativa en clases, talleres, entrevistas técnicas y revisiones de arquitectura.

### La solución

Attention AI Lab ofrece simulaciones visuales deterministas, contratos API validables y recorridos guiados para aprender conceptos de IA moderna de forma reproducible.

#### Qué ofrece

- Visualización de atención y configuraciones Transformer.
- KV Cache Estimator para comparar MHA, GQA, MLA y SWA.
- Learning Path guiado para KV cache.
- Agent Debugger Timeline con trazas deterministas.
- Backend FastAPI con contratos Pydantic.
- Frontend React + TypeScript reproducible.
- Deploy público en Hugging Face Space.

### Demostración en vivo

#### Hugging Face Space

[Probar Attention AI Lab](https://kapumota-attentio-ai-lab.hf.space)

#### Endpoints públicos

- Aplicación: https://kapumota-attentio-ai-lab.hf.space
- Health check: https://kapumota-attentio-ai-lab.hf.space/api/health
- OpenAPI: https://kapumota-attentio-ai-lab.hf.space/docs

### Vista rápida

#### Recursos visuales

Los GIFs y capturas se mantienen en GitHub para mostrar los flujos principales del proyecto.

- KV Cache Estimator: `assets/gifs/kv-cache-estimator.gif`
- Agent Debugger: `assets/gifs/agent-debugger.gif`
- Constructor Transformer: `assets/gifs/transformer-builder.gif`
- Demo visual vigente: Hugging Face Space y GIFs en `assets/gifs/`.

### Hero feature

#### KV Cache Estimator

KV Cache Estimator permite comparar arquitecturas de atención y entender el costo de memoria en contexto largo sin GPU, sin API keys y sin ejecutar modelos reales.

#### Capacidades

- Comparación MHA vs GQA vs SWA vs MLA.
- Escenarios 32k, 64k, 128k y 1M tokens.
- Exportación de resultados como JSON.
- Exportación de reporte técnico en Markdown.
- Explicación didáctica de la fórmula.
- Advertencia clara: estimador didáctico, no benchmark real.

### Segunda firma

#### Agent Debugger Timeline

Agent Debugger Timeline permite depurar agentes mediante trazas deterministas, estados por paso, tool calls simulados y reportes técnicos copiables.

#### Capacidades

- Timeline exportable como JSON.
- Estados por paso: ok, warning, error y skipped.
- Tool calls simulados con entrada, salida, latencia y estado.
- Error reproducible de herramienta.
- Caso RAG con evidencia insuficiente.
- Reporte técnico copiable en Markdown.

### Learning paths

#### Entiende KV Cache en 12 minutos

- Checkpoint 1 - Qué es KV cache.
- Checkpoint 2 - Por qué crece con el contexto.
- Checkpoint 3 - MHA vs GQA.
- Checkpoint 4 - MLA y compresión latente.
- Checkpoint 5 - Diseña una configuración para 128k tokens.
- Quiz - 3 preguntas con feedback inmediato.

#### Próximos recorridos

- Diseña un Transformer eficiente.
- Depura un agente paso a paso.
- Atención visual: del softmax al patrón causal.

### Segundo Learning Path

#### Depura un agente paso a paso

El segundo recorrido guiado conecta con Agent Debugger Timeline y enseña depuración de agentes mediante trazas deterministas.

#### Checkpoints

- Checkpoint 1 - Qué es una traza de agente.
- Checkpoint 2 - Qué es un tool call.
- Checkpoint 3 - Cómo detectar warning, error y skipped.
- Checkpoint 4 - RAG con evidencia insuficiente.
- Checkpoint 5 - Exportar reporte técnico.
- Quiz - 3 preguntas con feedback inmediato.


### Arquitectura

#### Frontend

- React.
- TypeScript.
- Vite.
- Componentes visuales con estados deterministas.
- Error boundaries para robustez de interfaz.

#### Backend

- FastAPI.
- Pydantic.
- Routers por dominio.
- Servicios deterministas.
- Tests con Pytest.

#### Deploy

- Docker multi-stage.
- Hugging Face Space con SDK Docker.
- Puerto público 7860.
- Validación de `/api/health` y `/docs`.

### Calidad visible

#### Validación reproducible

El proyecto incluye un punto único de validación para backend, frontend, documentación y Space público.

```bash
make validate
```

#### Qué valida

- Pruebas backend con Pytest.
- Compilación y chequeo TypeScript del frontend.
- Revisión de whitespace con `git diff --check`.
- Revisión documental sin separadores no deseados ni guiones largos.
- Validación opcional del Hugging Face Space con `HF_SPACE_URL`.

#### Documentos de calidad

- `docs/QUALITY_GATE.md`
- `docs/RELEASE_CHECKLIST.md`


### Evidencia técnica

#### Validaciones principales

```bash
PYTHONPATH=apps/api python -m pytest apps/api/tests -q
npm --prefix apps/web run check
HF_SPACE_URL=https://kapumota-attentio-ai-lab.hf.space bash scripts/validate-hf-space.sh
```

#### Documentación relacionada

- `docs/FASE_3_HERO_KV_CACHE.md`
- `docs/FASE_4_LEARNING_PATH_KV_CACHE.md`
- `docs/FASE_5_AGENT_DEBUGGER_TIMELINE.md`
- `docs/RESULTADO_VALIDACION_HF_SPACE.md`
- `docs/TESTING.md`
- `docs/ARQUITECTURA.md`

### Cómo ejecutar localmente

#### Backend

```bash
PYTHONPATH=apps/api python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
npm --prefix apps/web ci --include=dev
npm --prefix apps/web run dev
```

#### Docker

```bash
docker build -t attention-ai-lab:v1.2.0 .
docker run --rm -p 7860:7860 attention-ai-lab:v1.2.0
```

### Límites

Attention AI Lab es una herramienta didáctica y reproducible. No es un LLM entrenado desde cero, no es un RAG productivo y no es un benchmark de rendimiento.

#### Qué no intenta reemplazar

- Profilers reales de GPU.
- Benchmarks productivos de inferencia.
- Sistemas RAG persistentes.
- Frameworks de agentes productivos.
- Entrenamiento o fine-tuning de modelos reales.

### Roadmap cercano

#### Fase 7 - Calidad visible

Agregar badges, CI, checklist de release y quality gate.

#### Fase 8 - Validación técnica de KV Cache Estimator

Agregar validación matemática y casos reproducibles.

#### Fase 9 - Segundo Learning Path

Crear un recorrido guiado para depurar agentes paso a paso.

#### Fase 10 - Release pública

Cerrar versión estable con changelog, release notes y GitHub Release.

### Licencia

MIT. Ver `LICENSE`.
