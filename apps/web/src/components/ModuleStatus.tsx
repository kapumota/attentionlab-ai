const modules = [
  {
    title: "Módulo 1",
    items: ["Matriz de similitud", "Temperatura", "Softmax", "Máscaras causal/local/top-k", "Visualización por head de atención"]
  },
  {
    title: "Módulo 2",
    items: ["Capas", "Dimensión", "Heads/KV heads", "RoPE, gating, MLA rank", "JSON exportable"]
  },
  {
    title: "Módulo 3",
    items: ["KV cache", "GQA vs MHA", "MLA vs GQA", "Long-context cost", "Memoria y tokens/s"]
  },
  {
    title: "Módulo 4",
    items: ["Vision encoder", "Text embeddings", "Cross-attention", "InfoNCE imagen-texto"]
  },
  {
    title: "Módulo 5",
    items: ["Prompt", "Memorias", "Herramientas", "Docs RAG", "Plan/acción/observación"]
  }
];

export function ModuleStatus() {
  return (
    <section className="panel seccion">
      <h2>Estado de cumplimiento de módulos</h2>
      <div className="modulos-grid">
        {modules.map((module) => (
          <div className="modulo-card" key={module.title}>
            <strong>{module.title} <span className="cumple">✓</span></strong>
            <ul>
              {module.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
