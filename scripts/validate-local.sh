#!/usr/bin/env bash
set -euo pipefail

PYTHON_BIN="${PYTHON_BIN:-python3}"

echo "Validando backend de Attentio AI Lab..."
PYTHONPATH=apps/api "$PYTHON_BIN" -m pytest apps/api/tests -q

echo "Validando frontend de Attentio AI Lab..."
npm --prefix apps/web run check

echo "Validación local completada."
