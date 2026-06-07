import { useEffect, useMemo, useState } from "react";
import { getRutaAprendizajeKvCache, validarRespuestaAprendizaje } from "../core/apiClient";
import { rutaKvCacheFallback, type PresetAprendizajeKv, type RespuestaQuizAprendizaje, type RutaAprendizajeKv } from "../learning/kvCachePath";

interface Props {
  aplicarEscenario: (preset: PresetAprendizajeKv) => void;
}

export function LearningPathPanel({ aplicarEscenario }: Props) {
  const [ruta, setRuta] = useState<RutaAprendizajeKv>(rutaKvCacheFallback);
  const [checkpointActivo, setCheckpointActivo] = useState(0);
  const [estadoCarga, setEstadoCarga] = useState("Ruta local cargada.");
  const [respuestas, setRespuestas] = useState<Record<string, RespuestaQuizAprendizaje>>({});
  const [selecciones, setSelecciones] = useState<Record<string, number>>({});

  useEffect(() => {
    let montado = true;
    getRutaAprendizajeKvCache()
      .then((respuesta) => {
        if (!montado) return;
        setRuta(respuesta);
        setEstadoCarga("Ruta sincronizada desde FastAPI.");
      })
      .catch(() => {
        if (!montado) return;
        setRuta(rutaKvCacheFallback);
        setEstadoCarga("Ruta local activa: el backend no respondió al cargar el path.");
      });

    return () => {
      montado = false;
    };
  }, []);

  const checkpoint = ruta.checkpoints[checkpointActivo] ?? ruta.checkpoints[0];
  const progreso = useMemo(() => ((checkpointActivo + 1) / ruta.checkpoints.length) * 100, [checkpointActivo, ruta.checkpoints.length]);

  async function responderPregunta(preguntaId: string, opcion: number) {
    setSelecciones((actual) => ({ ...actual, [preguntaId]: opcion }));
    try {
      const respuesta = await validarRespuestaAprendizaje(preguntaId, opcion);
      setRespuestas((actual) => ({ ...actual, [preguntaId]: respuesta }));
    } catch {
      const pregunta = ruta.quiz.find((item) => item.id === preguntaId);
      if (!pregunta) return;
      setRespuestas((actual) => ({
        ...actual,
        [preguntaId]: {
          correcta: pregunta.respuesta_correcta === opcion,
          respuesta_correcta: pregunta.respuesta_correcta,
          explicacion: pregunta.explicacion
        }
      }));
    }
  }

  return (
    <section className="panel seccion learning-path-panel" aria-label="Learning Path KV Cache">
      <div className="learning-header">
        <div>
          <p className="eyebrow">Learning path · curriculum interactivo</p>
          <h2>{ruta.titulo}</h2>
          <p>{ruta.resumen}</p>
        </div>
        <span className="status-badge ok"><span className="status-dot" aria-hidden="true" />{ruta.duracion_total_minutos} minutos</span>
      </div>

      <div className="learning-progress" aria-label="Progreso del learning path">
        <div style={{ width: `${progreso}%` }} />
      </div>
      <p className="sr-helper">{estadoCarga}</p>

      <div className="learning-layout">
        <div className="learning-checkpoints" role="list" aria-label="Checkpoints de aprendizaje">
          {ruta.checkpoints.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === checkpointActivo ? "learning-checkpoint activo" : "learning-checkpoint"}
              onClick={() => setCheckpointActivo(index)}
            >
              <strong>{item.titulo}</strong>
              <span>{item.duracion_minutos} min · {item.objetivo}</span>
            </button>
          ))}
        </div>

        <article className="learning-detail">
          <p className="eyebrow">Checkpoint activo</p>
          <h3>{checkpoint.titulo}</h3>
          <p>{checkpoint.concepto}</p>

          <div className="learning-action-card">
            <strong>Acción guiada</strong>
            <p>{checkpoint.accion}</p>
            <button type="button" onClick={() => aplicarEscenario(checkpoint.preset)}>Aplicar escenario en KV Cache Estimator</button>
          </div>

          <div className="learning-result-card">
            <strong>Resultado esperado</strong>
            <p>{checkpoint.resultado_esperado}</p>
          </div>
        </article>
      </div>

      <div className="learning-quiz">
        <div className="chart-header">
          <div>
            <p className="eyebrow">Quiz con feedback</p>
            <h3>Comprueba tu comprensión</h3>
          </div>
          <span className="status-badge idle"><span className="status-dot" aria-hidden="true" />3 preguntas</span>
        </div>

        {ruta.quiz.map((pregunta) => {
          const feedback = respuestas[pregunta.id];
          return (
            <article key={pregunta.id} className="quiz-card">
              <strong>{pregunta.pregunta}</strong>
              <div className="quiz-options">
                {pregunta.opciones.map((opcion, index) => (
                  <button
                    key={opcion}
                    type="button"
                    className={selecciones[pregunta.id] === index ? "activo" : ""}
                    onClick={() => responderPregunta(pregunta.id, index)}
                  >
                    {opcion}
                  </button>
                ))}
              </div>
              {feedback && (
                <p className={feedback.correcta ? "quiz-feedback correcto" : "quiz-feedback incorrecto"}>
                  {feedback.correcta ? "Correcto." : "Revisa la explicación."} {feedback.explicacion}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
