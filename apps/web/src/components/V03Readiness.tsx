import { plannedV03Endpoints } from "../core/apiContract";

const milestones = [
  ["apps/api", "Backend FastAPI implementado con endpoints de atención, arquitectura, LLM, MLLM, agentes y modelos."],
  ["Docker Space", "README con sdk: docker y Dockerfile multi-stage para React/Vite + FastAPI."],
  ["Contrato estable", "OpenAPI generado por FastAPI y cliente frontend preparado para /api/*."],
  ["v0.5 implementada", "Capa model_gateway preparada para conectar modelos reales sin rediseñar la UI."],
];

export function V03Readiness() {
  return (
    <section className="panel seccion">
      <h2>v0.5 implementada: FastAPI/Docker</h2>
      <div className="builder-grid">
        <div className="checklist-grid">
          {milestones.map(([title, description]) => (
            <div className="checklist-item" key={title}>
              <strong>{title}</strong>
              <span>{description}</span>
            </div>
          ))}
        </div>
        <pre className="salida-metricas">{plannedV03Endpoints.join("\n")}</pre>
      </div>
    </section>
  );
}
