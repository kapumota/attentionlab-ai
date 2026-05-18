interface Props {
  description: string;
  formula: string;
}

export function ExperimentExplanation({ description, formula }: Props) {
  return (
    <section className="panel seccion">
      <h2>Lectura del experimento</h2>
      <p className="explicacion">{description}</p>
      <pre className="formula">{formula}</pre>
    </section>
  );
}
