#!/usr/bin/env bash
set -euo pipefail

for archivo in \
  assets/gifs/kv-cache-estimator.gif \
  assets/gifs/agent-debugger.gif \
  assets/gifs/transformer-builder.gif
  do
    if [ ! -s "$archivo" ]; then
      echo "Falta el recurso visual: $archivo"
      exit 1
    fi
  done

echo "Recursos visuales validados."
