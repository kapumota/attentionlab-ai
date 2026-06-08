### Fase 1 - Rebranding y consistencia técnica

#### Objetivo

Convertir la identidad pública del proyecto de AttentionLab AI a Attention AI Lab sin modificar la lógica funcional ni romper contratos existentes entre frontend, backend y pruebas.

#### Alcance aplicado

- Nombre público actualizado a `Attention AI Lab`.
- Slug técnico actualizado a `attentio-ai-lab`.
- Versión unificada a `v1.2.0`.
- Imagen Docker actualizada a `attentio-ai-lab:v1.2.0`.
- Metadatos de `package.json` y `apps/web/package.json` actualizados.
- Textos visibles principales actualizados a español.
- Separadores largos con signos igual reemplazados por separadores simples `---`.
- Variables `ATTENTIONLAB_*` conservadas por compatibilidad.

#### Decisiones de compatibilidad

No se renombraron funciones, interfaces ni campos de contrato porque eso cambiaría la API interna del proyecto. El objetivo de esta fase es identidad y consistencia, no refactor funcional.

Los términos técnicos como `KV Cache`, `GQA`, `MLA`, `FastAPI`, `Agent Debugger` y `RAG` se mantienen porque son nombres técnicos estándar usados en documentación, UI y entrevistas.

#### Validación esperada

```bash
PYTHONPATH=apps/api python -m pytest apps/api/tests -q
npm --prefix apps/web ci
npm --prefix apps/web run check
docker build -t attentio-ai-lab:v1.2.0 .
```

#### Commit sugerido

```bash
git add .
git commit -m "fase 1: unifica identidad y version de Attention AI Lab"
git push -u origin fase-1-rebranding-attentio-ai-lab
```
