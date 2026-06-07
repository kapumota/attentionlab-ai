#!/usr/bin/env bash
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker no está instalado o no está disponible en PATH." >&2
  exit 1
fi

IMAGE="attentio-ai-lab:v1.1.0-dev"
CONTAINER="attentio-ai-lab-v1-1-test"

docker build -t "$IMAGE" .

docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" -p 7860:7860 "$IMAGE" >/dev/null

cleanup() {
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

for _ in {1..30}; do
  if curl -fsS http://localhost:7860/api/health >/dev/null; then
    echo "Docker validado: /api/health responde correctamente."
    exit 0
  fi
  sleep 1
done

echo "El contenedor no respondió en /api/health." >&2
exit 1
