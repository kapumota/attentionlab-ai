#!/usr/bin/env bash
set -euo pipefail

PYTHON_BIN="${PYTHON_BIN:-python3}"

npm --prefix apps/web run check
PYTHONPATH=apps/api "$PYTHON_BIN" -m pytest apps/api/tests -q

echo "Validación local completada."