import type { AttentionResult, SimulationConfig } from "../types";
import { estimateRelativeCost } from "../core/attention";

interface Props {
  result: AttentionResult;
  config: SimulationConfig;
  focusedRow: number;
}

export function MetricsCards({ result, config, focusedRow }: Props) {
  const row = result.probabilities[focusedRow];
  const targetProbability = Math.max(1e-12, row[focusedRow]);
  const loss = -Math.log(targetProbability);
  const maxProbability = Math.max(...row);
  const cost = estimateRelativeCost(config);

  return (
    <div className="metricas">
      <div className="metrica">
        <div className="nombre">Loss / sorpresa</div>
        <div className="numero">{loss.toFixed(3)}</div>
      </div>
      <div className="metrica">
        <div className="nombre">Máxima prob.</div>
        <div className="numero">{(maxProbability * 100).toFixed(1)}%</div>
      </div>
      <div className="metrica">
        <div className="nombre">Costo relativo</div>
        <div className="numero">{cost.toFixed(2)}×</div>
      </div>
    </div>
  );
}
