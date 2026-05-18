#!/usr/bin/env bash
set -euo pipefail

npm --prefix apps/web run check
PYTHONPATH=apps/api python -m pytest apps/api/tests -q

echo "Validación local completada."
