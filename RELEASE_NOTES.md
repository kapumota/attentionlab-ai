### Release Notes - v1.2.0

#### Resumen

Attention AI Lab v1.2.0 cierra una versión pública orientada a portfolio educativo de IA generativa. El proyecto permite explorar KV cache, atención moderna, diseño Transformer y depuración de agentes desde una demo pública sin GPU ni API keys.

#### Identidad

- Nombre público: **Attention AI Lab**.
- Repositorio: `attentionlab-ai`.
- Versión: `v1.2.0`.
- Space público: `https://kapumota-attentio-ai-lab.hf.space`.

#### Demo pública

- Aplicación: https://kapumota-attentio-ai-lab.hf.space
- Health check: https://kapumota-attentio-ai-lab.hf.space/api/health
- OpenAPI: https://kapumota-attentio-ai-lab.hf.space/docs

#### Capacidades principales

- KV Cache Estimator.
- Learning Path de KV Cache.
- Agent Debugger Timeline.
- Learning Path de Agent Debugger.
- Constructor Transformer.
- Validación técnica reproducible.
- CI y Quality Gate.
- Release Checklist.

#### Validación

```bash
make validate
HF_SPACE_URL=https://kapumota-attentio-ai-lab.hf.space make validate
```

#### Alcance

Attention AI Lab es una herramienta didáctica y reproducible. No reemplaza benchmarks productivos, profilers reales, sistemas RAG persistentes ni frameworks de agentes productivos.

#### Uso recomendado

- Portfolio técnico.
- Talleres de IA generativa.
- Clases de arquitectura Transformer.
- Explicación de KV cache y memoria de inferencia.
- Prácticas de depuración de agentes.
