// Etiquetas en español para las visualizaciones.

import type { AttentionMode } from "../types";

export const tokenLabels = [
  "<BOS>",
  "El",
  "modelo",
  "atiende",
  "al",
  "contexto",
  "relevante",
  "antes",
  "de",
  "responder",
  "con",
  "tools"
];

export const agentLabels = [
  "Pregunta",
  "Plan",
  "Memoria",
  "Doc A",
  "Doc B",
  "Tool",
  "Obs.",
  "RAG",
  "Regla",
  "Salida",
  "Eval",
  "Fin"
];

export const visionLabels = [
  "Img-1",
  "Img-2",
  "Img-3",
  "Img-4",
  "Txt-1",
  "Txt-2",
  "Txt-3",
  "Txt-4",
  "Patch",
  "Token",
  "Objeto",
  "Región"
];

export function getLabels(mode: AttentionMode, n: number): string[] {
  if (mode === "agente") return agentLabels.slice(0, n);
  if (mode === "cross" || mode === "infonce") return visionLabels.slice(0, n);
  return tokenLabels.slice(0, n);
}

export const modeNames: Record<AttentionMode, string> = {
  infonce: "InfoNCE imagen-texto",
  completa: "Self-attention completa",
  causal: "Atención causal de LLM",
  ventana: "Sliding Window Attention",
  sparse: "Atención dispersa Top-k",
  gqa: "GQA conceptual",
  cross: "Cross-attention para MLLM",
  agente: "Atención sobre memoria de agente"
};
