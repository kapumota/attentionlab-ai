### Reproducibilidad del artículo

#### Artefacto principal

El manuscrito usa Attention AI Lab v1.2.0:

- Repositorio: https://github.com/kapumota/attentionlab-ai
- Tag reproducible: `v1.2.0`
- Commit inmovilizado: `5e24e362302a14f8d8d3d77e56e9f964c2037ae1`
- Fecha de la release: 8 de junio de 2026
- Release: https://github.com/kapumota/attentionlab-ai/releases/tag/v1.2.0
- Demostración pública: https://kapumota-attentio-ai-lab.hf.space/
- Estado de la demostración: entorno demostrativo en evolución; puede diferir de la versión inmovilizada del estudio.
- Servicio analítico: `apps/api/app/services/llm_metrics.py`
- Contrato de entrada: `apps/api/app/schemas/contracts.py`
- Escenarios: `examples/kv-cache-validation-scenarios.json`
- Pruebas: `apps/api/tests/test_kv_cache_validation.py`
- Reporte: `scripts/generate-kv-cache-validation-report.py`
- Quality gate: `docs/QUALITY_GATE.md`

#### Generar datos y figuras del artículo

```bash
python generate_results.py
```

El comando produce:

```text
data/context_sweep.csv
data/sensitivity_128k.csv
data/precision_128k.csv
data/invariant_checks.csv
data/memory_budget.csv
data/composite_1m.csv
figures/context_sweep.png
figures/ratios_128k.png
figures/precision_128k.png
```

#### Compilar el manuscrito

```bash
pdflatex -interaction=nonstopmode -halt-on-error lara_avila.tex
bibtex lara_avila
pdflatex -interaction=nonstopmode -halt-on-error lara_avila.tex
pdflatex -interaction=nonstopmode -halt-on-error lara_avila.tex
```

#### Alcance

Los resultados principales representan almacenamiento lógico de KV cache. No incluyen pesos, activaciones, fragmentación ni buffers de kernels. La versión 5 añade una validación física mínima de tensores FP16 en CPU; no constituye una medición de GPU ni de un runtime de inferencia completo. SWA se deriva mediante `min(contexto, ventana)` en el script de validación. Los proxies didácticos de velocidad y perplejidad de la aplicación no se utilizan en el artículo. La demostración pública es mutable; la reproducción científica se basa exclusivamente en el tag `v1.2.0` y el commit inmovilizado.

#### Validación física mínima con PyTorch

La versión 5 incorpora un perfil acotado de asignación física en CPU:

```bash
python profile_pytorch_memory.py --repetitions 3 \
  --output data/pytorch_memory_profile.csv
```

El script ejecuta cada escenario en un subproceso nuevo, materializa y escribe el tensor FP16, y compara los bytes analíticos, los bytes del storage de PyTorch y la mediana del incremento de memoria residente (RSS). Los escenarios reducidos son MHA y GQA-4/16 con contexto de 8 192 tokens. La prueba valida la contabilidad de almacenamiento y la razón GQA/MHA, pero no sustituye un perfil CUDA ni un benchmark de un runtime de inferencia completo.


#### Dependencias de Python

- Python 3.11 o posterior.
- Matplotlib para regenerar figuras.
- PyTorch y psutil para el perfil físico mínimo.
