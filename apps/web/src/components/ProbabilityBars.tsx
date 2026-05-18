import type { AttentionResult, SimulationConfig } from "../types";
import { getLabels } from "../data/labels";

interface Props {
  result: AttentionResult;
  config: SimulationConfig;
  focusedRow: number;
  title: string;
}

export function ProbabilityBars({ result, config, focusedRow, title }: Props) {
  const labels = getLabels(config.mode, config.tokens);
  const row = result.probabilities[focusedRow];

  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="barras">
        {row.map((probability, index) => {
          const isTarget = (config.mode === "infonce" || config.mode === "cross") && index === focusedRow;
          const isAllowed = result.mask[focusedRow][index];
          const className = ["barra", isTarget ? "objetivo" : "", !isTarget && isAllowed ? "permitida" : ""].join(" ");
          return (
            <div className="grupo-barra" key={index}>
              <div className={className} style={{ height: `${Math.max(1, probability * 100)}%` }} />
              <div className="etiqueta-barra">{labels[index]} {(probability * 100).toFixed(0)}%</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
