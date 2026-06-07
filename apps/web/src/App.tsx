import { useEffect, useMemo, useState } from "react";
import { AttentionMatrix } from "./components/AttentionMatrix";
import { ProbabilityBars } from "./components/ProbabilityBars";
import { MetricsCards } from "./components/MetricsCards";
import { ControlPanel } from "./components/ControlPanel";
import { ExperimentExplanation } from "./components/ExperimentExplanation";
import { HybridArchitecture } from "./components/HybridArchitecture";
import { ModuleStatus } from "./components/ModuleStatus";
import { ArchitectureBuilder } from "./components/ArchitectureBuilder";
import { LLMPlayground } from "./components/LLMPlayground";
import { MLLMPlayground } from "./components/MLLMPlayground";
import { AgentsPlayground } from "./components/AgentsPlayground";
import { SpaceReadiness } from "./components/SpaceReadiness";
import { V03Readiness } from "./components/V03Readiness";
import { BackendStatus } from "./components/BackendStatus";
import { V04Readiness } from "./components/V04Readiness";
import { V05Readiness } from "./components/V05Readiness";
import { AgentDebuggerPlayground } from "./components/AgentDebuggerPlayground";
import { V10Readiness } from "./components/V10Readiness";
import { BackendPlayground } from "./components/BackendPlayground";
import { RealModelPlayground } from "./components/RealModelPlayground";
import { GlossaryPanel } from "./components/GlossaryPanel";
import { CopyButton } from "./components/CopyButton";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { computeAttention, generateBaseSimilarityMatrix } from "./core/attention";
import { getApiHealth, getModelRuntimeStatus, type ApiHealth, type ModelRuntimeStatus } from "./core/apiClient";
import { createBlockFromBuilder, createInitialArchitecture, getHybridLayers, syncArchitecture } from "./core/architecture";
import { getExplanation } from "./core/explanations";
import type { ArchitectureSpec, BuilderConfig, LearningMode, MatrixCellSelection, SimulationConfig } from "./types";

const initialConfig: SimulationConfig = {
  mode: "infonce",
  tokens: 8,
  temperature: 0.2,
  windowSize: 2,
  topK: 3,
  queryHeads: 8,
  kvHeads: 2,
  visualHead: 1
};

const initialBuilder: BuilderConfig = {
  numLayers: 12,
  dimension: 768,
  blockType: "gqa",
  windowSize: 1024,
  mlaRank: 64,
  repeat: 6,
  rope: true,
  gating: false
};

type SectionId = "overview" | "attention" | "architecture" | "llm" | "rag" | "api" | "release";

interface SectionItem {
  id: SectionId;
  title: string;
  shortTitle: string;
  description: string;
}

interface DemoStep {
  title: string;
  section: SectionId;
  preset: SimulationConfig;
  contextLength?: number;
  batchSize?: number;
  what: string;
  action: string;
  expected: string;
  presentation: string;
}

interface DemoPreset {
  id: string;
  title: string;
  section: SectionId;
  preset: SimulationConfig;
  contextLength?: number;
  batchSize?: number;
  demoStep?: number;
  objective: string;
  changes: string[];
}

const sections: SectionItem[] = [
  {
    id: "overview",
    title: "Vista general",
    shortTitle: "Vista general",
    description: "Mapa del panel, estado técnico y acceso a la demostración guiada."
  },
  {
    id: "attention",
    title: "Laboratorio de atención",
    shortTitle: "Atención",
    description: "Matriz, probabilidades, métricas e interpretación de cada patrón de atención."
  },
  {
    id: "architecture",
    title: "Constructor Transformer",
    shortTitle: "Arquitectura",
    description: "Diseño visual de bloques Transformer y contrato JSON de arquitectura."
  },
  {
    id: "llm",
    title: "Estimador LLM / KV Cache",
    shortTitle: "Costo LLM",
    description: "Estimaciones de memoria, contexto largo, GQA, MLA y batch de inferencia."
  },
  {
    id: "rag",
    title: "RAG + Agent Debugger",
    shortTitle: "RAG / Agente",
    description: "Indexación, recuperación top-k, trazas, herramientas y groundedness."
  },
  {
    id: "api",
    title: "Backend / API",
    shortTitle: "API Debug",
    description: "Estado FastAPI, endpoints, payloads, respuestas y runtime de modelos."
  },
  {
    id: "release",
    title: "Publicación / Release",
    shortTitle: "Release",
    description: "Checklist de entrega, Docker Space, documentación y estado de módulos."
  }
];

const demoSteps: DemoStep[] = [
  {
    title: "InfoNCE imagen-texto",
    section: "attention",
    preset: { ...initialConfig, mode: "infonce", tokens: 8, temperature: 0.2 },
    what: "Estás viendo una matriz de similitud y el softmax de una fila enfocada.",
    action: "Mueve la temperatura entre 0.20 y 1.00.",
    expected: "Con temperatura baja la probabilidad se concentra; con temperatura alta se distribuye.",
    presentation: "InfoNCE premia el par correcto frente a candidatos negativos, como en entrenamiento contrastivo imagen-texto."
  },
  {
    title: "Atención causal de LLM",
    section: "attention",
    preset: { ...initialConfig, mode: "causal", tokens: 10, temperature: 0.7 },
    what: "La matriz triangular muestra que cada token solo puede atender al pasado.",
    action: "Aumenta los tokens de 6 a 12 y observa la zona bloqueada.",
    expected: "La matriz crece, pero las posiciones futuras siguen bloqueadas.",
    presentation: "Esto simula cómo un modelo tipo GPT genera texto: no puede mirar tokens futuros."
  },
  {
    title: "Sliding Window Attention",
    section: "attention",
    preset: { ...initialConfig, mode: "ventana", tokens: 12, windowSize: 2, temperature: 0.65 },
    what: "Cada token atiende solo a vecinos cercanos dentro de una ventana local.",
    action: "Cambia la ventana de 1 a 5.",
    expected: "Una ventana pequeña reduce conexiones; una ventana grande permite más contexto local.",
    presentation: "La atención por ventana reduce costo en contexto largo, aunque puede perder relaciones lejanas."
  },
  {
    title: "GQA y KV Cache",
    section: "llm",
    preset: { ...initialConfig, mode: "gqa", tokens: 10, queryHeads: 8, kvHeads: 2, visualHead: 1 },
    contextLength: 32768,
    batchSize: 4,
    what: "GQA conserva varias query heads, pero comparte menos heads de keys y values.",
    action: "Compara Query heads = 8 con KV heads = 2 y revisa el estimador LLM.",
    expected: "La KV cache baja frente a MHA porque hay menos heads de key/value que guardar.",
    presentation: "GQA es una optimización usada en LLMs modernos para reducir memoria de inferencia."
  },
  {
    title: "RAG visual",
    section: "rag",
    preset: { ...initialConfig, mode: "agente", tokens: 8 },
    what: "El flujo muestra documentos, consulta, recuperación top-k y evidencia recuperada.",
    action: "Indexa documentos y luego ejecuta una consulta RAG.",
    expected: "Aparecen documentos recuperados con scores y referencias visuales.",
    presentation: "RAG conecta una pregunta con evidencia externa antes de producir o justificar una respuesta."
  },
  {
    title: "Agent Debugger",
    section: "rag",
    preset: { ...initialConfig, mode: "agente", tokens: 8 },
    what: "El depurador muestra pasos, herramientas, latencia, estado y groundedness.",
    action: "Ejecuta Depurar agente después de indexar documentos.",
    expected: "Se genera una traza auditable con pasos y evidencia usada por el agente.",
    presentation: "No basta con ver la respuesta final; en agentes conviene auditar qué hizo, qué consultó y qué evidencia usó."
  }
];


const demoPresets: DemoPreset[] = [
  {
    id: "quick-demo",
    title: "Demostración rápida",
    section: "attention",
    demoStep: 0,
    preset: { ...initialConfig, mode: "infonce", tokens: 8, temperature: 0.2, topK: 3 },
    objective: "Recorrer el flujo básico: concepto, matriz, probabilidades e interpretación.",
    changes: ["Modo InfoNCE", "temperatura baja", "matriz enfocada"]
  },
  {
    id: "mha-vs-gqa",
    title: "Comparar MHA vs GQA",
    section: "llm",
    demoStep: 3,
    preset: { ...initialConfig, mode: "gqa", tokens: 10, queryHeads: 8, kvHeads: 2, visualHead: 1, temperature: 0.65 },
    contextLength: 32768,
    batchSize: 4,
    objective: "Ver cómo reducir KV heads baja memoria de KV cache frente a MHA.",
    changes: ["Query heads = 8", "KV heads = 2", "contexto 32k", "batch 4"]
  },
  {
    id: "cheap-long-context",
    title: "Contexto largo",
    section: "attention",
    demoStep: 2,
    preset: { ...initialConfig, mode: "ventana", tokens: 12, windowSize: 2, temperature: 0.65 },
    contextLength: 65536,
    batchSize: 2,
    objective: "Mostrar cómo Sliding Window reduce conexiones activas en contexto largo.",
    changes: ["Sliding Window", "12 tokens", "ventana = 2", "contexto 65k"]
  },
  {
    id: "rag-evidence",
    title: "RAG con evidencia",
    section: "rag",
    demoStep: 4,
    preset: { ...initialConfig, mode: "agente", tokens: 8, temperature: 0.7 },
    objective: "Demostrar indexación, recuperación top-k, scores y evidencia citada.",
    changes: ["Modo agente", "indexar documentos", "consultar RAG", "top-k retrieval"]
  },
  {
    id: "agent-tools",
    title: "Agente con herramientas",
    section: "rag",
    demoStep: 5,
    preset: { ...initialConfig, mode: "agente", tokens: 8, topK: 3 },
    objective: "Mostrar una traza auditable con herramienta, latencia, estado y groundedness.",
    changes: ["Trazado de herramientas", "groundedness", "pasos del agente"]
  },
  {
    id: "mllm-image-text",
    title: "MLLM imagen-texto",
    section: "rag",
    demoStep: 0,
    preset: { ...initialConfig, mode: "cross", tokens: 8, temperature: 0.35 },
    objective: "Conectar cross-attention e InfoNCE con alineación imagen-texto.",
    changes: ["Cross-attention", "pares imagen-texto", "contraste positivo/negativo"]
  }
];

const mixPool: Array<[string, string]> = [
  ["GQA", "Reduce KV cache."],
  ["SWA", "Atención local barata."],
  ["Full attn", "Bloque global expresivo."],
  ["Sparse", "Selecciona relaciones Top-k."],
  ["Cross-attn", "Fusiona modalidades."],
  ["Memoria", "Recupera contexto externo."],
  ["MLP", "Expande y comprime features."],
  ["Router", "Decide ruta de cómputo."]
];

export function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [activeDemoStep, setActiveDemoStep] = useState(0);
  const [activePresetId, setActivePresetId] = useState(demoPresets[0].id);
  const [learningMode, setLearningMode] = useState<LearningMode>("basic");
  const [config, setConfig] = useState<SimulationConfig>(initialConfig);
  const [builder, setBuilder] = useState<BuilderConfig>(initialBuilder);
  const [baseMatrix, setBaseMatrix] = useState(() => generateBaseSimilarityMatrix(initialConfig.tokens, initialConfig.mode));
  const [focusedRow, setFocusedRow] = useState(0);
  const [selectedCell, setSelectedCell] = useState<MatrixCellSelection>({ row: 0, col: 0 });
  const [architecture, setArchitecture] = useState<ArchitectureSpec>(() => createInitialArchitecture(initialConfig, initialBuilder));
  const [customHybridLayers, setCustomHybridLayers] = useState<Array<[string, string]> | null>(null);
  const [contextLength, setContextLength] = useState(8192);
  const [batchSize, setBatchSize] = useState(1);

  const result = useMemo(() => computeAttention(baseMatrix, config), [baseMatrix, config]);
  const explanation = getExplanation(config.mode, config.temperature, config.windowSize, config.topK, config.queryHeads, config.kvHeads);
  const hybridLayers = customHybridLayers ?? getHybridLayers(config.mode);
  const syncedArchitecture = syncArchitecture(architecture, config, builder);
  const currentSection = sections.find((section) => section.id === activeSection) ?? sections[0];
  const currentDemo = demoSteps[activeDemoStep];

  function handleConfigChange(next: SimulationConfig) {
    const shouldRegenerate = next.tokens !== config.tokens || next.mode !== config.mode;
    setConfig(next);
    if (shouldRegenerate) {
      setFocusedRow(0);
      setSelectedCell({ row: 0, col: 0 });
      setBaseMatrix(generateBaseSimilarityMatrix(next.tokens, next.mode));
    }
  }

  function regenerateData() {
    setSelectedCell({ row: 0, col: 0 });
    setBaseMatrix(generateBaseSimilarityMatrix(config.tokens, config.mode));
  }

  function mixLayers() {
    const layers = Array.from({ length: 4 }, () => mixPool[Math.floor(Math.random() * mixPool.length)]);
    setCustomHybridLayers(layers);
  }

  function addArchitectureBlock() {
    const block = createBlockFromBuilder(builder, config.topK);
    setArchitecture({ ...syncedArchitecture, layers: [...syncedArchitecture.layers, block] });
  }

  function clearArchitecture() {
    setArchitecture({ ...syncedArchitecture, layers: [] });
  }

  function handleBuilderChange(next: BuilderConfig) {
    setBuilder(next);
    setArchitecture((current) => syncArchitecture(current, config, next));
  }

  function applyDemoStep(index: number) {
    const step = demoSteps[index];
    setActiveDemoStep(index);
    setActiveSection(step.section);
    handleConfigChange(step.preset);
    if (step.contextLength) setContextLength(step.contextLength);
    if (step.batchSize) setBatchSize(step.batchSize);
  }

  function applyPreset(preset: DemoPreset) {
    setActivePresetId(preset.id);
    if (typeof preset.demoStep === "number") setActiveDemoStep(preset.demoStep);
    setActiveSection(preset.section);
    handleConfigChange(preset.preset);
    if (preset.contextLength) setContextLength(preset.contextLength);
    if (preset.batchSize) setBatchSize(preset.batchSize);
  }

  function goToNextSection() {
    const currentIndex = sections.findIndex((section) => section.id === activeSection);
    setActiveSection(sections[(currentIndex + 1) % sections.length].id);
  }

  function goToPreviousSection() {
    const currentIndex = sections.findIndex((section) => section.id === activeSection);
    setActiveSection(sections[(currentIndex - 1 + sections.length) % sections.length].id);
  }

  function renderSection() {
    if (activeSection === "overview") {
      return (
        <section className="section-stack">
          <OverviewCards onStartDemo={() => applyDemoStep(0)} learningMode={learningMode} />
          <LearningModePanel learningMode={learningMode} config={config} />
          <GuidedDemoPanel activeDemoStep={activeDemoStep} onApplyStep={applyDemoStep} />
          <GlossaryPanel onNavigate={setActiveSection} />
          <BackendStatus />
          <ModuleStatus />
        </section>
      );
    }

    if (activeSection === "attention") {
      return (
        <section className="attention-layout">
          <ControlPanel
            config={config}
            learningMode={learningMode}
            onChange={handleConfigChange}
            onRegenerate={regenerateData}
            onMixLayers={mixLayers}
          />
          <div className="section-stack">
            <GuidedDemoPanel activeDemoStep={activeDemoStep} onApplyStep={applyDemoStep} compact />
            <LearningModePanel learningMode={learningMode} config={config} />
            <AutoInterpretationPanel config={config} focusedRow={focusedRow} selectedCell={selectedCell} />
            <div className="grid-principal">
              <AttentionMatrix
                result={result}
                config={config}
                focusedRow={focusedRow}
                selectedCell={selectedCell}
                learningMode={learningMode}
                title={explanation.matrixTitle}
                onFocusRow={setFocusedRow}
                onSelectCell={setSelectedCell}
              />
              <section>
                <ProbabilityBars
                  result={result}
                  config={config}
                  focusedRow={focusedRow}
                  title={explanation.barsTitle}
                />
                <MetricsCards result={result} config={config} focusedRow={focusedRow} />
              </section>
            </div>
            <ExperimentExplanation description={explanation.description} formula={learningMode === "basic" ? "Modo básico: se ocultan fórmulas para priorizar la intuición." : explanation.formula} />
            <HybridArchitecture layers={hybridLayers} />
          </div>
        </section>
      );
    }

    if (activeSection === "architecture") {
      return (
        <section className="section-stack">
          <ErrorBoundary title="Constructor Transformer">
            <ArchitectureBuilder
              config={config}
              builder={builder}
              architecture={syncedArchitecture}
              onBuilderChange={handleBuilderChange}
              onAddBlock={addArchitectureBlock}
              onClear={clearArchitecture}
            />
          </ErrorBoundary>
          <HybridArchitecture layers={hybridLayers} />
        </section>
      );
    }

    if (activeSection === "llm") {
      return (
        <section className="section-stack">
          <GuidedDemoPanel activeDemoStep={activeDemoStep} onApplyStep={applyDemoStep} compact />
          <ErrorBoundary title="Estimador LLM / KV Cache">
            <LLMPlayground
              config={config}
              builder={builder}
              contextLength={contextLength}
              batchSize={batchSize}
              onContextLengthChange={setContextLength}
              onBatchSizeChange={setBatchSize}
            />
          </ErrorBoundary>
          <ExperimentExplanation description={explanation.description} formula={explanation.formula} />
        </section>
      );
    }

    if (activeSection === "rag") {
      return (
        <section className="section-stack">
          <GuidedDemoPanel activeDemoStep={activeDemoStep} onApplyStep={applyDemoStep} compact />
          <ErrorBoundary title="RAG + Agent Debugger">
            <AgentDebuggerPlayground />
          </ErrorBoundary>
          <AgentsPlayground />
          <ErrorBoundary title="MLLM imagen-texto">
            <MLLMPlayground />
          </ErrorBoundary>
        </section>
      );
    }

    if (activeSection === "api") {
      return (
        <section className="section-stack">
          <BackendStatus />
          <ErrorBoundary title="Backend / API">
            <BackendPlayground
              config={config}
              builder={builder}
              architecture={syncedArchitecture}
              contextLength={contextLength}
              batchSize={batchSize}
            />
          </ErrorBoundary>
          <ErrorBoundary title="Modelos reales / fallback">
            <RealModelPlayground />
          </ErrorBoundary>
        </section>
      );
    }

    return (
      <section className="section-stack">
        <SpaceReadiness />
        <V03Readiness />
        <V04Readiness />
        <V05Readiness />
        <V10Readiness />
      </section>
    );
  }

  return (
    <>
      <header className="app-header">
        <div>
          <p className="eyebrow">Panel educativo de IA</p>
          <h1>Attentio AI Lab</h1>
          <p className="subtitulo">
            Laboratorio visual para explorar atención, arquitecturas Transformer, KV cache,
            RAG, agentes, modelos multimodales y endpoints FastAPI sin depender de OpenAI API.
          </p>
        </div>
        <div className="header-actions">
          <LearningModeSelector value={learningMode} onChange={setLearningMode} />
          <button onClick={() => applyDemoStep(0)}>Iniciar demo guiada</button>
          <button className="secundario" onClick={() => setActiveSection("api")}>Probar backend</button>
        </div>
      </header>

      <GlobalStatusBar onOpenApi={() => setActiveSection("api")} />

      <PresetRail
        presets={demoPresets}
        activePresetId={activePresetId}
        onApplyPreset={applyPreset}
      />

      <main className="dashboard-shell">
        <aside className="dashboard-sidebar" aria-label="Navegación del panel">
          <div className="brand-card">
            <strong>Attentio AI Lab v1.1.0-dev</strong>
            <span>Backend OK cuando FastAPI responde en /api/health.</span>
            <span className="brand-mode">Modo: {learningMode === "basic" ? "Básico" : learningMode === "technical" ? "Técnico" : "Experto"}</span>
          </div>
          <nav className="nav-sections">
            {sections.map((section, index) => (
              <button
                key={section.id}
                className={activeSection === section.id ? "nav-item activo" : "nav-item"}
                onClick={() => setActiveSection(section.id)}
                aria-current={activeSection === section.id ? "page" : undefined}
              >
                <span className="nav-index">{index + 1}</span>
                <span>
                  <strong>{section.shortTitle}</strong>
                  <small>{section.description}</small>
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="dashboard-content">
          <div className="section-header panel suave">
            <div>
              <p className="eyebrow">{String(sections.findIndex((section) => section.id === activeSection) + 1).padStart(2, "0")}</p>
              <h2>{currentSection.title}</h2>
              <p>{currentSection.description}</p>
            </div>
            <div className="section-actions">
              <button className="secundario" onClick={goToPreviousSection}>Anterior</button>
              <button onClick={goToNextSection}>Siguiente módulo</button>
            </div>
          </div>

          {renderSection()}
        </section>
      </main>
    </>
  );
}



function buildAutoInterpretation(config: SimulationConfig, focusedRow: number, selectedCell: MatrixCellSelection) {
  if (config.mode === "gqa") {
    return {
      title: "Interpretación automática: GQA",
      body: `Tienes ${config.queryHeads} query heads y ${config.kvHeads} KV heads. Eso significa que varios grupos de query heads comparten keys/values. Resultado: menor KV cache frente a MHA tradicional.`,
      readme: `Este módulo visualiza GQA con ${config.queryHeads} query heads y ${config.kvHeads} KV heads. GQA comparte keys/values entre grupos de query heads para reducir memoria de KV cache frente a MHA tradicional.`
    };
  }

  if (config.mode === "sparse") {
    return {
      title: "Interpretación automática: Esparsidad Top-k ",
      body: `Con Top-k = ${config.topK}, cada token conserva solo sus ${config.topK} relaciones más fuertes. Esto reduce conexiones activas y simula atención dispersa.`,
      readme: `Este módulo visualiza atención sparse Top-k. Con Top-k = ${config.topK}, cada token conserva solo las relaciones más fuertes y descarta conexiones menos relevantes.`
    };
  }

  if (config.mode === "ventana") {
    return {
      title: "Interpretación automática: Ventana deslizante",
      body: `Con ventana = ${config.windowSize}, cada token mira principalmente vecinos cercanos. Esto reduce costo visual y ayuda a explicar contexto largo más barato.`,
      readme: `Este módulo visualiza Sliding Window Attention. Cada token solo atiende una ventana local de tamaño ${config.windowSize}, reduciendo conexiones frente a atención completa.`
    };
  }

  if (config.mode === "causal") {
    return {
      title: "Interpretación automática: atención causal",
      body: `La fila ${focusedRow + 1} solo puede atender columnas pasadas o la misma posición. La celda seleccionada es Token ${selectedCell.row + 1} a Token ${selectedCell.col + 1}.`,
      readme: "Este módulo visualiza atención causal, donde cada token solo puede atender a tokens anteriores o a sí mismo. Esto simula el comportamiento autoregresivo de modelos tipo GPT."
    };
  }

  if (config.mode === "infonce" || config.mode === "cross") {
    const temperatureRead = config.temperature < 0.45
      ? "temperatura baja: distribución más concentrada"
      : config.temperature > 0.9
        ? "temperatura alta: distribución más suave"
        : "temperatura intermedia: equilibrio entre concentración y suavidad";
    return {
      title: "Interpretación automática: temperatura",
      body: `Temperatura actual ${config.temperature.toFixed(2)}; ${temperatureRead}. En InfoNCE, la temperatura controla qué tan dominante se vuelve el mejor candidato.`,
      readme: `Este módulo visualiza InfoNCE/cross-attention con temperatura ${config.temperature.toFixed(2)}. Temperaturas bajas concentran probabilidades; temperaturas altas suavizan la distribución.`
    };
  }

  return {
    title: "Interpretación automática",
    body: `La configuración actual usa ${config.tokens} tokens y temperatura ${config.temperature.toFixed(2)}. Cambia el modo o los controles resaltados para ver cómo cambia la matriz.`,
    readme: `Este módulo visualiza un patrón de atención con ${config.tokens} tokens y temperatura ${config.temperature.toFixed(2)}.`
  };
}

function AutoInterpretationPanel({ config, focusedRow, selectedCell }: { config: SimulationConfig; focusedRow: number; selectedCell: MatrixCellSelection }) {
  const content = buildAutoInterpretation(config, focusedRow, selectedCell);
  const payload = {
    mode: config.mode,
    tokens: config.tokens,
    temperature: config.temperature,
    windowSize: config.windowSize,
    topK: config.topK,
    queryHeads: config.queryHeads,
    kvHeads: config.kvHeads,
    focusedRow,
    selectedCell
  };

  return (
    <section className="panel auto-interpretation">
      <div>
        <p className="eyebrow">Interpretación automática</p>
        <h2>{content.title}</h2>
        <p>{content.body}</p>
      </div>
      <div className="copy-action-grid">
        <CopyButton text={content.readme}>Copiar explicación para README</CopyButton>
        <CopyButton text={JSON.stringify(payload, null, 2)}>Copiar payload JSON</CopyButton>
      </div>
    </section>
  );
}

function TerminologyPanel() {
  return (
    <section className="panel terminology-panel">
      <div>
        <p className="eyebrow">Terminología consistente</p>
        <h2>Estándar de nombres técnicos</h2>
        <p>
          El panel mantiene términos técnicos habituales en IA, pero los acompaña con explicación en español para que no parezcan etiquetas sueltas.
        </p>
      </div>
      <div className="terminology-grid">
        <article><strong>Head de atención</strong><span>Subespacio o cabeza que aprende una relación distinta entre tokens.</span></article>
        <article><strong>Query / Key / Value</strong><span>Consultas, claves y valores usados para calcular atención.</span></article>
        <article><strong>Groundedness</strong><span>Mide cuánto una respuesta está respaldada por documentos recuperados.</span></article>
        <article><strong>Trazado de herramientas</strong><span>Registra herramientas llamadas por el agente, entradas, salidas, latencia y estado.</span></article>
      </div>
    </section>
  );
}


function GlobalStatusBar({ onOpenApi }: { onOpenApi: () => void }) {
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [runtime, setRuntime] = useState<ModelRuntimeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState<string>("sin verificar");

  async function refreshStatus() {
    setLoading(true);
    const [healthResult, runtimeResult] = await Promise.allSettled([getApiHealth(), getModelRuntimeStatus()]);
    setHealth(healthResult.status === "fulfilled" ? healthResult.value : null);
    setRuntime(runtimeResult.status === "fulfilled" ? runtimeResult.value : null);
    setCheckedAt(new Date().toLocaleTimeString());
    setLoading(false);
  }

  useEffect(() => {
    void refreshStatus();
  }, []);

  const backendOk = health?.status === "ok";
  const runtimeLabel = runtime?.enabled ? "modelos reales" : "determinístico";
  const modeLabel = health?.mode === "docker-space" ? "Docker Space" : health?.mode === "local" ? "Modo local" : "Modo pendiente";

  return (
    <section className="global-status-bar" aria-label="Estado global del proyecto" role="status" aria-live="polite">
      <div className="global-status-copy">
        <strong>Estado global</strong>
        <span>Última verificación: {checkedAt}</span>
      </div>
      <div className="global-status-chips">
        <span className={backendOk ? "global-chip ok" : loading ? "global-chip running" : "global-chip error"}>
          <span className="status-dot" /> Backend: {loading ? "verificando" : backendOk ? "OK" : "desconectado"}
        </span>
        <span className="global-chip neutral">API: /api/*</span>
        <span className="global-chip neutral">Runtime: {runtimeLabel}</span>
        <span className="global-chip ok">Sin OpenAI API</span>
        <span className="global-chip neutral">{modeLabel}</span>
        <span className="global-chip ok">Listo para Docker</span>
        <span className="global-chip ok">Pruebas: correctas</span>
        <span className="global-chip neutral">v{health?.version ?? "1.1.0-dev"}</span>
      </div>
      <div className="global-status-actions">
        <button type="button" className="secundario" onClick={() => void refreshStatus()}>Actualizar estado</button>
        <button type="button" onClick={onOpenApi}>Abrir API Debug</button>
      </div>
    </section>
  );
}

function PresetRail({
  presets,
  activePresetId,
  onApplyPreset
}: {
  presets: DemoPreset[];
  activePresetId: string;
  onApplyPreset: (preset: DemoPreset) => void;
}) {
  const activePreset = presets.find((preset) => preset.id === activePresetId) ?? presets[0];

  return (
    <section className="preset-rail" aria-label="Escenarios rápidos de demo">
      <div className="preset-copy">
        <p className="eyebrow">Escenarios de presentación</p>
        <strong>{activePreset.title}</strong>
        <span>{activePreset.objective}</span>
      </div>
      <div className="preset-actions">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={preset.id === activePresetId ? "preset-button activo" : "preset-button"}
            onClick={() => onApplyPreset(preset)}
            title={preset.objective}
          >
            <strong>{preset.title}</strong>
            <small>{preset.changes.join(" · ")}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function LearningModeSelector({ value, onChange }: { value: LearningMode; onChange: (mode: LearningMode) => void }) {
  const options: Array<{ value: LearningMode; label: string; caption: string }> = [
    { value: "basic", label: "Básico", caption: "intuición" },
    { value: "technical", label: "Técnico", caption: "fórmulas" },
    { value: "expert", label: "Experto", caption: "API/JSON" }
  ];

  return (
    <div className="learning-selector" role="group" aria-label="Seleccionar nivel de explicación">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "learning-option activa" : "learning-option"}
          onClick={() => onChange(option.value)}
        >
          <strong>{option.label}</strong>
          <span>{option.caption}</span>
        </button>
      ))}
    </div>
  );
}

function LearningModePanel({ learningMode, config }: { learningMode: LearningMode; config: SimulationConfig }) {
  const basic = {
    title: "Modo básico",
    body: "La atención decide qué partes de una secuencia importan más. Mira la matriz como un mapa de relaciones: una fila pregunta y las columnas aportan contexto.",
    detail: "Objetivo: entender visualmente qué cambia cuando modificas tokens, temperatura, ventana o Top-k."
  };
  const technical = {
    title: "Modo técnico",
    body: "La atención calcula scores con QKᵀ, aplica máscaras como causal mask, sliding window o top-k sparsity, y normaliza con softmax.",
    detail: `Modo actual: ${config.mode}. Fórmula base: softmax(QKᵀ / √d). Temperatura: ${config.temperature.toFixed(2)}.`
  };
  const expert = {
    title: "Modo experto",
    body: "Además de la visualización, revisa contratos, payloads, endpoints, métricas y salidas JSON para conectar el panel con FastAPI.",
    detail: `Endpoint principal: POST /api/attention/compute. Tokens: ${config.tokens}. Query heads: ${config.queryHeads}. KV heads: ${config.kvHeads}.`
  };
  const content = learningMode === "basic" ? basic : learningMode === "technical" ? technical : expert;

  return (
    <section className={`panel learning-panel ${learningMode}`}>
      <div>
        <p className="eyebrow">Nivel de explicación</p>
        <h2>{content.title}</h2>
        <p>{content.body}</p>
      </div>
      <div className="learning-detail">
        <strong>{learningMode === "basic" ? "Idea clave" : learningMode === "technical" ? "Concepto técnico" : "Vista de ingeniería"}</strong>
        <span>{content.detail}</span>
      </div>
    </section>
  );
}

function OverviewCards({ onStartDemo, learningMode }: { onStartDemo: () => void; learningMode: LearningMode }) {
  return (
    <section className="overview-hero panel">
      <div>
        <p className="eyebrow">Vista general</p>
        <h2>Un panel guiado, no una página larga.</h2>
        <p className="explicacion">
          La interfaz ahora separa cada bloque en secciones navegables para que la demostración tenga orden:
          primero se elige un escenario, luego se entiende el concepto, se manipula la simulación y finalmente se conectan los endpoints del backend.
        </p>
        <div className="botonera-hero">
          <button onClick={onStartDemo}>Iniciar demo guiada</button>
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer">Abrir FastAPI docs</a>
        </div>
      </div>
      <div className="overview-grid">
        <article>
          <strong>1. Aprender</strong>
          <span>Explicaciones cortas por módulo, con foco en qué se está viendo.</span>
        </article>
        <article>
          <strong>2. Interactuar</strong>
          <span>Controles de tokens, temperatura, ventana, Top-k, heads y KV heads.</span>
        </article>
        <article>
          <strong>3. Validar</strong>
          <span>Endpoints FastAPI para atención, arquitectura, LLM, MLLM, RAG y agentes.</span>
        </article>
        <article>
          <strong>4. Presentar</strong>
          <span>Guion de demostración integrado para explicar cada concepto en una exposición.</span>
          <small>Modo activo: {learningMode === "basic" ? "Básico" : learningMode === "technical" ? "Técnico" : "Experto"}</small>
        </article>
      </div>
    </section>
  );
}

function GuidedDemoPanel({
  activeDemoStep,
  onApplyStep,
  compact = false
}: {
  activeDemoStep: number;
  onApplyStep: (index: number) => void;
  compact?: boolean;
}) {
  const step = demoSteps[activeDemoStep];

  return (
    <section className={compact ? "panel demo-guide compacta" : "panel demo-guide"}>
      <div className="demo-guide-header">
        <div>
          <p className="eyebrow">Modo demo guiada</p>
          <h2>Paso {activeDemoStep + 1} de {demoSteps.length}: {step.title}</h2>
        </div>
        <button onClick={() => onApplyStep(activeDemoStep)}>Aplicar este paso</button>
      </div>

      <div className="demo-step-grid">
        <article>
          <strong>Qué estás viendo</strong>
          <span>{step.what}</span>
        </article>
        <article>
          <strong>Qué debes mover</strong>
          <span>{step.action}</span>
        </article>
        <article>
          <strong>Qué debería pasar</strong>
          <span>{step.expected}</span>
        </article>
        <article>
          <strong>Cómo explicarlo</strong>
          <span>{step.presentation}</span>
        </article>
      </div>

      <div className="demo-stepper" aria-label="Pasos de la demo guiada">
        {demoSteps.map((candidate, index) => (
          <button
            key={candidate.title}
            className={index === activeDemoStep ? "step-pill activa" : "step-pill"}
            onClick={() => onApplyStep(index)}
          >
            {index + 1}. {candidate.title}
          </button>
        ))}
      </div>
    </section>
  );
}
