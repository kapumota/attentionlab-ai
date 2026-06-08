### Fase 2.1 - GIFs de demo para README

#### Objetivo

Agregar evidencia visual rápida para que una persona entienda el valor de Attention AI Lab sin instalar dependencias ni ejecutar el proyecto localmente.

#### Alcance

Esta fase agrega tres GIFs de demostración al README:

- `assets/gifs/kv-cache-estimator.gif`
- `assets/gifs/agent-debugger.gif`
- `assets/gifs/transformer-builder.gif`

Los GIFs se generan a partir de las capturas vigentes del repositorio. No reemplazan la validación real del Hugging Face Space. Cuando el Space público esté disponible, se recomienda reemplazarlos por grabaciones reales de la aplicación funcionando desde navegador incógnito.

#### Criterios aplicados

- Documentación con títulos `###` y subtítulos `####`.
- Sin separadores de igualdad repetidos.
- Sin guiones largos en documentos Markdown.
- Textos visibles en español.
- Sin cambios funcionales en backend ni frontend.
- Sin modificar firmas de funciones existentes.

#### Archivos agregados

```text
assets/gifs/kv-cache-estimator.gif
assets/gifs/agent-debugger.gif
assets/gifs/transformer-builder.gif
scripts/validate-visual-assets.sh
docs/FASE_2_1_GIFS_README.md
```

#### Validación esperada

```bash
git diff --check
bash scripts/validate-visual-assets.sh
PYTHONPATH=apps/api python -m pytest apps/api/tests -q
npm --prefix apps/web run check
```

#### Pendiente posterior

Cuando el deploy público esté activo, actualizar los GIFs usando la URL real del Space:

```text
https://HF_USERNAME-attentio-ai-lab.hf.space
```
