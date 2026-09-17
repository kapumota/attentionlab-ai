### Reproducibilidad del artículo

#### Artefacto principal

Attention AI Lab v1.2.0 se conserva sin modificaciones como release base del
estimador y del contrato público.

- Repositorio: https://github.com/kapumota/attentionlab-ai
- Release base: `v1.2.0`
- Commit de la release base: `5e24e362302a14f8d8d3d77e56e9f964c2037ae1`
- Fecha de la release base: 8 de junio de 2026
- Release: https://github.com/kapumota/attentionlab-ai/releases/tag/v1.2.0
- Demostración pública: https://kapumota-attentio-ai-lab.hf.space/
- Estado de la demostración: entorno mutable que no constituye un ancla de reproducibilidad.
- Servicio base: `apps/api/app/services/llm_metrics.py`
- SWA: `apps/api/app/services/sliding_window.py`
- Composición: `apps/api/app/services/composition.py`
- Inverse sizing: `apps/api/app/services/budget_inversion.py`
- Contrato de entrada: `apps/api/app/schemas/contracts.py`
- Generador canónico: `scripts/generate-paper-kv-results.py`
- Manifest de resultados: `data/paper-kv-results/manifest.json`

La revisión científica incorpora artefactos posteriores a `v1.2.0`. La
referencia inmutable del artefacto científico revisado se fijará mediante un
commit o tag al cerrar la revisión final.

#### Regenerar las 71 configuraciones canónicas

Desde la raíz del repositorio:

```bash
PYTHONPATH=apps/api \
PYTHONDONTWRITEBYTECODE=1 \
python scripts/generate-paper-kv-results.py
```

El generador reutiliza los servicios canónicos del backend y produce:

```text
data/paper-kv-results/context_sweep.csv
data/paper-kv-results/sensitivity_128k.csv
data/paper-kv-results/precision_128k.csv
data/paper-kv-results/manifest.json
```

El manifest registra las 71 configuraciones y los hashes SHA-256 de los tres
CSV. Esta es la cadena canónica para el barrido experimental reproducible.

#### Generar datos y figuras editoriales

Desde la raíz del repositorio:

```bash
cd paper
PYTHONDONTWRITEBYTECODE=1 python generate_results.py
cd ..
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

Desde la raíz del repositorio:

```bash
cd paper
pdflatex -interaction=nonstopmode -halt-on-error lara_avila.tex
bibtex lara_avila
pdflatex -interaction=nonstopmode -halt-on-error lara_avila.tex
pdflatex -interaction=nonstopmode -halt-on-error lara_avila.tex
cd ..
```

#### Alcance

Los resultados principales representan almacenamiento lógico de KV cache. No
incluyen pesos, activaciones, fragmentación, metadatos ni buffers o workspaces
de kernels. La revisión incorpora una comprobación empírica de storage de
tensores FP16 en CPU, que no constituye una medición de GPU ni de un runtime de
inferencia completo. SWA se modela mediante `min(contexto, ventana)`. Los
proxies didácticos de velocidad y perplejidad de la aplicación no se utilizan
como evidencia científica. La demostración pública es mutable y no se utiliza
como ancla de reproducibilidad. El tag `v1.2.0` se conserva como release base,
mientras que la referencia inmutable de la revisión se fijará al cerrar el
artefacto final.

#### Comprobación empírica de storage con PyTorch

La revisión conserva un perfil histórico acotado de tensores en CPU.
Este comando se ejecuta desde la raíz del repositorio:

```bash
python profile_pytorch_memory.py --repetitions 3 \
  --output data/pytorch_memory_profile.csv
```

El script ejecuta cada escenario en un subproceso nuevo, materializa y escribe
el tensor FP16 y compara los bytes analíticos, los bytes de
`untyped_storage().nbytes()` y la mediana del incremento de memoria residente
(RSS). Los escenarios históricos son MHA y GQA-4/16 con contexto de 8 192
tokens.

La evidencia principal es la igualdad entre los bytes analíticos y el storage
materializado. RSS se conserva como observación histórica dependiente del
proceso, allocator y sistema operativo. Esta comprobación no calibra memoria
física de inferencia, no constituye profiling CUDA y no se extrapola a GPU.

#### Dependencias de Python

- Python 3.11 o posterior.
- Matplotlib para regenerar figuras.
- PyTorch y psutil para reproducir opcionalmente el perfil histórico de storage en CPU.
