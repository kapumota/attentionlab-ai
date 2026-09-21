#!/usr/bin/env python3
"""Verifica independientemente la reproducción de los artefactos del artículo.

Este módulo no importa el generador experimental ni los servicios del backend.
Valida estructura, conteos, hashes, manifest y equivalencia byte a byte contra
los artefactos canónicos congelados.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sys
from pathlib import Path
from typing import Any


EXPECTED_FILES = {
    "context_sweep.csv",
    "sensitivity_128k.csv",
    "precision_128k.csv",
    "manifest.json",
}

EXPECTED_SCHEMAS = {
    "context_sweep.csv": [
        "experiment",
        "context",
        "method",
        "value_gb",
    ],
    "sensitivity_128k.csv": [
        "family",
        "parameter",
        "value",
        "memory_gb",
        "ratio_to_mha",
    ],
    "precision_128k.csv": [
        "precision",
        "method",
        "memory_gb",
    ],
}

EXPECTED_ROWS = {
    "context_sweep.csv": 36,
    "sensitivity_128k.csv": 15,
    "precision_128k.csv": 20,
}

EXPECTED_GROUPS = {
    "context_sweep": 36,
    "sensitivity_128k": 15,
    "precision_128k": 20,
}

EXPECTED_ASSUMPTIONS = {
    "base_precision": "fp16",
    "batch_size": 1,
    "dimension": 4096,
    "num_layers": 32,
    "query_heads": 32,
    "units": "GB decimales",
}

PINNED_SHA256 = {
    "context_sweep.csv":
        "9291bd2a700fa620f953107306f2490d1ad6b9b05fd1512511f57e481460b4fc",
    "sensitivity_128k.csv":
        "bb8e0210471f6bdd881060e032dda937a44ffd931241455b0081c346a248d650",
    "precision_128k.csv":
        "59dfd88b1dfe6a30e7fd10edea9698505ba2e9915c2d9aca9e735276526e8c71",
    "manifest.json":
        "947a4e644526869d4a7a8dc9742dd3607ba352190bc584c17f73573d0b67e5e1",
}


class VerificationError(RuntimeError):
    """Representa una violación de reproducibilidad."""


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify_directory_shape(directory: Path) -> None:
    if not directory.is_dir():
        raise VerificationError(
            f"el directorio no existe: {directory}"
        )

    entries = list(directory.iterdir())

    non_files = sorted(entry.name for entry in entries if not entry.is_file())
    if non_files:
        raise VerificationError(
            f"se encontraron entradas que no son archivos: {non_files}"
        )

    actual_files = {entry.name for entry in entries}

    missing = sorted(EXPECTED_FILES - actual_files)
    extra = sorted(actual_files - EXPECTED_FILES)

    if missing:
        raise VerificationError(
            f"faltan archivos requeridos: {missing}"
        )

    if extra:
        raise VerificationError(
            f"hay archivos inesperados: {extra}"
        )


def verify_csv(path: Path, expected_header: list[str], expected_rows: int) -> None:
    with path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.reader(handle)

        try:
            header = next(reader)
        except StopIteration as exc:
            raise VerificationError(
                f"{path.name}: CSV vacío"
            ) from exc

        if header != expected_header:
            raise VerificationError(
                f"{path.name}: cabecera inesperada: {header}"
            )

        rows = list(reader)

    if len(rows) != expected_rows:
        raise VerificationError(
            f"{path.name}: filas esperadas={expected_rows}, "
            f"filas obtenidas={len(rows)}"
        )

    if any(len(row) != len(expected_header) for row in rows):
        raise VerificationError(
            f"{path.name}: existe al menos una fila con número de columnas inválido"
        )


def load_manifest(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise VerificationError(
            f"manifest inválido: {exc}"
        ) from exc


def verify_manifest(directory: Path) -> None:
    manifest = load_manifest(directory / "manifest.json")

    if manifest.get("schema_version") != 1:
        raise VerificationError(
            "schema_version del manifest debe ser 1"
        )

    if manifest.get("paper_configuration_count") != 71:
        raise VerificationError(
            "paper_configuration_count debe ser 71"
        )

    if manifest.get("groups") != EXPECTED_GROUPS:
        raise VerificationError(
            f"groups inesperado: {manifest.get('groups')}"
        )

    if manifest.get("assumptions") != EXPECTED_ASSUMPTIONS:
        raise VerificationError(
            f"assumptions inesperado: {manifest.get('assumptions')}"
        )

    files = manifest.get("files")
    if not isinstance(files, dict):
        raise VerificationError(
            "files del manifest no es un objeto"
        )

    expected_manifest_files = set(EXPECTED_ROWS)
    if set(files) != expected_manifest_files:
        raise VerificationError(
            f"files del manifest inesperado: {sorted(files)}"
        )

    for filename, expected_rows in EXPECTED_ROWS.items():
        metadata = files.get(filename)

        if not isinstance(metadata, dict):
            raise VerificationError(
                f"{filename}: metadata ausente o inválida"
            )

        if metadata.get("rows") != expected_rows:
            raise VerificationError(
                f"{filename}: rows del manifest no coincide"
            )

        actual_hash = sha256_file(directory / filename)

        if metadata.get("sha256") != actual_hash:
            raise VerificationError(
                f"{filename}: SHA-256 del manifest no coincide con el archivo"
            )


def verify_pinned_hashes(directory: Path) -> None:
    for filename, expected_hash in PINNED_SHA256.items():
        actual_hash = sha256_file(directory / filename)

        if actual_hash != expected_hash:
            raise VerificationError(
                f"{filename}: SHA-256 congelado no coincide\n"
                f"esperado={expected_hash}\n"
                f"obtenido={actual_hash}"
            )


def verify_artifacts(directory: Path) -> None:
    verify_directory_shape(directory)

    for filename, expected_header in EXPECTED_SCHEMAS.items():
        verify_csv(
            directory / filename,
            expected_header,
            EXPECTED_ROWS[filename],
        )

    verify_manifest(directory)
    verify_pinned_hashes(directory)


def verify_byte_identity(candidate: Path, canonical: Path) -> None:
    for filename in sorted(EXPECTED_FILES):
        candidate_bytes = (candidate / filename).read_bytes()
        canonical_bytes = (canonical / filename).read_bytes()

        if candidate_bytes != canonical_bytes:
            raise VerificationError(
                f"{filename}: no es idéntico byte a byte al artefacto canónico"
            )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Verifica independientemente los artefactos reproducidos."
    )
    parser.add_argument(
        "--candidate-dir",
        type=Path,
        required=True,
        help="Directorio generado por la reproducción.",
    )
    parser.add_argument(
        "--canonical-dir",
        type=Path,
        default=Path("data/paper-kv-results"),
        help="Directorio de artefactos canónicos congelados.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        print("Verificando artefactos canónicos")
        verify_artifacts(args.canonical_dir)
        print("Artefactos canónicos: PASS")

        print("Verificando artefactos reproducidos")
        verify_artifacts(args.candidate_dir)
        print("Estructura, conteos, manifest y hashes: PASS")

        print("Comparando reproducción con baseline canónico")
        verify_byte_identity(args.candidate_dir, args.canonical_dir)
        print("Equivalencia byte a byte: PASS")

    except VerificationError as exc:
        print(f"VERIFICATION FAILED: {exc}", file=sys.stderr)
        return 1

    print("A3.9 independent verification: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
