export function V10Readiness() {
  const items = [
    ["Demo pública", "Preparada para Hugging Face Docker Spaces con sdk: docker y app_port: 7860."],
    ["README profesional", "Incluye propósito, módulos, instalación, endpoints, Docker, tutoriales y licencia."],
    ["Capturas/GIFs", "Capturas reales generadas desde la app y un GIF demo en screenshots/."],
    ["Pruebas", "Suite FastAPI, TypeScript build y scripts de validación local."],
    ["Ejemplos", "Cargas JSON reproducibles para atención, LLM, MLLM, RAG y Agent Debugger."]
  ];

  return (
    <section className="panel release-checklist-panel">
      <p className="eyebrow">v1.1.0-dev - Release técnica</p>
      <h2>Checklist de publicación</h2>
      <p className="mini-aviso">
        Esta información queda disponible en la pestaña Release, pero aparece colapsada para no interrumpir la demo educativa principal.
      </p>

      <details className="release-accordion">
        <summary>
          <span>Ver checklist de publicación</span>
          <small>Demo pública, README, screenshots, tests y ejemplos reproducibles.</small>
        </summary>
        <div className="capas release-checklist-grid">
          {items.map(([title, body]) => (
            <div className="capa" key={title}>
              <strong>{title}</strong>
              <span>{body}</span>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
