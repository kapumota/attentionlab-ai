const agentItems = [
  "Prompt actual",
  "Memoria corta",
  "Memoria larga",
  "Herramientas",
  "Docs RAG",
  "Plan",
  "Acción",
  "Observación",
  "Respuesta",
  "Evaluación"
];

export function AgentsPlayground() {
  return (
    <section className="panel seccion">
      <h2>Módulo 5: Agents playground</h2>
      <div className="agente-grid">
        {agentItems.map((item) => <div className="agente-item" key={item}>{item}</div>)}
      </div>
      <p className="mini-aviso">
        Usa el modo “Atención sobre memoria de agente” para ver qué parte del contexto recibe más peso: memoria, documento, herramienta, plan u observación.
      </p>
    </section>
  );
}
