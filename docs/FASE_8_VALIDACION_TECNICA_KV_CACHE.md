### Fase 8 - Validación técnica de KV Cache Estimator

#### Objetivo

Demostrar que KV Cache Estimator no solo es una visualización atractiva, sino una herramienta técnicamente defendible para explicar memoria de inferencia en contexto largo.

#### Cambios incluidos

- Agrega documentación técnica de la fórmula del estimador.
- Agrega escenarios reproducibles para 32k, 64k, 128k y 1M tokens.
- Agrega comparación didáctica entre MHA, GQA, SWA y MLA.
- Agrega pruebas de regresión numérica para memoria estimada.
- Agrega script para generar un reporte Markdown reproducible.
- Refuerza que el estimador es didáctico y no benchmark real.

#### Archivos agregados

- `docs/VALIDACION_KV_CACHE.md`
- `docs/FASE_8_VALIDACION_TECNICA_KV_CACHE.md`
- `examples/kv-cache-validation-scenarios.json`
- `scripts/generate-kv-cache-validation-report.py`
- `apps/api/tests/test_kv_cache_validation.py`

#### Validación local

```bash
PYTHONPATH=apps/api python -m pytest apps/api/tests/test_kv_cache_validation.py -q
PYTHONPATH=apps/api python -m pytest apps/api/tests -q
npm --prefix apps/web run check
make validate
```

#### Reporte reproducible

```bash
PYTHONPATH=apps/api python scripts/generate-kv-cache-validation-report.py
```

#### Nota sobre Hugging Face Space

Hugging Face Space puede permanecer pausado durante esta fase. La validación principal es local y matemática. La validación pública se puede ejecutar después de reactivar o republicar el Space.

#### Criterio de cierre

La fase queda cerrada cuando las pruebas de regresión pasan, el reporte puede generarse y la documentación declara claramente supuestos, fórmula, escenarios y límites.
