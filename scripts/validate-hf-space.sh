#!/usr/bin/env bash
set -euo pipefail

HF_SPACE_URL="${HF_SPACE_URL:-}"

if [ -z "$HF_SPACE_URL" ]; then
  echo "Define HF_SPACE_URL con la URL directa de la app, por ejemplo:" >&2
  echo "HF_SPACE_URL=https://HF_USERNAME-attentio-ai-lab.hf.space bash scripts/validate-hf-space.sh" >&2
  exit 1
fi

HF_SPACE_URL="${HF_SPACE_URL%/}"

validar_ruta() {
  local ruta="$1"
  local url="$HF_SPACE_URL$ruta"
  echo "Validando $url"
  curl -fsS --max-time 20 "$url" >/dev/null
}

validar_ruta "/"
validar_ruta "/api/health"
validar_ruta "/docs"

echo "Hugging Face Space validado: frontend, /api/health y /docs responden."
