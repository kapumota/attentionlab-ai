from __future__ import annotations

import pytest

from app.services.sliding_window import effective_context, swa_memory_gb, swa_ratio


@pytest.mark.parametrize(
    ("context_length", "window_size", "expected"),
    [
        (4096, 8192, 4096),
        (8192, 8192, 8192),
        (131072, 4096, 4096),
    ],
)
def test_effective_context_usa_minimo(
    context_length: int,
    window_size: int,
    expected: int,
) -> None:
    assert effective_context(context_length, window_size) == expected


def test_swa_coincide_con_mha_si_ventana_cubre_contexto() -> None:
    memory = swa_memory_gb(
        num_layers=32,
        dimension=4096,
        context_length=4096,
        window_size=8192,
        batch_size=1,
        precision="fp16",
    )
    expected_mha = 32 * 4096 * 2 * 4096 * 2 / 1e9

    assert memory == pytest.approx(expected_mha, rel=1e-12)
    assert swa_ratio(4096, 8192) == pytest.approx(1.0)


def test_swa_se_satura_al_superar_la_ventana() -> None:
    first = swa_memory_gb(32, 4096, 131072, 8192, 1, "fp16")
    second = swa_memory_gb(32, 4096, 1048576, 8192, 1, "fp16")

    assert first == pytest.approx(second, rel=1e-12)
    assert swa_ratio(1048576, 8192) == pytest.approx(8192 / 1048576)


@pytest.mark.parametrize(
    ("precision", "expected_bytes"),
    [
        ("fp32", 4),
        ("fp16", 2),
        ("bf16", 2),
        ("int8", 1),
        ("int4", 0.5),
    ],
)
def test_swa_respeta_bytes_por_precision(
    precision: str,
    expected_bytes: float,
) -> None:
    memory = swa_memory_gb(1, 64, 128, 128, 1, precision)
    expected = 1 * 128 * 2 * 64 * expected_bytes / 1e9
    assert memory == pytest.approx(expected, rel=1e-12)


@pytest.mark.parametrize(
    ("args", "message"),
    [
        ((0, 4096, 8192, 4096, 1, "fp16"), "num_layers"),
        ((32, 0, 8192, 4096, 1, "fp16"), "dimension"),
        ((32, 4096, 0, 4096, 1, "fp16"), "context_length"),
        ((32, 4096, 8192, 0, 1, "fp16"), "window_size"),
        ((32, 4096, 8192, 4096, 0, "fp16"), "batch_size"),
    ],
)
def test_swa_rechaza_parametros_no_positivos(
    args: tuple[int, int, int, int, int, str],
    message: str,
) -> None:
    with pytest.raises(ValueError, match=message):
        swa_memory_gb(*args)


def test_swa_rechaza_precision_desconocida() -> None:
    with pytest.raises(ValueError, match="precision no soportada"):
        swa_memory_gb(32, 4096, 8192, 4096, 1, "fp64")
