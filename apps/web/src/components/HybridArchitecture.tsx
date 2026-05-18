interface Props {
  layers: Array<[string, string]>;
}

export function HybridArchitecture({ layers }: Props) {
  return (
    <section className="panel seccion">
      <h2>Arquitectura híbrida sugerida</h2>
      <div className="capas">
        {layers.map(([title, description], index) => (
          <div className="capa" key={`${title}-${index}`}>
            <strong>{index + 1}. {title}</strong>
            <span>{description}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
