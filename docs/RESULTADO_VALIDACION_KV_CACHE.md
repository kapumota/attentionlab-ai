### Resultado reproducible de KV Cache Estimator

#### Supuestos

- 32 capas.
- Dimensión 4096.
- Precisión fp16.
- Batch size 1.
- RoPE activado como codificación posicional conceptual.
- Estimación didáctica, no benchmark real.

#### Tabla de escenarios

| Escenario | Contexto | MHA | GQA | SWA | MLA |
| --- | ---: | ---: | ---: | ---: | ---: |
| MHA 32k baseline | 32768 | 17.180 GB | 17.180 GB | 2.147 GB | 2.147 GB |
| GQA 64k eficiente | 65536 | 34.360 GB | 8.590 GB | 2.147 GB | 4.295 GB |
| SWA 128k local | 131072 | 68.719 GB | 17.180 GB | 2.147 GB | 8.590 GB |
| MLA conceptual 1M | 1048576 | 549.756 GB | 137.439 GB | 4.295 GB | 68.719 GB |

#### Interpretación

- MHA sirve como baseline porque guarda keys y values para todas las heads.
- GQA reduce memoria al usar menos KV heads que query heads.
- SWA reduce memoria activa al limitar la ventana local conceptual.
- MLA se modela como cache latente de menor rango.

#### Límite

Este reporte no mide kernels, latencia real ni memoria GPU. Sirve para validar consistencia matemática del estimador.
