export function SpaceReadiness() {
  return (
    <section className="panel">
      <p className="eyebrow">v1.1.0-dev · Hugging Face Docker Space</p>
      <h2>Deploy cero fricción para Hugging Face Spaces</h2>
      <div className="checklist-grid">
        <div className="checklist-item"><strong>Docker</strong><span>Frontend React compilado y servido por FastAPI en el puerto 7860.</span></div>
        <div className="checklist-item"><strong>API</strong><span>Endpoints para atención, LLM, MLLM, modelos, RAG y agentes.</span></div>
        <div className="checklist-item"><strong>UI</strong><span>Laboratorio visual con módulos separados y paneles de verificación.</span></div>
        <div className="checklist-item"><strong>Escalabilidad</strong><span>Validación prevista con Docker local, URL pública del Space, /api/health y /docs.</span></div>
      </div>
    </section>
  );
}
