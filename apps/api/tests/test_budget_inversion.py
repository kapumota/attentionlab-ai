from __future__ import annotations

import math

import pytest
from hypothesis import given, settings, strategies as st

from app.services.budget_inversion import (
    max_context_for_budget,
    swa_window_fits_budget,
    verify_round_trip,
)

_TABLE_3 = [
    # budget_gb, d_cache, expected_t_max
    (24, 4096, 45776),
    (24, 1024, 183105),
    (24, 512, 366210),
    (48, 4096, 91552),
    (48, 1024, 366210),
    (48, 512, 732421),
    (80, 4096, 152587),
    (80, 1024, 610351),
    (80, 512, 1220703),
]


@pytest.mark.parametrize("budget_gb,d_cache,expected_t_max", _TABLE_3)
def test_table_3_exact_values(budget_gb: int, d_cache: int, expected_t_max: int) -> None:
    result = max_context_for_budget(
        budget_gb=budget_gb,
        num_layers=32,
        d_cache=d_cache,
        batch_size=1,
        precision="fp16",
    )

    assert result == expected_t_max


@pytest.mark.parametrize("budget_gb,d_cache,_", _TABLE_3)
def test_round_trip_is_tight_for_table_3(budget_gb: int, d_cache: int, _: int) -> None:
    result = verify_round_trip(
        budget_gb=budget_gb,
        num_layers=32,
        d_cache=d_cache,
        batch_size=1,
        precision="fp16",
    )

    assert result.fits_budget
    assert result.next_exceeds_budget


def test_swa_window_8192_fits_in_24_gb() -> None:
    assert swa_window_fits_budget(
        budget_gb=24,
        num_layers=32,
        dimension=4096,
        window_size=8192,
        batch_size=1,
        precision="fp16",
    )


def test_swa_window_8192_does_not_fit_in_4_gb() -> None:
    assert not swa_window_fits_budget(
        budget_gb=4,
        num_layers=32,
        dimension=4096,
        window_size=8192,
        batch_size=1,
        precision="fp16",
    )


def test_tiny_budget_can_return_zero_context_and_still_be_tight() -> None:
    result = verify_round_trip(
        budget_gb=1e-6,
        num_layers=32,
        d_cache=4096,
        batch_size=1,
        precision="fp16",
    )

    assert result.max_context == 0
    assert result.fits_budget
    assert result.next_exceeds_budget


@pytest.mark.parametrize("budget_gb", [0, -1, math.inf, math.nan])
def test_rejects_invalid_budget(budget_gb: float) -> None:
    with pytest.raises(ValueError):
        max_context_for_budget(budget_gb, num_layers=32, d_cache=4096)


def test_rejects_unknown_precision() -> None:
    with pytest.raises(ValueError, match="precision no soportada"):
        max_context_for_budget(24, num_layers=32, d_cache=4096, precision="fp8")


@given(
    budget_milligb=st.integers(min_value=1, max_value=200_000),
    num_layers=st.integers(min_value=1, max_value=256),
    d_cache=st.integers(min_value=1, max_value=32768),
    batch_size=st.integers(min_value=1, max_value=8),
    precision=st.sampled_from(["fp32", "fp16", "bf16", "int8", "int4"]),
)
@settings(max_examples=300, deadline=None, database=None, derandomize=True)
def test_round_trip_es_ajustado_en_casos_generados(
    budget_milligb: int,
    num_layers: int,
    d_cache: int,
    batch_size: int,
    precision: str,
) -> None:
    """Busca contraejemplos a la inversión en configuraciones válidas generadas."""
    budget_gb = budget_milligb / 1000
    result = verify_round_trip(
        budget_gb=budget_gb,
        num_layers=num_layers,
        d_cache=d_cache,
        batch_size=batch_size,
        precision=precision,
    )

    assert result.fits_budget
    assert result.next_exceeds_budget
