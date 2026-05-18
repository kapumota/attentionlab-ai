import { useMemo, useState } from "react";
import { CopyButton } from "./CopyButton";

function tokenize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function softmax(values: number[], temperature: number) {
  const safeTemperature = Math.max(0.05, temperature);
  const scaled = values.map((value) => value / safeTemperature);
  const max = Math.max(...scaled);
  const exps = scaled.map((value) => Math.exp(value - max));
  const sum = exps.reduce((acc, value) => acc + value, 0) || 1;
  return exps.map((value) => value / sum);
}

function semanticBoost(image: string, candidate: string) {
  const text = `${image} ${candidate}`.toLowerCase();
  let boost = 0;
  const conceptPairs: Array<[RegExp, RegExp, number]> = [
    [/perro|mascota|can/i, /perro|pelota|parque|jugando|mascota/i, 0.48],
    [/imagen|visual|foto/i, /imagen|foto|visual|parches/i, 0.18],
    [/atenci[oó]n|transformer|causal/i, /atenci[oó]n|causal|transformer|token/i, 0.32],
    [/ciudad|noche|autos/i, /ciudad|noche|autos|luces/i, 0.35],
    [/receta|pasta|tomate/i, /receta|pasta|tomate|cocina/i, 0.35]
  ];

  for (const [imagePattern, candidatePattern, value] of conceptPairs) {
    if (imagePattern.test(image) && candidatePattern.test(candidate)) boost += value;
  }

  return Math.min(boost, 0.75 + (text.includes("perro") && text.includes("pelota") ? 0.1 : 0));
}

function scoreCandidate(imagePrompt: string, candidate: string) {
  const imageTokens = new Set(tokenize(imagePrompt));
  const candidateTokens = tokenize(candidate);
  const overlap = candidateTokens.filter((token) => imageTokens.has(token)).length;
  const lexical = candidateTokens.length ? overlap / candidateTokens.length : 0;
  const coverage = imageTokens.size ? overlap / imageTokens.size : 0;
  return 0.12 + lexical * 0.42 + coverage * 0.28 + semanticBoost(imagePrompt, candidate);
}

export function MLLMPlayground() {
  const [imagePrompt, setImagePrompt] = useState("perro jugando con pelota");
  const [candidates, setCandidates] = useState([
    "Un perro juega con una pelota en el parque",
    "Una receta de pasta con tomate",
    "Una ciudad de noche con autos",
    "Un documento sobre atención causal"
  ]);
  const [temperature, setTemperature] = useState(0.35);
  const [hasCalculated, setHasCalculated] = useState(false);

  const scores = useMemo(
    () => candidates.map((candidate) => scoreCandidate(imagePrompt, candidate)),
    [imagePrompt, candidates]
  );
  const probabilities = useMemo(() => softmax(scores, temperature), [scores, temperature]);
  const bestIndex = probabilities.reduce((best, value, index) => (value > probabilities[best] ? index : best), 0);
  const resultPayload = JSON.stringify({
    imagePrompt,
    bestTextIndex: hasCalculated ? bestIndex + 1 : null,
    bestCandidate: hasCalculated ? candidates[bestIndex] : null,
    probabilities: hasCalculated ? probabilities.map((value) => Number(value.toFixed(4))) : [],
    temperature
  }, null, 2);
  const readmeExplanation = hasCalculated
    ? `El MLLM Playground compara una imagen simulada (${imagePrompt}) contra candidatos de texto usando una aproximación conceptual de InfoNCE. El mejor par fue Imagen 1 + Texto ${bestIndex + 1} con probabilidad ${(probabilities[bestIndex] * 100).toFixed(1)}%.`
    : "El MLLM Playground permite editar una imagen simulada y candidatos de texto para calcular una alineación imagen-texto conceptual con InfoNCE.";

  function updateCandidate(index: number, value: string) {
    setCandidates((current) => current.map((candidate, candidateIndex) => (candidateIndex === index ? value : candidate)));
    setHasCalculated(false);
  }

  return (
    <section className="panel seccion mllm-interactive">
      <div className="builder-heading">
        <div>
          <p className="eyebrow">MLLM interactivo</p>
          <h2>Módulo 4: MLLM playground</h2>
          <p className="mini-aviso">
            Edita una imagen simulada y candidatos de texto. El panel calcula una alineación conceptual imagen-texto con softmax e InfoNCE.
          </p>
        </div>
        <button onClick={() => setHasCalculated(true)}>Calcular alineación imagen-texto</button>
      </div>

      <div className="pipeline mllm-pipeline">
        <div className="paso"><strong>Imagen simulada</strong><span>Prompt visual convertido en embedding conceptual.</span></div>
        <div className="paso"><strong>Vision encoder</strong><span>Parches visuales a representación densa.</span></div>
        <div className="paso"><strong>Text encoder</strong><span>Candidatos de texto a embeddings comparables.</span></div>
        <div className="paso"><strong>InfoNCE</strong><span>Aumenta el par correcto y reduce negativos.</span></div>
      </div>

      <div className="mllm-grid">
        <div className="mllm-input-card">
          <label>Imagen simulada</label>
          <input value={imagePrompt} onChange={(event) => { setImagePrompt(event.target.value); setHasCalculated(false); }} />

          <label>Temperatura InfoNCE: <span className="valor-control">{temperature.toFixed(2)}</span></label>
          <input type="range" min="0.1" max="1.4" step="0.05" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} />

          <div className="mllm-candidates">
            {candidates.map((candidate, index) => (
              <div key={index}>
                <label>Candidato {index + 1}</label>
                <textarea value={candidate} onChange={(event) => updateCandidate(index, event.target.value)} rows={2} />
              </div>
            ))}
          </div>
        </div>

        <div className="mllm-result-card" role="status" aria-live="polite">
          <div className="chart-header">
            <div>
              <p className="eyebrow">Resultado</p>
              <h3>{hasCalculated ? `Mejor par: Imagen 1 + Texto ${bestIndex + 1}` : "Resultado pendiente"}</h3>
            </div>
            <span className="mode-badge">{hasCalculated ? `${(probabilities[bestIndex] * 100).toFixed(1)}%` : "sin cálculo"}</span>
          </div>

          <div className="alignment-list">
            {candidates.map((candidate, index) => (
              <article className={index === bestIndex && hasCalculated ? "alignment-item mejor" : "alignment-item"} key={index}>
                <div>
                  <strong>Texto {index + 1}</strong>
                  <span>{candidate}</span>
                </div>
                <div className="alignment-score">
                  <small>{hasCalculated ? `${(probabilities[index] * 100).toFixed(1)}%` : "pendiente"}</small>
                  <div className="mini-barra"><div style={{ width: `${hasCalculated ? Math.max(4, probabilities[index] * 100) : 0}%` }} /></div>
                </div>
              </article>
            ))}
          </div>

          <div className="mllm-explanation">
            <strong>Interpretación</strong>
            <p>
              InfoNCE convierte similitudes imagen-texto en probabilidades. El par con mayor probabilidad representa el candidato más alineado con la imagen simulada; los demás actúan como negativos.
            </p>
          </div>

          <div className="copy-action-grid module-copy-actions">
            <CopyButton text={readmeExplanation}>Copiar explicación</CopyButton>
            <CopyButton text={resultPayload}>Copiar resultado JSON</CopyButton>
          </div>

          <pre className="mini-json">{resultPayload}</pre>
        </div>
      </div>
    </section>
  );
}
