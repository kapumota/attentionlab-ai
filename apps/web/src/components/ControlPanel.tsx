import type { AttentionMode, LearningMode, SimulationConfig } from "../types";
import { modeNames } from "../data/labels";

interface Props {
  config: SimulationConfig;
  learningMode: LearningMode;
  onChange: (next: SimulationConfig) => void;
  onRegenerate: () => void;
  onMixLayers: () => void;
}

type ControlKey = "tokens" | "temperature" | "windowSize" | "topK" | "queryHeads" | "kvHeads" | "visualHead";

interface ControlGuidance {
  important: ControlKey[];
  title: string;
  what: string;
  recommended: string;
  technical: string;
}

const modes = Object.entries(modeNames) as Array<[AttentionMode, string]>;

const controlLabels: Record<ControlKey, string> = {
  tokens: "Tokens",
  temperature: "Temperatura",
  windowSize: "Ventana",
  topK: "Top-k",
  queryHeads: "Query heads",
  kvHeads: "KV heads",
  visualHead: "Head de atención"
};

function getControlGuidance(mode: AttentionMode): ControlGuidance {
  const guidance: Record<AttentionMode, ControlGuidance> = {
    infonce: {
      important: ["temperature", "tokens"],
      title: "Control importante: Temperatura",
      what: "Define qué tan concentrada o suave queda la distribución de probabilidades después del softmax.",
      recommended: "Cambia la temperatura de 0.20 a 1.00 y observa cómo las barras se distribuyen.",
      technical: "En InfoNCE, τ escala los logits antes de softmax: softmax(similitud / τ)."
    },
    completa: {
      important: ["tokens", "temperature"],
      title: "Control importante: Tokens",
      what: "Aumentar tokens aumenta el tamaño de la matriz y las relaciones token-token disponibles.",
      recommended: "Sube de 6 a 12 tokens para ver cómo crece la atención completa.",
      technical: "Self-attention completa aproxima O(n²) relaciones porque cada token puede atender a todos los demás."
    },
    causal: {
      important: ["tokens", "temperature"],
      title: "Control importante: Tokens",
      what: "Permite ver cómo la máscara causal bloquea posiciones futuras mientras la secuencia crece.",
      recommended: "Usa 10 o 12 tokens y verifica que la zona superior derecha permanezca bloqueada.",
      technical: "La causal mask impone que la posición i solo pueda atender columnas j ≤ i."
    },
    ventana: {
      important: ["windowSize", "tokens"],
      title: "Control importante: Ventana",
      what: "Define cuántos vecinos puede mirar cada token dentro de una atención local.",
      recommended: "Cambia la ventana de 1 a 5 para comparar costo bajo contra más contexto local.",
      technical: "Sliding Window reduce conexiones activas al restringir la atención a una banda local de la matriz."
    },
    sparse: {
      important: ["topK", "tokens"],
      title: "Control importante: Top-k",
      what: "Conserva solo las conexiones más fuertes de cada fila y bloquea las demás.",
      recommended: "Compara Top-k = 1 con Top-k = 6 para ver cómo cambia la dispersión.",
      technical: "Top-k sparsity aplica una selección por fila antes o después de la máscara para reducir conexiones activas."
    },
    gqa: {
      important: ["queryHeads", "kvHeads", "visualHead"],
      title: "Control importante: KV heads",
      what: "Reduce cuántas cabezas de key/value se guardan y comparten entre query heads.",
      recommended: "Compara Query heads = 8 con KV heads = 2 y luego revisa el estimador LLM.",
      technical: "GQA mantiene varias query heads, pero usa menos KV heads; eso reduce memoria de KV cache."
    },
    cross: {
      important: ["temperature", "tokens"],
      title: "Control importante: Temperatura",
      what: "Ayuda a visualizar alineación entre elementos de modalidades distintas, como imagen y texto.",
      recommended: "Baja la temperatura para concentrar la alineación en el par más fuerte.",
      technical: "Cross-attention relaciona queries de una fuente con keys/values de otra fuente o modalidad."
    },
    agente: {
      important: ["topK", "tokens"],
      title: "Control importante: Top-k",
      what: "Simula cuántas piezas de contexto pesan más en una decisión del agente.",
      recommended: "Usa Top-k = 3 y luego abre RAG + Agent Debugger para ver evidencia recuperada.",
      technical: "El patrón aproxima selección de memoria/contexto antes de construir una respuesta trazable."
    }
  };

  return guidance[mode];
}

export function ControlPanel({ config, learningMode, onChange, onRegenerate, onMixLayers }: Props) {
  const guidance = getControlGuidance(config.mode);
  const importantSet = new Set(guidance.important);

  function update<K extends keyof SimulationConfig>(key: K, value: SimulationConfig[K]) {
    const next = { ...config, [key]: value };
    if (key === "queryHeads" && next.kvHeads > Number(value)) next.kvHeads = Number(value);
    if (key === "queryHeads" && next.visualHead > Number(value)) next.visualHead = Number(value);
    onChange(next);
  }

  function controlClass(key: ControlKey) {
    return importantSet.has(key) ? "control-block importante" : "control-block";
  }

  return (
    <aside className="panel controles" aria-label="Controles del laboratorio de atención">
      <section>
        <h2>1. Módulo</h2>
        <label htmlFor="modo">Selecciona el tipo de atención o experimento</label>
        <select
          id="modo"
          value={config.mode}
          onChange={(event) => update("mode", event.target.value as AttentionMode)}
          aria-describedby="modo-help"
        >
          {modes.map(([value, label]) => (
            <option value={value} key={value}>{label}</option>
          ))}
        </select>
        <p id="modo-help" className="sr-helper">Cambia el patrón de atención mostrado en la matriz y actualiza la ayuda contextual.</p>
      </section>

      <section className="control-guidance" aria-live="polite" role="status">
        <p className="eyebrow">Ayuda contextual</p>
        <h3>{guidance.title}</h3>
        <p>{guidance.what}</p>
        <div className="recommended-action">
          <strong>Prueba recomendada</strong>
          <span>{guidance.recommended}</span>
        </div>
        {(learningMode === "technical" || learningMode === "expert") && (
          <div className="technical-note compact-note">
            <strong>Lectura técnica</strong>
            <span>{guidance.technical}</span>
          </div>
        )}
        <div className="important-tags" aria-label="Controles relevantes para el modo actual">
          {guidance.important.map((key) => (
            <span key={key}>{controlLabels[key]}</span>
          ))}
        </div>
      </section>

      <section>
        <h2>2. Hiperparámetros</h2>

        <div className={controlClass("tokens")}>
          <label htmlFor="control-tokens">Tokens / elementos: <span className="valor-control">{config.tokens}</span></label>
          <input
            id="control-tokens"
            type="range"
            min="4"
            max="12"
            step="1"
            value={config.tokens}
            onChange={(e) => update("tokens", Number(e.target.value))}
            aria-describedby="control-tokens-help"
            aria-valuetext={`${config.tokens} tokens, máximo visual recomendado 12`}
          />
          <small id="control-tokens-help">Afecta el tamaño de la matriz. La demo visual limita la matriz a 12 tokens para mantener buena respuesta interactiva.</small>
        </div>

        <div className={controlClass("temperature")}>
          <label htmlFor="control-temperature">Temperatura τ: <span className="valor-control">{config.temperature.toFixed(2)}</span></label>
          <input
            id="control-temperature"
            type="range"
            min="0.05"
            max="1.2"
            step="0.01"
            value={config.temperature}
            onChange={(e) => update("temperature", Number(e.target.value))}
            aria-describedby="control-temperature-help"
            aria-valuetext={`Temperatura ${config.temperature.toFixed(2)}`}
          />
          <small id="control-temperature-help">Baja = distribución concentrada. Alta = distribución más suave.</small>
        </div>

        <div className="fila-doble">
          <div className={controlClass("windowSize")}>
            <label htmlFor="control-window">Ventana: <span className="valor-control">{config.windowSize}</span></label>
            <input
              id="control-window"
              type="range"
              min="1"
              max="5"
              step="1"
              value={config.windowSize}
              onChange={(e) => update("windowSize", Number(e.target.value))}
              aria-describedby="control-window-help"
              aria-valuetext={`Ventana ${config.windowSize}`}
            />
            <small id="control-window-help">Controla el ancho local de atención.</small>
          </div>
          <div className={controlClass("topK")}>
            <label htmlFor="control-topk">Top-k: <span className="valor-control">{config.topK}</span></label>
            <input
              id="control-topk"
              type="range"
              min="1"
              max="6"
              step="1"
              value={config.topK}
              onChange={(e) => update("topK", Number(e.target.value))}
              aria-describedby="control-topk-help"
              aria-valuetext={`Top k ${config.topK}`}
            />
            <small id="control-topk-help">Conserva las conexiones más fuertes.</small>
          </div>
        </div>

        <div className="fila-doble">
          <div className={controlClass("queryHeads")}>
            <label htmlFor="control-query-heads">Query heads: <span className="valor-control">{config.queryHeads}</span></label>
            <input
              id="control-query-heads"
              type="range"
              min="2"
              max="16"
              step="2"
              value={config.queryHeads}
              onChange={(e) => update("queryHeads", Number(e.target.value))}
              aria-describedby="control-query-heads-help"
              aria-valuetext={`${config.queryHeads} query heads`}
            />
            <small id="control-query-heads-help">Cabezas que generan consultas.</small>
          </div>
          <div className={controlClass("kvHeads")}>
            <label htmlFor="control-kv-heads">KV heads: <span className="valor-control">{config.kvHeads}</span></label>
            <input
              id="control-kv-heads"
              type="range"
              min="1"
              max={config.queryHeads}
              step="1"
              value={config.kvHeads}
              onChange={(e) => update("kvHeads", Number(e.target.value))}
              aria-describedby="control-kv-heads-help"
              aria-valuetext={`${config.kvHeads} KV heads de ${config.queryHeads} query heads`}
            />
            <small id="control-kv-heads-help">Menos KV heads suele reducir KV cache.</small>
          </div>
        </div>

        <div className={controlClass("visualHead")}>
          <label htmlFor="control-visual-head">Head de atención visualizado: <span className="valor-control">{config.visualHead}</span></label>
          <input
            id="control-visual-head"
            type="range"
            min="1"
            max={config.queryHeads}
            step="1"
            value={config.visualHead}
            onChange={(e) => update("visualHead", Number(e.target.value))}
            aria-describedby="control-visual-head-help"
            aria-valuetext={`Head de atención visualizado ${config.visualHead}`}
          />
          <small id="control-visual-head-help">Permite inspeccionar una head conceptual.</small>
        </div>
      </section>

      <section className="botonera" aria-label="Acciones del laboratorio">
        <button type="button" onClick={onRegenerate}>Regenerar datos</button>
        <button type="button" className="secundario" onClick={onMixLayers}>Mezclar capas</button>
      </section>

      <p className="mini-aviso">
        Nota: este prototipo simula patrones de atención. No entrena un LLM real; sirve como laboratorio visual para entender costos, máscaras y distribuciones.
      </p>
    </aside>
  );
}
