### Fase 4 - Learning Path KV Cache

#### Objetivo

Pasar de un playground libre a una experiencia de curriculum interactivo centrada en KV Cache Estimator.

#### Ruta implementada

La ruta principal se llama `Entiende KV Cache en 12 minutos` y guía al usuario por cinco checkpoints y un quiz final.

#### Checkpoints

- Checkpoint 1 - Qué es KV cache.
- Checkpoint 2 - Por qué crece con el contexto.
- Checkpoint 3 - MHA vs GQA.
- Checkpoint 4 - MLA y compresión latente.
- Checkpoint 5 - Diseña una configuración para 128k tokens.

#### Quiz

El quiz contiene tres preguntas con feedback inmediato:

- Crecimiento de memoria por contexto.
- Reducción de memoria con GQA.
- Alcance didáctico del estimador.

#### Backend

Se agregan endpoints bajo `/api/learning`:

```text
/api/learning/kv-cache-path
/api/learning/kv-cache-path/quiz
```

#### Frontend

Se agrega un panel `LearningPathPanel` dentro del módulo KV Cache Estimator. Cada checkpoint puede aplicar un escenario directamente sobre el estimador.

#### Alcance

Esta fase no cambia la lógica de estimación de memoria. Organiza el conocimiento como recorrido guiado y mantiene la advertencia de que el estimador es didáctico, no benchmark real.

#### Validación

```bash
git diff --check
PYTHONPATH=apps/api python -m pytest apps/api/tests -q
npm --prefix apps/web run check
```
