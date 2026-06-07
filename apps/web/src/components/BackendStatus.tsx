import { useEffect, useState } from "react";
import { getApiHealth, getModelAdapterStatus, type ApiHealth, type ModelAdapterStatus } from "../core/apiClient";

export function BackendStatus() {
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [models, setModels] = useState<ModelAdapterStatus | null>(null);

  useEffect(() => {
    getApiHealth().then(setHealth).catch(() => setHealth(null));
    getModelAdapterStatus().then(setModels).catch(() => setModels(null));
  }, []);

  return (
    <section className="panel">
      <p className="eyebrow">FastAPI backend</p>
      <h2>Backend FastAPI: v1.1.0-dev</h2>
      <div className="metricas">
        <div className="metrica">
          <div className="nombre">Estado</div>
          <div className="numero">{health?.status ?? "Sin conexión"}</div>
        </div>
        <div className="metrica">
          <div className="nombre">Versión</div>
          <div className="numero">{health?.version ?? "Sin datos"}</div>
        </div>
        <div className="metrica">
          <div className="nombre">Modo</div>
          <div className="numero">{health?.mode ?? "Sin datos"}</div>
        </div>
      </div>
      <p className="mini-aviso">
        {models?.message ?? "La capa de modelos, RAG y agentes está lista para Hugging Face Docker Spaces."}
      </p>
    </section>
  );
}
