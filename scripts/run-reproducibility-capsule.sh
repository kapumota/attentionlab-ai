#!/usr/bin/env bash
set -euo pipefail

PYTHON_BIN="${PYTHON_BIN:-python}"
OUTPUT_DIR="${1:-/tmp/attentionlab-paper-capsule}"

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

printf '\nA3.9 Reproducibility Capsule\n'
printf 'Repositorio: %s\n' "$ROOT_DIR"
printf 'Commit: %s\n' "$(git rev-parse HEAD)"
printf 'Python: %s\n' "$("$PYTHON_BIN" --version 2>&1)"
printf 'Salida: %s\n' "$OUTPUT_DIR"

printf '\nFase 1: reproducción\n'

PYTHON_BIN="$PYTHON_BIN" \
  scripts/reproduce-paper.sh "$OUTPUT_DIR"

printf '\nFase 2: verificación independiente\n'

"$PYTHON_BIN" scripts/verify-paper-reproduction.py \
  --candidate-dir "$OUTPUT_DIR" \
  --canonical-dir data/paper-kv-results

printf '\nA3.9 reproducibility capsule: PASS\n'
