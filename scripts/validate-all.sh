#!/usr/bin/env bash
set -euo pipefail

PYTHON_BIN="${PYTHON_BIN:-python}"

echo "Validando whitespace..."
git diff --check

echo "Validando documentación..."
if grep -RIn \
  --exclude-dir=node_modules \
  --exclude-dir=.venv \
  --exclude-dir=.atencion \
  --exclude-dir=.git \
  --exclude-dir=dist \
  --exclude-dir=__pycache__ \
  "====\|—\|–" \
  README.md docs packages/shared-contracts/openapi-notes.md; then
  echo "Se encontraron separadores o guiones no permitidos."
  exit 1
fi

echo "Validando backend..."
PYTHONPATH=apps/api "$PYTHON_BIN" -m pytest apps/api/tests -q

echo "Validando frontend..."
npm --prefix apps/web ci --include=dev
npm --prefix apps/web run check

if [[ -n "${HF_SPACE_URL:-}" ]]; then
  echo "Validando Hugging Face Space..."
  HF_SPACE_URL="$HF_SPACE_URL" bash scripts/validate-hf-space.sh
else
  echo "HF_SPACE_URL no está definido. Se omite validación pública del Space."
fi

echo "Validación completa finalizada."
