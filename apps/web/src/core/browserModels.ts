// Adaptador v1.1.0-dev para modelos pequeños reales en navegador.
// Usa import dinámico desde CDN para mantener el build ligero y compatible con Docker Space.
// Transformers.js ejecuta modelos ONNX en el navegador mediante ONNX Runtime Web.

export interface BrowserEmbeddingResult {
  adapter: "browser-transformers-js";
  modelId: string;
  dimensions: number;
  embeddings: number[][];
  latencyMs: number;
  notes: string[];
}

export interface BrowserContrastiveResult extends BrowserEmbeddingResult {
  anchor: string;
  candidates: string[];
  similarities: number[];
  probabilities: number[];
  bestIndex: number;
  temperature: number;
}

type TransformersJsModule = {
  pipeline: (task: string, model: string, options?: Record<string, unknown>) => Promise<unknown>;
  env?: {
    allowRemoteModels?: boolean;
    allowLocalModels?: boolean;
    backends?: Record<string, unknown>;
  };
};

type TensorLike = {
  data: Float32Array | number[];
  dims: number[];
  tolist?: () => number[][] | number[];
};

const DEFAULT_CDN = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3";
let cachedExtractor: unknown = null;
let cachedModelId = "";

async function loadTransformersJs(): Promise<TransformersJsModule> {
  const moduleUrl = import.meta.env.VITE_TRANSFORMERS_JS_CDN ?? DEFAULT_CDN;
  const mod = (await import(/* @vite-ignore */ moduleUrl)) as TransformersJsModule;
  if (mod.env) {
    mod.env.allowRemoteModels = true;
    mod.env.allowLocalModels = false;
  }
  return mod;
}

function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((acc, value) => acc + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / ((Math.sqrt(na) || 1) * (Math.sqrt(nb) || 1));
}

export function softmax(values: number[], temperature: number): number[] {
  const tau = Math.max(temperature, 1e-6);
  const scaled = values.map((value) => value / tau);
  const maxValue = Math.max(...scaled);
  const expValues = scaled.map((value) => Math.exp(value - maxValue));
  const total = expValues.reduce((acc, value) => acc + value, 0) || 1;
  return expValues.map((value) => value / total);
}

function tensorToVectors(tensor: TensorLike, itemCount: number): number[][] {
  if (typeof tensor.tolist === "function") {
    const listed = tensor.tolist();
    if (Array.isArray(listed[0])) return listed as number[][];
    return [listed as number[]];
  }

  const raw = Array.from(tensor.data);
  const dims = tensor.dims;
  if (dims.length >= 2) {
    const rows = dims[0] === itemCount ? dims[0] : itemCount;
    const cols = Math.floor(raw.length / rows);
    return Array.from({ length: rows }, (_, row) => normalize(raw.slice(row * cols, (row + 1) * cols)));
  }
  return [normalize(raw)];
}

export async function embedInBrowser(texts: string[], modelId: string): Promise<BrowserEmbeddingResult> {
  const start = performance.now();
  const transformers = await loadTransformersJs();

  if (!cachedExtractor || cachedModelId !== modelId) {
    cachedExtractor = await transformers.pipeline("feature-extraction", modelId);
    cachedModelId = modelId;
  }

  const extractor = cachedExtractor as (input: string[] | string, options?: Record<string, unknown>) => Promise<TensorLike>;
  const output = await extractor(texts, { pooling: "mean", normalize: true });
  const embeddings = tensorToVectors(output, texts.length);
  const latencyMs = performance.now() - start;

  return {
    adapter: "browser-transformers-js",
    modelId,
    dimensions: embeddings[0]?.length ?? 0,
    embeddings,
    latencyMs,
    notes: [
      "Modelo ejecutado en el navegador con Transformers.js.",
      "El runtime usa ONNX Runtime Web por debajo cuando el modelo está disponible en formato ONNX."
    ]
  };
}

export async function contrastiveInBrowser(params: {
  anchor: string;
  candidates: string[];
  modelId: string;
  temperature: number;
}): Promise<BrowserContrastiveResult> {
  const texts = [params.anchor, ...params.candidates];
  const embeddingResult = await embedInBrowser(texts, params.modelId);
  const [anchorEmbedding, ...candidateEmbeddings] = embeddingResult.embeddings;
  const similarities = candidateEmbeddings.map((embedding) => cosineSimilarity(anchorEmbedding, embedding));
  const probabilities = softmax(similarities, params.temperature);
  const bestIndex = probabilities.reduce((best, value, index) => (value > probabilities[best] ? index : best), 0);

  return {
    ...embeddingResult,
    anchor: params.anchor,
    candidates: params.candidates,
    similarities,
    probabilities,
    bestIndex,
    temperature: params.temperature
  };
}
