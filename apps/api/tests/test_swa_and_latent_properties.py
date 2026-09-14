"""Propiedades para saturación SWA y aproximación de cache latente.

Estas pruebas completan la búsqueda automatizada de contraejemplos sobre los
cinco invariantes del artículo. La generación es amplia pero no exhaustiva.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

from hypothesis import assume, given, settings, strategies as st

from app.schemas import LLMEstimateRequest
from app.services.llm_metrics import estimate_llm_costs
from app.services.sliding_window import swa_memory_gb

_PRECISION_FLOOR_GB = 1e-3
_PROPERTY_SETTINGS = settings(
    max_examples=200,
    deadline=None,
    database=None,
    derandomize=True,
)


@given(
    num_layers=st.integers(min_value=1, max_value=256),
    dimension=st.integers(min_value=64, max_value=32768),
    window_size=st.integers(min_value=1, max_value=1048576),
    batch_size=st.integers(min_value=1, max_value=128),
    data=st.data(),
)
@_PROPERTY_SETTINGS
def test_swa_satura_para_contextos_generados_mayores_que_la_ventana(
    num_layers: int,
    dimension: int,
    window_size: int,
    batch_size: int,
    data: st.DataObject,
) -> None:
    """Invariante 3: para T >= W la memoria SWA depende de W, no de T."""
    context_1 = data.draw(st.integers(min_value=window_size, max_value=1048576))
    context_2 = data.draw(st.integers(min_value=window_size, max_value=1048576))

    memory_1 = swa_memory_gb(
        num_layers,
        dimension,
        context_1,
        window_size,
        batch_size,
        "fp16",
    )
    memory_2 = swa_memory_gb(
        num_layers,
        dimension,
        context_2,
        window_size,
        batch_size,
        "fp16",
    )

    assert memory_1 == memory_2


@given(
    num_layers=st.integers(min_value=1, max_value=256),
    dimension=st.integers(min_value=64, max_value=32768),
    context_length=st.integers(min_value=1, max_value=1048576),
    batch_size=st.integers(min_value=1, max_value=128),
)
@_PROPERTY_SETTINGS
def test_swa_coincide_con_mha_cuando_ventana_cubre_contexto(
    num_layers: int,
    dimension: int,
    context_length: int,
    batch_size: int,
) -> None:
    """Caso límite de la Ecuación (4): W=T implica SWA=MHA."""
    memory_swa = swa_memory_gb(
        num_layers,
        dimension,
        context_length,
        context_length,
        batch_size,
        "fp16",
    )
    memory_mha = num_layers * context_length * 2 * dimension * 2 * batch_size / 1e9

    assert abs(memory_swa - memory_mha) <= 1e-12


@given(
    num_layers=st.integers(min_value=1, max_value=256),
    dimension=st.integers(min_value=65, max_value=32768),
    context_length=st.integers(min_value=128, max_value=1048576),
    batch_size=st.integers(min_value=1, max_value=128),
    data=st.data(),
)
@_PROPERTY_SETTINGS
def test_razon_latente_es_rango_sobre_dimension_en_casos_generados(
    num_layers: int,
    dimension: int,
    context_length: int,
    batch_size: int,
    data: st.DataObject,
) -> None:
    """Invariante 4: cache-latente/MHA = r/d bajo la aproximación del paper."""
    mla_rank = data.draw(st.integers(min_value=1, max_value=min(dimension - 1, 8192)))
    req = LLMEstimateRequest(
        num_layers=num_layers,
        dimension=dimension,
        query_heads=1,
        kv_heads=1,
        mla_rank=mla_rank,
        context_length=context_length,
        batch_size=batch_size,
        precision="fp16",
        rope=True,
    )
    result = estimate_llm_costs(req)
    assume(result.kv_cache_mha_gb >= _PRECISION_FLOOR_GB)

    expected_ratio = mla_rank / dimension
    observed_ratio = result.kv_cache_mla_gb / result.kv_cache_mha_gb
    tolerance = max(1e-6, (1e-6 / result.kv_cache_mha_gb) * 2)
    assert abs(observed_ratio - expected_ratio) <= tolerance


def test_reporte_reproducible_es_determinista_byte_a_byte() -> None:
    """Dos ejecuciones consecutivas del reporte producen el mismo texto."""
    repo_root = Path(__file__).resolve().parents[3]
    script = repo_root / "scripts" / "generate-kv-cache-validation-report.py"
    env = os.environ.copy()
    env["PYTHONPATH"] = str(repo_root / "apps" / "api")
    env["PYTHONDONTWRITEBYTECODE"] = "1"

    def run_once() -> str:
        result = subprocess.run(
            [sys.executable, str(script)],
            capture_output=True,
            text=True,
            check=True,
            cwd=repo_root,
            env=env,
            timeout=10,
        )
        return result.stdout

    first = run_once()
    second = run_once()

    assert first == second
    assert "Resultado reproducible de KV Cache Estimator" in first
