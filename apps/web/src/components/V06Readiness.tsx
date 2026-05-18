export function V06Readiness() {
  return (
    <section className="panel">
      <p className="eyebrow">v0.6-ready</p>
      <h2>Preparación para una edición de investigación</h2>
      <div className="checklist-grid">
        <div className="checklist-item"><strong>Persistencia real</strong><span>Migrar experimentos y documentos a SQLite/Postgres o un vector store externo.</span></div>
        <div className="checklist-item"><strong>Embeddings reales por colección</strong><span>Conectar sentence-transformers, ONNX Runtime o Transformers.js según entorno.</span></div>
        <div className="checklist-item"><strong>Evaluadores</strong><span>Añadir métricas de groundedness, faithfulness, recuperación y cobertura de citas.</span></div>
        <div className="checklist-item"><strong>Multiagente</strong><span>Comparar planner, retriever, critic y tool executor como nodos separados.</span></div>
      </div>
    </section>
  );
}
