from __future__ import annotations

import csv
import json
import os
import subprocess
import sys
from pathlib import Path

import pytest


REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "generate-paper-kv-results.py"
REFERENCE_DIR = REPO_ROOT / "data" / "paper-kv-results"
OUTPUT_FILES = [
    "context_sweep.csv",
    "sensitivity_128k.csv",
    "precision_128k.csv",
    "manifest.json",
]


def _run_generator(output_dir: Path) -> None:
    env = os.environ.copy()
    env["PYTHONPATH"] = str(REPO_ROOT / "apps" / "api")
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    subprocess.run(
        [sys.executable, str(SCRIPT), "--output-dir", str(output_dir)],
        cwd=REPO_ROOT,
        env=env,
        check=True,
        capture_output=True,
        text=True,
        timeout=15,
    )


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def test_regenera_exactamente_71_configuraciones(tmp_path: Path) -> None:
    output_dir = tmp_path / "results"
    _run_generator(output_dir)

    context_rows = _read_csv(output_dir / "context_sweep.csv")
    sensitivity_rows = _read_csv(output_dir / "sensitivity_128k.csv")
    precision_rows = _read_csv(output_dir / "precision_128k.csv")
    manifest = json.loads((output_dir / "manifest.json").read_text(encoding="utf-8"))

    assert len(context_rows) == 36
    assert len(sensitivity_rows) == 15
    assert len(precision_rows) == 20
    assert len(context_rows) + len(sensitivity_rows) + len(precision_rows) == 71
    assert manifest["paper_configuration_count"] == 71
    assert manifest["groups"] == {
        "context_sweep": 36,
        "precision_128k": 20,
        "sensitivity_128k": 15,
    }


def test_resultados_regenerados_coinciden_con_referencias_versionadas(
    tmp_path: Path,
) -> None:
    output_dir = tmp_path / "results"
    _run_generator(output_dir)

    for filename in OUTPUT_FILES:
        assert (output_dir / filename).read_bytes() == (
            REFERENCE_DIR / filename
        ).read_bytes()


def test_valores_representativos_coinciden_con_el_articulo(tmp_path: Path) -> None:
    output_dir = tmp_path / "results"
    _run_generator(output_dir)

    context_rows = _read_csv(output_dir / "context_sweep.csv")
    one_million = {
        row["method"]: float(row["value_gb"])
        for row in context_rows
        if row["context"] == "1048576"
    }
    assert one_million["MHA"] == pytest.approx(549.755814, abs=1e-6)
    assert one_million["GQA-8 heads KV"] == pytest.approx(137.438953, abs=1e-6)
    assert one_million["Latente r=512"] == pytest.approx(68.719477, abs=1e-6)

    sensitivity_rows = _read_csv(output_dir / "sensitivity_128k.csv")
    swa_8192 = next(
        row
        for row in sensitivity_rows
        if row["family"] == "SWA" and row["value"] == "8192"
    )
    assert float(swa_8192["memory_gb"]) == pytest.approx(4.294967, abs=1e-6)
    assert float(swa_8192["ratio_to_mha"]) == pytest.approx(0.0625, abs=1e-12)


def test_generacion_es_determinista_byte_a_byte(tmp_path: Path) -> None:
    first = tmp_path / "first"
    second = tmp_path / "second"
    _run_generator(first)
    _run_generator(second)

    for filename in OUTPUT_FILES:
        assert (first / filename).read_bytes() == (second / filename).read_bytes()
