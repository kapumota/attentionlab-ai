#!/usr/bin/env bash
set -euo pipefail

PYTHON_BIN="${PYTHON_BIN:-python}"
OUTPUT_DIR="${1:-/tmp/attentionlab-paper-repro}"

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

printf '\nA3.9 Reproducibility Capsule\n'
printf 'Repositorio: %s\n' "$ROOT_DIR"
printf 'Commit: %s\n' "$(git rev-parse HEAD)"
printf 'Python: %s\n' "$("$PYTHON_BIN" --version 2>&1)"
printf 'Directorio de salida: %s\n' "$OUTPUT_DIR"

printf '\nPreparando directorio de salida\n'
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

printf '\nRegenerando configuraciones experimentales\n'
PYTHONPATH=apps/api "$PYTHON_BIN" \
  scripts/generate-paper-kv-results.py \
  --output-dir "$OUTPUT_DIR"

printf '\nVerificando estructura del manifest\n'
"$PYTHON_BIN" - "$OUTPUT_DIR/manifest.json" <<'PY'
from __future__ import annotations

import json
import sys
from pathlib import Path

manifest_path = Path(sys.argv[1])
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

expected_groups = {
    "context_sweep": 36,
    "sensitivity_128k": 15,
    "precision_128k": 20,
}

actual_groups = manifest.get("groups")
if actual_groups != expected_groups:
    raise SystemExit(
        f"Grupos inesperados: esperado={expected_groups}, obtenido={actual_groups}"
    )

total = manifest.get("paper_configuration_count")
if total != 71:
    raise SystemExit(
        f"Número de configuraciones inesperado: esperado=71, obtenido={total}"
    )

print("Configuraciones: 71")
print("context_sweep: 36")
print("sensitivity_128k: 15")
print("precision_128k: 20")
print("Manifest: estructura válida")
PY

printf '\nArtefactos generados\n'
find "$OUTPUT_DIR" -maxdepth 1 -type f -printf '%f\n' | sort

printf '\nSHA-256 regenerados\n'
sha256sum \
  "$OUTPUT_DIR/context_sweep.csv" \
  "$OUTPUT_DIR/sensitivity_128k.csv" \
  "$OUTPUT_DIR/precision_128k.csv" \
  "$OUTPUT_DIR/manifest.json"

printf '\nA3.9 reproducción finalizada correctamente\n'
