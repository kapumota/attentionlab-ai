# Attentio AI Lab v1.1.0-dev - Hugging Face Docker Space
# Etapa 1: compila el frontend React/Vite.
FROM node:20-bookworm-slim AS web-build

WORKDIR /build
COPY apps/web/package*.json ./
RUN npm ci
COPY apps/web/ ./
RUN npm run build

# Etapa 2: sirve API FastAPI + frontend estático en un solo puerto.
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    ATTENTIONLAB_STATIC_DIR=/app/static \
    ATTENTIONLAB_ENABLE_MODEL_ADAPTERS=true \
    ATTENTIONLAB_ENABLE_REAL_MODELS=false \
    ATTENTIONLAB_TEXT_MODEL_ID=distilbert-base-uncased \
    ATTENTIONLAB_EMBEDDING_MODEL_ID=sentence-transformers/all-MiniLM-L6-v2

WORKDIR /app

COPY apps/api/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

COPY apps/api /app/apps/api
COPY --from=web-build /build/dist /app/static

ENV PYTHONPATH=/app/apps/api
EXPOSE 7860

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
