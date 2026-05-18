export function V04Readiness() {
  const items = [
    ["Transformers.js", "Playground browser-first para embeddings reales."],
    ["ONNX Runtime Web", "Ruta de inferencia local en navegador vía Transformers.js."],
    ["Backend Python", "Endpoints /api/models/* con fallback determinista y adaptador opcional."],
    ["InfoNCE realista", "Comparación de textos mediante embeddings y softmax con temperatura."],
    ["v0.5 implementada", "Base para RAG visual, trazas de herramientas y persistencia."]
  ];

  return (
    <section className="panel">
      <p className="eyebrow">v0.5 implementada</p>
      <h2>Modelos pequeños reales y adaptadores</h2>
      <div className="modulos-grid">
        {items.map(([title, text]) => (
          <div className="modulo-card" key={title}>
            <strong>{title}</strong>
            <p className="mini-aviso">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
