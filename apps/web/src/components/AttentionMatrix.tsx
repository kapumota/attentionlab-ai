import type { AttentionResult, LearningMode, MatrixCellSelection, SimulationConfig } from "../types";
import { getLabels } from "../data/labels";
import { clamp } from "../core/math";

interface Props {
  result: AttentionResult;
  config: SimulationConfig;
  focusedRow: number;
  selectedCell: MatrixCellSelection;
  learningMode: LearningMode;
  title: string;
  onFocusRow: (row: number) => void;
  onSelectCell: (cell: MatrixCellSelection) => void;
}

function colorByValue(value: number): string {
  const v = clamp(value, 0, 1);
  const r = Math.round(32 + v * 220);
  const g = Math.round(80 + v * 65);
  const b = Math.round(140 + (1 - v) * 80);
  return `rgb(${r}, ${g}, ${b})`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function getModeHint(mode: SimulationConfig["mode"]): string {
  const hints: Record<SimulationConfig["mode"], string> = {
    infonce: "En InfoNCE, la fila representa un ancla y las columnas representan candidatos positivos o negativos.",
    completa: "En self-attention completa, cada token puede mirar a cualquier otro token de la secuencia.",
    causal: "En atención causal, las columnas futuras se bloquean para evitar fuga de información.",
    ventana: "En Sliding Window, cada fila solo conserva una vecindad local alrededor del token.",
    sparse: "En Top-k, cada fila conserva solo sus conexiones más fuertes.",
    gqa: "En GQA, la distribución se interpreta con query heads y KV heads compartidos.",
    cross: "En cross-attention, filas y columnas pueden representar elementos de modalidades distintas.",
    agente: "En atención de agente, la fila muestra qué piezas del contexto pesan más en la decisión."
  };
  return hints[mode];
}

export function AttentionMatrix({
  result,
  config,
  focusedRow,
  selectedCell,
  learningMode,
  title,
  onFocusRow,
  onSelectCell
}: Props) {
  const labels = getLabels(config.mode, config.tokens);
  const useScores = config.mode === "infonce";
  const matrix = useScores ? result.scaledScores : result.probabilities;
  const safeFocusedRow = Math.min(focusedRow, config.tokens - 1);
  const safeSelectedRow = Math.min(selectedCell.row, config.tokens - 1);
  const safeSelectedCol = Math.min(selectedCell.col, config.tokens - 1);
  const selectedProbability = result.probabilities[safeSelectedRow]?.[safeSelectedCol] ?? 0;
  const selectedAllowed = result.mask[safeSelectedRow]?.[safeSelectedCol] ?? false;
  const topConnections = result.probabilities[safeFocusedRow]
    .map((value, col) => ({ col, value, allowed: result.mask[safeFocusedRow][col] }))
    .filter((item) => item.allowed)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const showTechnical = learningMode === "technical" || learningMode === "expert";
  const showExpert = learningMode === "expert";

  return (
    <section className="panel attention-panel">
      <div className="matrix-title-row">
        <div>
          <h2>{title}</h2>
          <p className="matrix-subtitle">
            Fila = token que pregunta. Columna = token atendido. Haz clic en una celda para interpretar la relación. La demo visual está limitada a 12 tokens para mantener buena respuesta interactiva.
          </p>
        </div>
        <span className="mode-badge">{learningMode === "basic" ? "Básico" : learningMode === "technical" ? "Técnico" : "Experto"}</span>
      </div>

      <div className="matrix-learning-layout">
        <div className="matriz-contenedor">
          <div className="matriz-cabeceras" style={{ gridTemplateColumns: `96px repeat(${config.tokens}, minmax(48px, 1fr))` }}>
            <div className="matrix-corner">Fila / Col.</div>
            {labels.map((label, col) => (
              <div className="matrix-header col-header" key={`header-${label}-${col}`} title={`Columna ${col + 1}: ${label}`}>
                <span>T{col + 1}</span>
                <small>{label}</small>
              </div>
            ))}

            {matrix.flatMap((row, i) => [
              <button
                type="button"
                key={`row-${i}`}
                className={i === safeFocusedRow ? "matrix-header row-header activa" : "matrix-header row-header"}
                onClick={() => onFocusRow(i)}
                title={`Seleccionar fila ${i + 1}: ${labels[i]}`}
                aria-label={`Seleccionar fila ${i + 1}: ${labels[i]}`}
              >
                <span>Token {i + 1}</span>
                <small>{labels[i]}</small>
              </button>,
              ...row.map((value, j) => {
                const allowed = result.mask[i][j];
                const probability = result.probabilities[i][j];
                const isSelected = i === safeSelectedRow && j === safeSelectedCol;
                const className = [
                  "celda",
                  i === safeFocusedRow ? "enfocada" : "",
                  isSelected ? "seleccionada" : "",
                  allowed ? "" : "bloqueada"
                ].join(" ");
                return (
                  <button
                    type="button"
                    key={`${i}-${j}`}
                    className={className}
                    onClick={() => {
                      onFocusRow(i);
                      onSelectCell({ row: i, col: j });
                    }}
                    title={`Token ${i + 1} (${labels[i]}) atiende a Token ${j + 1} (${labels[j]})\nProbabilidad: ${formatPercent(probability)}`}
                    aria-label={`Token ${i + 1} atiende a Token ${j + 1} con probabilidad ${formatPercent(probability)}${allowed ? "" : "; relación bloqueada"}`}
                    style={allowed ? { background: colorByValue(useScores ? probability : value) } : undefined}
                  >
                    {allowed ? (useScores ? value.toFixed(1) : value.toFixed(2)) : "×"}
                  </button>
                );
              })
            ])}
          </div>
        </div>

        <aside className="matrix-inspector" aria-live="polite" role="status">
          <div>
            <p className="eyebrow">Interpretación de matriz</p>
            <h3>Fila seleccionada: Token {safeFocusedRow + 1}</h3>
            <p>{getModeHint(config.mode)}</p>
          </div>

          <div className="selected-cell-card">
            <strong>Celda seleccionada</strong>
            <span>
              Token {safeSelectedRow + 1} atiende a Token {safeSelectedCol + 1} con probabilidad {formatPercent(selectedProbability)}.
            </span>
            <small>
              {selectedAllowed
                ? "Interpretación: el modelo considera que esa columna aporta información para la fila seleccionada."
                : "Interpretación: esta relación está bloqueada por la máscara del experimento."}
            </small>
          </div>

          <div>
            <strong>Top conexiones de la fila</strong>
            <ol className="top-connections">
              {topConnections.map((item) => (
                <li key={item.col}>
                  <span>Token {item.col + 1}: {labels[item.col]}</span>
                  <strong>{formatPercent(item.value)}</strong>
                </li>
              ))}
            </ol>
          </div>

          {showTechnical && (
            <div className="technical-note">
              <strong>Lectura técnica</strong>
              <span>
                La matriz se normaliza por fila. Cada fila produce una distribución de probabilidad mediante softmax después de aplicar temperatura y máscara.
              </span>
            </div>
          )}

          {showExpert && (
            <pre className="mini-json">{JSON.stringify({
              endpoint: "/api/attention/compute",
              focusedRow: safeFocusedRow,
              selectedCell: { row: safeSelectedRow, col: safeSelectedCol },
              probability: Number(selectedProbability.toFixed(4)),
              allowed: selectedAllowed,
              mode: config.mode
            }, null, 2)}</pre>
          )}
        </aside>
      </div>

      <div className="matrix-performance-note">
        <strong>Rendimiento visual</strong>
        <span>La matriz se mantiene hasta 12 tokens para que la interacción sea fluida. Para secuencias grandes, una siguiente edición debería usar resumen, canvas o SVG heatmap.</span>
      </div>

      <div className="leyenda">
        <span><span className="punto verde" />Par correcto / objetivo</span>
        <span><span className="punto azul" />Atención permitida</span>
        <span><span className="punto rojo" />Competidor</span>
      </div>
    </section>
  );
}
