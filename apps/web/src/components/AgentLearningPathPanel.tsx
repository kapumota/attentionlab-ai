import { useMemo, useState } from "react";

import { agentDebuggerPath } from "../learning/agentDebuggerPath";

export function AgentLearningPathPanel() {
  const [activeCheckpoint, setActiveCheckpoint] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const checkpoint = agentDebuggerPath.checkpoints[activeCheckpoint];

  const score = useMemo(() => {
    return agentDebuggerPath.quiz.reduce((total, question) => {
      return total + (answers[question.id] === question.respuestaCorrecta ? 1 : 0);
    }, 0);
  }, [answers]);

  function selectAnswer(questionId: string, answer: string) {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  }

  function goToCheckpoint(index: number) {
    setActiveCheckpoint(index);
  }

  return (
    <section className="agent-learning-path" aria-labelledby="agent-learning-title">
      <div className="learning-path-header">
        <p className="eyebrow">Learning Path</p>
        <h3 id="agent-learning-title">{agentDebuggerPath.titulo}</h3>
        <p>{agentDebuggerPath.resumen}</p>
        <span>{agentDebuggerPath.duracionMinutos} minutos</span>
      </div>

      <div className="learning-path-layout">
        <nav className="learning-path-nav" aria-label="Checkpoints de Agent Debugger">
          {agentDebuggerPath.checkpoints.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === activeCheckpoint ? "active" : ""}
              onClick={() => goToCheckpoint(index)}
            >
              {index + 1}. {item.titulo.replace(/^Checkpoint [0-9]+ - /, "")}
            </button>
          ))}
        </nav>

        <article className="learning-path-card">
          <p className="eyebrow">{checkpoint.titulo}</p>
          <h4>{checkpoint.objetivo}</h4>
          <p>{checkpoint.concepto}</p>

          <div className="learning-path-action">
            <strong>Acción sugerida</strong>
            <span>{checkpoint.accion}</span>
          </div>

          <div className="learning-path-action">
            <strong>Resultado esperado</strong>
            <span>{checkpoint.resultadoEsperado}</span>
          </div>
        </article>
      </div>

      <div className="learning-path-quiz">
        <div>
          <p className="eyebrow">Quiz con feedback inmediato</p>
          <h4>Puntaje: {score} / {agentDebuggerPath.quiz.length}</h4>
        </div>

        {agentDebuggerPath.quiz.map((question) => {
          const selected = answers[question.id];
          const answered = Boolean(selected);
          const correct = selected === question.respuestaCorrecta;

          return (
            <div key={question.id} className="learning-path-question">
              <strong>{question.pregunta}</strong>
              <div className="learning-path-options">
                {question.opciones.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={selected === option ? "selected" : ""}
                    onClick={() => selectAnswer(question.id, option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {answered && (
                <p className={correct ? "feedback-ok" : "feedback-warning"}>
                  {correct ? "Correcto. " : "Revisa la explicación. "}
                  {question.explicacion}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
