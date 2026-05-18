// Textos explicativos del simulador.

import type { AttentionMode } from "../types";

export interface Explanation {
  matrixTitle: string;
  barsTitle: string;
  description: string;
  formula: string;
}

export function getExplanation(mode: AttentionMode, temperature: number, windowSize: number, topK: number, heads: number, kvHeads: number): Explanation {
  const text: Record<AttentionMode, Explanation> = {
    infonce: {
      matrixTitle: "Matriz de similitud escalada S / τ",
      barsTitle: "Softmax de la fila enfocada",
      description:
        `InfoNCE compara un par correcto contra varios negativos. Al bajar τ=${temperature.toFixed(2)}, ` +
        "el softmax se vuelve más agresivo: concentra probabilidad en los puntajes altos. La pérdida baja cuando el par correcto recibe probabilidad alta.",
      formula: "InfoNCE = -log( exp(s_pos / τ) / Σ_j exp(s_j / τ) )"
    },
    completa: {
      matrixTitle: "Self-attention completa",
      barsTitle: "Distribución de atención del token enfocado",
      description:
        "Cada token puede atender a todos los demás tokens. Es expresiva, pero el costo crece aproximadamente como O(n²).",
      formula: "Attention(Q,K,V) = softmax(QKᵀ / √d) V"
    },
    causal: {
      matrixTitle: "Máscara causal de LLM",
      barsTitle: "El token solo mira el pasado",
      description:
        "Un LLM autoregresivo no debe mirar tokens futuros. La máscara triangular evita fuga de información al predecir el siguiente token.",
      formula: "mask(i,j) = 1 si j ≤ i; de lo contrario, -∞ antes del softmax"
    },
    ventana: {
      matrixTitle: "Sliding Window Attention",
      barsTitle: "Atención local de la fila enfocada",
      description:
        `Cada token mira solo una ventana local de tamaño ${windowSize}. Reduce costo y memoria, pero puede perder dependencias lejanas si no se combina con capas globales.`,
      formula: "mask(i,j) = 1 si |i - j| ≤ ventana"
    },
    sparse: {
      matrixTitle: "Atención dispersa Top-k",
      barsTitle: "Solo sobreviven las claves más fuertes",
      description:
        `Cada fila conserva sus ${topK} conexiones más fuertes y bloquea el resto. Es una forma conceptual de reducir cómputo enfocándose en relaciones relevantes.`,
      formula: "mask(i,j) = 1 si j pertenece al Top-k de la fila i"
    },
    gqa: {
      matrixTitle: "GQA conceptual",
      barsTitle: "Distribución con KV compartidos",
      description:
        `Grouped-Query Attention usa ${heads} query heads pero solo ${kvHeads} KV heads. La idea es mantener varias consultas y compartir claves/valores para reducir KV cache.`,
      formula: "costo_KV ≈ KV_heads / Query_heads"
    },
    cross: {
      matrixTitle: "Cross-attention para MLLM",
      barsTitle: "Alineación entre modalidades",
      description:
        "En un MLLM, tokens de texto pueden atender a parches visuales o viceversa. Este módulo simula alineaciones imagen-texto y conecta con InfoNCE.",
      formula: "Q_texto Kᵀ_imagen -> softmax -> mezcla de V_imagen"
    },
    agente: {
      matrixTitle: "Atención sobre memoria de agente",
      barsTitle: "Qué contexto pesa más en la decisión",
      description:
        "Un agente puede decidir usando pregunta, plan, memoria, documentos recuperados, herramientas y observaciones. Esta vista simula qué elementos del contexto pesan más.",
      formula: "decisión = política(prompt, memoria, herramientas, observaciones)"
    }
  };

  return text[mode];
}
