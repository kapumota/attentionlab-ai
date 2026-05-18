export function V05Readiness() {
  return (
    <section className="panel">
      <p className="eyebrow">v1.0 estable</p>
      <h2>Agent Debugger + RAG visual activos</h2>
      <div className="checklist-grid">
        <div className="checklist-item"><strong>RAG visual</strong><span>Indexación, recuperación top-k, scores semánticos/léxicos y citas visuales.</span></div>
        <div className="checklist-item"><strong>Tool tracing</strong><span>Registro de llamadas, entradas, salidas, latencia y estado por herramienta.</span></div>
        <div className="checklist-item"><strong>Groundedness</strong><span>Reporte didáctico de evidencia citada y advertencias de cobertura.</span></div>
        <div className="checklist-item"><strong>Experimentos</strong><span>Contrato para guardar trazas y migrar a persistencia real en una edición posterior.</span></div>
      </div>
    </section>
  );
}
