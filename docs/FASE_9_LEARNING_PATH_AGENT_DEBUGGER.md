### Fase 9 - Segundo Learning Path Agent Debugger

#### Objetivo

Convertir Agent Debugger Timeline en una experiencia educativa guiada, no solo en una demo libre.

#### Learning Path

Depura un agente paso a paso.

#### Checkpoints

- Checkpoint 1 - Qué es una traza de agente.
- Checkpoint 2 - Qué es un tool call.
- Checkpoint 3 - Cómo detectar warning, error y skipped.
- Checkpoint 4 - RAG con evidencia insuficiente.
- Checkpoint 5 - Exportar reporte técnico.
- Quiz - 3 preguntas con feedback inmediato.

#### Cambios técnicos

- Se agrega servicio backend para el learning path.
- Se agregan endpoints bajo `/api/learning`.
- Se agrega componente visual `AgentLearningPathPanel`.
- Se integra el panel dentro de Agent Debugger.
- Se agregan pruebas backend.
- Se actualiza documentación de testing.

#### Criterio de aceptación

- El usuario puede aprender a depurar agentes siguiendo checkpoints.
- El quiz entrega feedback inmediato.
- El recorrido conecta con trazas, tool calls, estados, RAG y reporte técnico.
- No se altera el contrato existente de Agent Debugger Timeline.
