// Utilidades del constructor de arquitecturas.
// La salida JSON está pensada para documentar experimentos o alimentar un backend futuro.

import type { ArchitectureBlock, ArchitectureSpec, BuilderConfig, SimulationConfig } from "../types";

export function createInitialArchitecture(config: SimulationConfig, builder: BuilderConfig): ArchitectureSpec {
  return {
    layers: [
      { type: "gqa" },
      { type: "swa_gqa", window: 1024 },
      { type: "swa_gqa", window: 1024 },
      { type: "gated_full_attention" }
    ],
    repeat: builder.repeat,
    dimension: builder.dimension,
    num_layers: builder.numLayers,
    heads: config.queryHeads,
    kv_heads: config.kvHeads,
    rope: builder.rope,
    gating: builder.gating,
    mla_compression_rank: builder.mlaRank,
    sparse_top_k: config.topK
  };
}

export function syncArchitecture(
  architecture: ArchitectureSpec,
  config: SimulationConfig,
  builder: BuilderConfig
): ArchitectureSpec {
  return {
    ...architecture,
    repeat: builder.repeat,
    dimension: builder.dimension,
    num_layers: builder.numLayers,
    heads: config.queryHeads,
    kv_heads: config.kvHeads,
    rope: builder.rope,
    gating: builder.gating,
    mla_compression_rank: builder.mlaRank,
    sparse_top_k: config.topK
  };
}

export function createBlockFromBuilder(builder: BuilderConfig, topK: number): ArchitectureBlock {
  const block: ArchitectureBlock = { type: builder.blockType };

  if (builder.blockType.includes("swa")) block.window = builder.windowSize;
  if (builder.blockType === "mla") block.compression_rank = builder.mlaRank;
  if (builder.blockType === "sparse_topk") block.top_k = topK;
  if (builder.gating || builder.blockType.includes("gated")) block.gating = true;
  if (builder.rope) block.position_encoding = "RoPE";

  return block;
}

export function getHybridLayers(mode: string): Array<[string, string]> {
  const library: Record<string, Array<[string, string]>> = {
    infonce: [
      ["Encoder imagen", "Convierte imagen en embedding visual."],
      ["Encoder texto", "Convierte texto en embedding semántico."],
      ["Similitud", "Calcula pares positivos y negativos."],
      ["InfoNCE", "Empuja juntos los pares correctos."]
    ],
    completa: [
      ["Embeddings", "Tokens + posición."],
      ["MHA", "Varios heads de atención completa."],
      ["MLP", "Transformación no lineal."],
      ["Norm", "Estabiliza el bloque."]
    ],
    causal: [
      ["Tokens", "Secuencia de entrada."],
      ["RoPE", "Posición relativa rotatoria."],
      ["Causal GQA", "Atiende solo al pasado."],
      ["Decoder", "Predice el siguiente token."]
    ],
    ventana: [
      ["Local block", "Ventana para vecinos."],
      ["Local block", "Reduce costo O(n²)."],
      ["Global block", "Recupera contexto lejano."],
      ["MLP", "Mezcla características."]
    ],
    sparse: [
      ["Router", "Selecciona conexiones candidatas."],
      ["Top-k mask", "Conserva claves fuertes."],
      ["Sparse attn", "Atiende subconjunto relevante."],
      ["Salida", "Combina valores seleccionados."]
    ],
    gqa: [
      ["Q heads", "Varias consultas."],
      ["KV compartido", "Menos claves y valores."],
      ["KV cache", "Memoria más compacta."],
      ["Decoder", "Generación eficiente."]
    ],
    cross: [
      ["Vision encoder", "Extrae parches visuales."],
      ["Text encoder", "Genera tokens de lenguaje."],
      ["Cross-attn", "Texto consulta imagen."],
      ["Respuesta", "Integra visión y lenguaje."]
    ],
    agente: [
      ["Planner", "Divide la tarea."],
      ["Retriever", "Trae memoria o documentos."],
      ["Tool use", "Ejecuta herramientas."],
      ["Reflector", "Evalúa y corrige salida."]
    ]
  };

  return library[mode] ?? library.completa;
}
