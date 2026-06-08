### Validación técnica de KV Cache Estimator

#### Objetivo

Validar que KV Cache Estimator sea matemáticamente consistente, reproducible y defendible como herramienta didáctica. Esta validación no convierte el módulo en benchmark productivo ni mide memoria real de GPU.

#### Fórmula base

La estimación didáctica usa esta idea general:

```text
memoria_gb = capas * contexto_efectivo * 2 * dimension_cache * bytes_por_valor * batch / 1e9
```

#### Interpretación de cada término

- `capas`: número de capas Transformer.
- `contexto_efectivo`: tokens considerados por el patrón de atención.
- `2`: keys y values.
- `dimension_cache`: dimensión guardada para la cache.
- `bytes_por_valor`: depende de la precisión numérica.
- `batch`: cantidad de secuencias procesadas.

#### Casos modelados

#### MHA

MHA funciona como baseline. El contexto efectivo es el contexto completo y la dimensión cacheada corresponde a la dimensión del modelo.

#### GQA

GQA reduce memoria al usar menos KV heads que query heads. En el estimador se modela como una razón:

```text
kv_cache_gqa = kv_cache_mha * kv_heads / query_heads
```

#### SWA

SWA reduce memoria activa al usar una ventana local conceptual:

```text
kv_cache_swa = capas * ventana_swa * 2 * dimension * bytes_por_valor * batch / 1e9
```

#### MLA

MLA se modela de forma conceptual como una cache latente de menor rango:

```text
kv_cache_mla = capas * contexto * 2 * mla_rank * bytes_por_valor * batch / 1e9
```

#### Escenarios reproducibles

Los escenarios de referencia están en:

```text
examples/kv-cache-validation-scenarios.json
```

Cubren:

- MHA 32k baseline.
- GQA 64k eficiente.
- SWA 128k local.
- MLA conceptual 1M.

#### Reporte reproducible

El reporte se genera con:

```bash
PYTHONPATH=apps/api python scripts/generate-kv-cache-validation-report.py
```

Para guardarlo como archivo:

```bash
PYTHONPATH=apps/api python scripts/generate-kv-cache-validation-report.py > docs/RESULTADO_VALIDACION_KV_CACHE.md
```

#### Pruebas de regresión

La validación automática se ejecuta con:

```bash
PYTHONPATH=apps/api python -m pytest apps/api/tests/test_kv_cache_validation.py -q
```

La suite completa se ejecuta con:

```bash
make validate
```

#### Criterios de aceptación

- MHA debe crecer de forma proporcional al contexto.
- GQA debe reducir memoria frente a MHA cuando `kv_heads < query_heads`.
- SWA debe usar la ventana local como contexto efectivo.
- MLA debe depender del rango latente conceptual.
- El escenario 1M debe producir valores finitos y una advertencia didáctica.

#### Límites

Esta validación no mide:

- Kernels CUDA.
- Latencia real.
- Memoria real en GPU.
- Throughput productivo.
- Implementaciones propietarias de MLA.

Su valor está en hacer explícitos los supuestos, las fórmulas y los límites del estimador.
