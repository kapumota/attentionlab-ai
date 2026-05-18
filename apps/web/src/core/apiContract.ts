export const plannedV03Endpoints = [
  "GET  /api/health",
  "GET  /api/models/status",
  "POST /api/attention/compute",
  "POST /api/architecture/validate",
  "POST /api/llm/estimate",
  "POST /api/mllm/contrastive-batch",
  "POST /api/agents/trace",
];

export const plannedV04Endpoints = [
  "POST /api/models/generate",
  "POST /api/models/embeddings",
  "POST /api/models/attention-trace",
  "POST /api/experiments/save",
  "GET  /api/experiments/{id}",
];
