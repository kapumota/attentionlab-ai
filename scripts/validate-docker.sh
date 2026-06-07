#!/usr/bin/env bash
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker no está instalado o no está disponible en PATH." >&2
  exit 1
fi

IMAGE="attentio-ai-lab:v1.1.0-dev"
CONTAINER="attentio-ai-lab-v1-1-test"
BASE_URL="http://localhost:7860"

docker build -t "$IMAGE" .

docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" -p 7860:7860 "$IMAGE" >/dev/null

limpiar_contenedor() {
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
}
trap limpiar_contenedor EXIT

for _ in {1..45}; do
  if curl -fsS "$BASE_URL/api/health" >/dev/null; then
    curl -fsS "$BASE_URL/" >/dev/null
    curl -fsS "$BASE_URL/docs" >/dev/null
    echo "Docker validado: frontend, /api/health y /docs responden correctamente."
    exit 0
  fi
  sleep 1
done

echo "El contenedor no respondió en /api/health." >&2
exit 1
