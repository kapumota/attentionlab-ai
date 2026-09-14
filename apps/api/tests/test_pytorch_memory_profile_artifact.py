from __future__ import annotations

import csv
import math
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
CSV_PATH = REPO_ROOT / "data" / "pytorch_memory_profile.csv"
SCRIPT_PATH = REPO_ROOT / "profile_pytorch_memory.py"


def _rows() -> list[dict[str, str]]:
    with CSV_PATH.open(newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))


def test_perfil_historico_contiene_los_dos_escenarios_de_tabla_5() -> None:
    rows = _rows()

    assert [row["scenario"] for row in rows] == ["MHA", "GQA-4/16"]
    assert all(row["device"] == "cpu" for row in rows)
    assert all(row["repetitions"] == "3" for row in rows)


def test_storage_pytorch_coincide_exactamente_con_memoria_analitica() -> None:
    """La evidencia fuerte del perfil es storage lógico, no RSS."""
    for row in _rows():
        analytical = float(row["analytical_mb"])
        storage = float(row["pytorch_storage_mb"])
        relative_error = float(row["storage_relative_error_pct"])

        assert storage == analytical
        assert relative_error == 0.0


def test_razon_gqa_mha_del_perfil_es_un_cuarto() -> None:
    rows = {row["scenario"]: row for row in _rows()}

    mha = float(rows["MHA"]["analytical_mb"])
    gqa = float(rows["GQA-4/16"]["analytical_mb"])

    assert math.isclose(gqa / mha, 0.25, rel_tol=0.0, abs_tol=1e-12)


def test_snapshot_historico_conserva_valores_reportados_en_tabla_5() -> None:
    """RSS se conserva como evidencia histórica y no como valor reproducible exacto."""
    rows = {row["scenario"]: row for row in _rows()}

    assert float(rows["MHA"]["analytical_mb"]) == 134.217728
    assert float(rows["MHA"]["pytorch_storage_mb"]) == 134.217728
    assert float(rows["MHA"]["rss_delta_median_mb"]) == 134.221824
    assert float(rows["MHA"]["rss_over_logical_pct"]) == 0.0030517578125

    assert float(rows["GQA-4/16"]["analytical_mb"]) == 33.554432
    assert float(rows["GQA-4/16"]["pytorch_storage_mb"]) == 33.554432
    assert float(rows["GQA-4/16"]["rss_delta_median_mb"]) == 33.558528
    assert float(rows["GQA-4/16"]["rss_over_logical_pct"]) == 0.01220703125


def test_script_documenta_y_materializa_la_medicion_cpu() -> None:
    text = SCRIPT_PATH.read_text(encoding="utf-8")

    assert "subprocess.run" in text
    assert "torch.empty" in text
    assert "tensor.fill_(1.0)" in text
    assert "tensor.untyped_storage().nbytes()" in text
    assert "process.memory_info().rss" in text
    assert "statistics.median" in text
