### Changelog

#### v1.2.0 - Portfolio educativo de IA generativa

#### Agregado

- KV Cache Estimator como hero feature para comparar MHA, GQA, SWA y MLA.
- Learning Path de KV Cache con checkpoints y quiz de feedback inmediato.
- Agent Debugger Timeline con estados por paso, tool calls simulados y reporte técnico copiable.
- Learning Path de Agent Debugger para depurar agentes paso a paso.
- Validación técnica reproducible del KV Cache Estimator.
- Quality Gate para validaciones obligatorias.
- Release Checklist para publicación controlada.
- Workflow CI para documentación, backend y frontend.
- Script único `make validate`.
- Publicación en Hugging Face Space.

#### Cambiado

- El README fue reorganizado como página de portfolio.
- La identidad pública se normaliza como **Attention AI Lab**.
- El repositorio mantiene el slug `attentionlab-ai` por compatibilidad.
- La documentación se alinea con la versión pública `v1.2.0`.
- Los comandos Docker usan la imagen `attention-ai-lab:v1.2.0`.

#### Eliminado

- Screenshots obsoletos del inicio del proyecto.
- Referencias documentales a capturas antiguas no representativas.

#### Límites

- Attention AI Lab es una herramienta didáctica y reproducible.
- No es un LLM entrenado desde cero.
- No es un RAG productivo.
- No es un benchmark real de rendimiento.
- No reemplaza profilers de GPU ni frameworks productivos de agentes.
