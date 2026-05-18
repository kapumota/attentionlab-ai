import { useState } from "react";

type GlossaryTarget = "attention" | "architecture" | "llm" | "rag" | "api";

interface GlossaryTerm {
  term: string;
  definition: string;
  target: GlossaryTarget;
  example: string;
}

interface Props {
  onNavigate: (target: GlossaryTarget) => void;
}

const terms: GlossaryTerm[] = [
  {
    term: "Attention",
    definition: "Mecanismo que asigna peso a partes de una secuencia para decidir qué contexto usar.",
    target: "attention",
    example: "Ver matriz de atención"
  },
  {
    term: "Softmax",
    definition: "Función que convierte scores en probabilidades que suman 1.",
    target: "attention",
    example: "Ver barras de probabilidad"
  },
  {
    term: "Causal mask",
    definition: "Máscara que impide que un token mire posiciones futuras durante generación autoregresiva.",
    target: "attention",
    example: "Abrir atención causal"
  },
  {
    term: "Top-k",
    definition: "Estrategia que conserva solo las k conexiones más relevantes y descarta el resto.",
    target: "attention",
    example: "Probar atención sparse"
  },
  {
    term: "GQA",
    definition: "Grouped Query Attention reduce memoria usando menos heads de key/value que query heads.",
    target: "llm",
    example: "Comparar MHA vs GQA"
  },
  {
    term: "KV cache",
    definition: "Memoria que guarda keys y values de tokens anteriores para acelerar inferencia en LLMs.",
    target: "llm",
    example: "Ver gráficas de KV cache"
  },
  {
    term: "RoPE",
    definition: "Rotary Positional Embeddings codifica posición de tokens de forma compatible con atención.",
    target: "architecture",
    example: "Activar RoPE"
  },
  {
    term: "MLA",
    definition: "Multi-head Latent Attention comprime representaciones para reducir memoria y costo.",
    target: "architecture",
    example: "Agregar bloque MLA"
  },
  {
    term: "RAG",
    definition: "Retrieval-Augmented Generation recupera documentos relevantes antes de responder o razonar.",
    target: "rag",
    example: "Indexar y consultar RAG"
  },
  {
    term: "Embedding",
    definition: "Representación numérica de texto, imagen u otro dato para comparar similitud.",
    target: "rag",
    example: "Ver scores semánticos"
  },
  {
    term: "Groundedness",
    definition: "Medida didáctica de cuánto una respuesta se apoya en evidencia recuperada.",
    target: "rag",
    example: "Depurar agente"
  },
  {
    term: "Tool tracing",
    definition: "Registro de herramientas usadas por un agente, con entradas, salidas, latencia y estado.",
    target: "rag",
    example: "Ver timeline del agente"
  },
  {
    term: "InfoNCE",
    definition: "Pérdida contrastiva que acerca pares correctos y aleja negativos, común en imagen-texto.",
    target: "attention",
    example: "Probar MLLM/InfoNCE"
  }
];

export function GlossaryPanel({ onNavigate }: Props) {
  const [query, setQuery] = useState("");
  const filteredTerms = terms.filter((item) => {
    const haystack = `${item.term} ${item.definition}`.toLowerCase();
    return haystack.includes(query.toLowerCase().trim());
  });

  return (
    <section className="panel glossary-panel">
      <div className="builder-heading">
        <div>
          <p className="eyebrow">Glosario técnico</p>
          <h2>Conceptos clave del dashboard</h2>
          <p className="mini-aviso">
            Busca un término y salta directamente al módulo donde se demuestra visualmente.
          </p>
        </div>
        <div className="glossary-search">
          <label htmlFor="glossary-search">Buscar término</label>
          <input
            id="glossary-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Attention, RAG, KV cache..."
          />
        </div>
      </div>

      <div className="glossary-grid">
        {filteredTerms.map((item) => (
          <article className="glossary-card" key={item.term}>
            <strong>{item.term}</strong>
            <p>{item.definition}</p>
            <button className="secundario" onClick={() => onNavigate(item.target)}>
              {item.example}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
