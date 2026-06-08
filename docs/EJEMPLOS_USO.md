### Ejemplos de uso de Attention AI Lab

Este documento muestra cómo ejecutar y usar el frontend de **Attention AI Lab v1.2.0** durante una demostración local.

Está pensado para explicar todas las operaciones principales del panel: navegación, laboratorio de atención, presets, constructor Transformer, estimador LLM, RAG,
Agent Debugger, consola FastAPI, MLLM y publicación.

El proyecto funciona por defecto sin OpenAI API, sin GPU y sin credenciales externas. El backend usa un modo determinístico/fallback ligero para que la demostración sea reproducible.

#### 1. Validación antes de ejecutar

Ejecuta estas validaciones antes de presentar la demostración:

```bash
source .atencion/bin/activate
PYTHONPATH=apps/api pytest apps/api/tests -q
npm --prefix apps/web run check
bash scripts/validate-local.sh
```

Resultado esperado:

```text
Backend tests: passed
Frontend TypeScript: OK
Frontend build: OK
Validación local completada
```

#### 2. Ejecución local con dos terminales

Para la demostración normal de desarrollo, usa dos terminales.

##### Terminal 1: backend FastAPI

```bash
cd attentio-ai-lab
source .atencion/bin/activate
PYTHONPATH=apps/api uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Debes ver algo como:

```text
Uvicorn running on http://0.0.0.0:8000
Application startup complete.
```

Backend disponible en:

```text
http://localhost:8000
http://localhost:8000/api/health
http://localhost:8000/docs
```

Verificación rápida:

```bash
curl http://localhost:8000/api/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "version": "1.2.0"
}
```


##### Terminal 2: frontend React/Vite

```bash
cd attentio-ai-lab
npm --prefix apps/web run dev
```

Debes ver:

```text
Local: http://localhost:5173/
```

Abre en el navegador:

```text
http://localhost:5173
```

En desarrollo, Vite usa proxy para redirigir:

```text
/api/* -> http://localhost:8000/api/*
```

#### 3. Estructura del panel

El frontend está organizado en secciones:

```text
1. Vista general
2. Atención
3. Arquitectura
4. LLM Cost
5. RAG / Agente
6. API Debug
7. Release
```

En el panel izquierdo puedes cambiar de sección. En la parte superior puedes usar botones como:

```text
Anterior
Siguiente módulo
Iniciar demostración guiada
Probar backend
Modo Básico / Técnico / Experto
```

#### 4. Vista general

La sección **Vista general** sirve para presentar el proyecto.

Qué mostrar:

```text
Barra de estado global
Glosario técnico
Escenarios de presentación
Estado backend
Resumen de módulos
```

Explicación sugerida:

```text
Attention AI Lab es un panel full-stack para visualizar mecanismos de atención,
arquitecturas Transformer, estimación de KV cache, RAG visual, depuración de agentes,
MLLM e integración con backend FastAPI.
```

Estado esperado en la barra global:

```text
Backend: OK
API: /api/*
Runtime: determinístico
OpenAI API: no requerida
Listo para Docker
Pruebas: correctas
```

Si el backend aparece desconectado, revisa que la Terminal 1 siga ejecutando FastAPI.

#### 5. Modo Básico, Técnico y Experto

El panel permite cambiar el nivel de explicación:

```text
Básico
Técnico
Experto
```

##### Modo Básico

Explicaciones simples:

```text
La atención decide qué partes de una secuencia importan más.
```

##### Modo Técnico

Muestra conceptos y fórmulas:

```text
softmax(QKᵀ / √d)
causal mask
top-k sparsity
KV cache
```

##### Modo Experto

Muestra detalles de implementación:

```text
POST /api/attention/compute
request body
response body
latency
schema
payload JSON
```

Uso recomendado:

```text
Empieza en Básico para explicar la intuición.
Cambia a Técnico para explicar la teoría.
Usa Experto para mostrar API, JSON y endpoints.
```

#### 6. Demostración guiada

Presiona:

```text
Iniciar demostracion guiada
```

La demostración guiada recorre pasos como:

```text
Paso 1: InfoNCE imagen-texto
Paso 2: Atención causal de LLM
Paso 3: Atencion de ventana deslizante
Paso 4: GQA y KV Cache
Paso 5: RAG visual
Paso 6: Agent Debugger
```

Cada paso explica:

```text
Qué estás viendo,
Qué debes mover,
Qué debería pasar,
Cómo explicarlo.
```

Ejemplo de explicación:

```text
En atención causal, la matriz se vuelve triangular porque un token solo puede mirar
tokens anteriores o a sí mismo. Esto simula cómo un modelo tipo GPT genera texto.
```

#### 7. Laboratorio de atención

Sección:

```text
Atención
```

Qué incluye:

```text
Selector de modo
Matriz de atención interactiva
Encabezados de fila y columna
Inspector lateral
Controles contextuales
Interpretación automática
Botones de copiar explicación y payload JSON
```

#### 7.1. Leer la matriz de atención

La matriz se interpreta así:

```text
Fila    = token que pregunta
Columna = token atendido
Celda   = probabilidad de atención
```

Ejemplo:

```text
Token 5 atiende a Token 2 con probabilidad 38.4%.
```

Haz clic en una celda para abrir el inspector lateral.

El inspector muestra:

```text
Fila seleccionada
Columna seleccionada
Probabilidad
Top conexiones de la fila
Interpretación del patrón actual
```

#### 7.2. Modos de atención disponibles

Puedes seleccionar modos como:

```text
InfoNCE imagen-texto
Self-attention completa
Atención causal de LLM
Sliding Window Attention
Atención dispersa Top-k
GQA conceptual
Cross-attention para MLLM
Atención sobre memoria de agente
```

#### 7.3. Ejemplo: InfoNCE imagen-texto

Selecciona:

```text
InfoNCE imagen-texto
```

Mueve:

```text
Temperatura
```

Prueba:

```text
0.20
1.00
```

Qué debe pasar:

```text
Temperatura baja -> probabilidad más concentrada.
Temperatura alta -> distribución más suave.
```

Explicación:

```text
InfoNCE premia el par correcto y aleja candidatos negativos.
Es común en entrenamiento contrastivo imagen-texto.
```

#### 7.4. Ejemplo: Atención causal de LLM

Selecciona:

```text
Atención causal de LLM
```

Qué observar:

```text
La matriz se vuelve triangular.
Los tokens futuros quedan bloqueados.
```

Explicación:

```text
Un LLM autoregresivo no puede mirar tokens futuros porque genera texto paso a paso.
```

#### 7.5. Ejemplo: Atención de ventanas deslizantes

Selecciona:

```text
Atencion de ventana deslizante
```

Mueve:

```text
Ventana
```

Prueba:

```text
Ventana = 1
Ventana = 3
Ventana = 5
```

Qué debe pasar:

```text
Con ventana pequeña, cada token mira pocos vecinos.
Con ventana grande, cada token mira más contexto local.
```

Explicación:

```text
Sliding Window reduce costo porque evita que todos los tokens atiendan a todos los demás.
```

#### 7.6. Ejemplo: Atención Top-k

Selecciona:

```text
Atención dispersa Top-k
```

Mueve:

```text
Top-k
```

Prueba:

```text
Top-k = 1
Top-k = 3
Top-k = 6
```

Qué debe pasar:

```text
Con Top-k bajo, sobreviven pocas conexiones.
Con Top-k alto, se conservan más relaciones.
```

Explicación:

```text
Top-k conserva solo las relaciones más fuertes y simula atención dispersa.
```

#### 7.7. Ejemplo: GQA conceptual

Selecciona:

```text
GQA conceptual
```

Configura:

```text
Query heads = 8
KV heads = 2
```

Explicación:

```text
GQA mantiene varias query heads, pero reduce la cantidad de key/value heads.
Esto disminuye la memoria necesaria para KV cache durante inferencia.
```

#### 8. Presets de presentación

Arriba del panel hay escenarios rápidos:

```text
Demostración rápida
Comparar MHA vs GQA
Contexto largo
RAG con evidencia
Agente con herramientas
MLLM imagen-texto
```

#### 8.1. Demostración rápida


```text
Recorre el flujo básico: concepto, matriz, probabilidades e interpretación.
```

Uso:

```text
Presiona Demostración rápida.
Luego ve a Atención.
```

##### 8.2. Comparar MHA vs GQA

Configura automáticamente:

```text
Modo: GQA
Query heads: 8
KV heads: 2
Context length: 32768
Batch: 4
```


```text
Compara memoria aproximada entre MHA, GQA y MLA.
```

Uso recomendado:

```text
Presiona Comparar MHA vs GQA.
Ve a Costo LLM.
Muestra el panel comparativo y las barras de KV cache.
```

#### 8.3. Contexto largo

Configura:

```text
Modo: Sliding Window Attention
Tokens: 12
Ventana: 2
Context length: 65536
```


```text
Muestra cómo se controla el costo en secuencias largas.
```

#### 8.4. RAG con evidencia


```text
Revisa el módulo RAG, indexa documentos, consulta top-k y muestra evidencias.
```

Uso:

```text
Presiona RAG con evidencia.
Ve a RAG / Agente.
Ejecuta Indexar documentos y Consultar RAG.
```


#### 8.5. Agente con herramientas


```text
Muestra tool tracing, groundedness y timeline del agente.
```

Uso:

```text
Presiona Agente con herramientas.
Ve a RAG / Agente.
Ejecuta Depurar agente.
```

#### 8.6. MLLM imagen-texto

```text
Muestra alineación imagen-texto usando InfoNCE.
```

Uso:

```text
Presiona MLLM imagen-texto.
Ve al módulo MLLM.
Edita candidatos y calcula alineación imagen-texto.
```

#### 9. Constructor Transformer

Sección:

```text
Arquitectura
```

Qué incluye:

```text
Controles de arquitectura
Bloques visuales de capas
SWA + GQA
MLA
Atención plena controlada
RoPE
Gating
JSON técnico colapsado
Copiar JSON
Validar en backend
```

#### 9.1. Agregar un bloque

Configura:

```text
Tipo de atención: GQA
Número de capas: 12
Dimensión: 768
Query heads: 8
KV heads: 2
Repeat: 6
```

Presiona:

```text
Agregar bloque
```

Debe aparecer una tarjeta como:

```text
Bloque de capa 1
GQA
Reduce KV cache compartiendo keys/values entre grupos de query heads.
Repeat: 6
Heads: 8
KV heads: 2
```

#### 9.2. Agregar SWA + GQA

Configura:

```text
Tipo de atención: SWA + GQA
Window size: 1024
Repeat: 6
```

Presiona:

```text
Agregar bloque
```

Explicación:

```text
SWA limita la atención a una ventana local, mientras GQA reduce memoria de KV cache.
```

#### 9.3. Agregar MLA

Configura:

```text
Tipo de atención: MLA
MLA compression rank: 128
Repeat: 4
```

Presiona:

```text
Agregar bloque
```

Explicación:

```text
MLA comprime representaciones latentes para reducir costo de memoria.
```

#### 9.4. Mostrar JSON técnico

Presiona:

```text
Mostrar JSON técnico
```

Luego puedes usar:

```text
Copiar JSON
Validar en backend
```

Explicación:

```text
El JSON representa el contrato de arquitectura que el backend puede validar.
```

#### 10. Estimador LLM/KV Cache

Sección:

```text
Costo LLM
```

Qué incluye:

```text
KV cache MHA aproximado
KV cache GQA aproximado
KV cache MLA aproximado
Gráfico de barras
Longitud de contexto vs KV cache
Panel comparativo MHA/GQA/MLA
Costo relativo
Tokens/s estimados
```

#### 10.1. Comparar MHA, GQA y MLA

Usa el preset:

```text
Comparar MHA vs GQA
```

Luego revisa:

```text
Panel comparativo
Barras de KV cache
Tokens/s estimados
```

Explicación:

```text
MHA usa una cantidad completa de heads para keys y values.
GQA reduce memoria al compartir key/value heads.
MLA reduce más al usar compresión latente.
```

#### 10.2. Probar contexto largo

Mueve:

```text
Longitud contexto
```

Prueba:

```text
8192
32768
65536
131072
```

Qué debe pasar:

```text
La KV cache aumenta al crecer la longitud de contexto.
```

Explicación:

```text
Al duplicar el contexto, el almacenamiento de keys/values aumenta de forma fuerte.
Por eso los modelos modernos usan GQA, MLA o atención por ventana.
```

#### 10.3. Probar batch size

Mueve:

```text
Batch size
```

Prueba:

```text
1
4
8
```

Qué debe pasar:

```text
El costo de memoria aumenta cuando se procesan más secuencias en paralelo.
```

#### 11. MLLM imagen-texto

El módulo MLLM permite simular alineación imagen-texto usando InfoNCE.

Campos principales:

```text
Imagen simulada
Candidatos de texto
Temperatura InfoNCE
Calcular alineación imagen-texto
```

#### 11.1. Ejemplo de candidatos

Imagen simulada:

```text
perro jugando con pelota
```

Candidatos:

```text
1. Un perro juega con una pelota
2. Una receta de pasta con tomate
3. Una ciudad de noche con autos
4. Un documento sobre atención causal
```

Presiona:

```text
Calcular alineación imagen-texto
```

Resultado esperado:

```text
Mejor par: Imagen 1 + Texto 1
Probabilidad alta para el candidato correcto
Ranking de candidatos
```

Explicación:

```text
InfoNCE aumenta la probabilidad del par correcto y reduce la probabilidad de negativos.
Esto representa el principio usado en entrenamiento contrastivo imagen-texto.
```

#### 12. RAG + Agent Debugger

Sección:

```text
RAG / Agente
```

Orden recomendado:

```text
1. Indexar documentos
2. Consultar RAG
3. Depurar agente
4. Copiar timeline
```

#### 12.1. Indexar documentos

Presiona:

```text
Indexar documentos
```

Qué ocurre:

```text
Los documentos de ejemplo se cargan para recuperación.
```

Explicación:

```text
Esta etapa simula el paso de ingesta en un sistema RAG.
```


#### 12.2. Consultar RAG

Presiona:

```text
Consultar RAG
```

La UI debe mostrar documentos recuperados con:

```text
Score total
Score semántico
Score léxico
Cita visual
Explicación de recuperación
```

Explicación:

```text
El sistema recupera documentos usando similitud semántica y coincidencia léxica.
Top-k define cuántos documentos se devuelven como evidencia.
```

#### 12.3. Depurar el agente

Presiona:

```text
Depurar agente
```

Debe aparecer un timeline:

```text
1. Recibe pregunta
2. Genera consulta RAG
3. Recupera documentos
4. Usa herramienta simulada
5. Produce respuesta
6. Evalúa groundedness
```

Cada paso muestra:

```text
Entrada
Acción
Salida
Latencia
Estado
Evidencia usada
```

Explicación:

```text
El timeline permite auditar qué hizo el agente, qué documentos recuperó,
qué herramienta usó y qué tan respaldada está su respuesta.
```

#### 12.4. Copiar timeline

Presiona:

```text
Copiar timeline
```

Uso:

```text
Pegar la traza en README, documentación técnica o reporte de la demostración.
```

#### 13. Backend / API

Sección:

```text
API Debug
```

El módulo funciona como una consola visual FastAPI.

Incluye:

```text
Endpoint seleccionado
Estado
Latencia
Request
Response
Interpretación
Errores comunes
Copiar request JSON
Copiar response
Copiar curl
```


#### 13.1. Probar conexión backend

Presiona:

```text
Probar conexión backend
```

Llama a:

```text
GET /api/health
```

Resultado esperado:

```text
Estado: OK
Latencia: algunos ms
Response JSON con status ok
```

#### 13.2. Atención API

Presiona:

```text
Atención API
```

Llama a:

```text
POST /api/attention/compute
```

Qué muestra:

```text
Request JSON
Response JSON
Interpretación del cálculo
Errores comunes
```

Explicación:

```text
El frontend envía una configuración de atención y el backend devuelve scores,
probabilidades, máscara y métricas.
```


#### 13.3. Validar arquitectura

Presiona:

```text
Validar arquitectura
```

Llama a:

```text
POST /api/architecture/validate
```

Explicación:

```text
El backend valida si una arquitectura Transformer tiene parámetros consistentes.
```

#### 13.4. Estimar LLM

Presiona:

```text
Estimar LLM
```

Llama a:

```text
POST /api/llm/estimate
```

Explicación:

```text
Calcula métricas didácticas de KV cache, costo relativo, memoria y tokens/s estimados.
```

#### 13.5. Batch InfoNCE

Presiona:

```text
Batch InfoNCE
```

Llama a:

```text
POST /api/mllm/contrastive-batch
```

Explicación:

```text
Simula un batch contrastivo con pares positivos y negativos.
```

#### 13.6. Traza de agente

Presiona:

```text
Traza agente
```

Llama a:

```text
POST /api/agents/debug
```

Explicación:

```text
Devuelve una traza del agente con pasos, herramientas, evidencias y groundedness.
```

#### 14. Publicación / Lanzamiento

Sección:

```text
Release
```

Muestra:

```text
Preparación para Hugging Face Docker Spaces
Docker
API
UI
Escalabilidad
Checklist de publicación
Tests
Ejemplos JSON
README
Screenshots
```

Abre:

```text
Ver checklist de publicación
```

Explicación:

```text
Esta sección resume el estado de entrega del proyecto y confirma que está preparado
para GitHub, Docker y Hugging Face Spaces.
```

#### 15. Ejecución integrada con FastAPI

También puedes correr el frontend compilado desde FastAPI, igual que en Docker.

```bash
npm --prefix apps/web run build
export ATTENTIONLAB_STATIC_DIR="$PWD/apps/web/dist"
PYTHONPATH=apps/api uvicorn app.main:app --host 0.0.0.0 --port 7860
```

Abre:

```text
http://localhost:7860
```

En este modo:

```text
/        -> frontend React compilado
/api/*   -> backend FastAPI
/docs    -> Swagger/OpenAPI
```

#### 16. Ejecución con Docker

Construye la imagen:

```bash
docker build -t attentio-ai-lab:v1.2.0 .
```

Ejecuta la imagen:

```bash
docker run --rm -p 7860:7860 attentio-ai-lab:v1.2.0
```

Abre la dirección:

```text
http://localhost:7860
```

Valida lo avanzado:

```text
http://localhost:7860/api/health
http://localhost:7860/docs
```

#### 17. Problemas comunes detectados

#### 17.1. Backend desconectado

Síntoma:

```text
Backend desconectado
API error
```

Solución:

```bash
cd attentio-ai-lab
source .atencion/bin/activate
PYTHONPATH=apps/api uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verifica:

```bash
curl http://localhost:8000/api/health
```

#### 17.2. Frontend no abre

Síntoma:

```text
http://localhost:5173 no responde
```

Solución:

```bash
npm --prefix apps/web run dev
```

#### 17.3. Error 404 en /api/attention/compute

Causas posibles:

```text
Backend apagado
Proxy de Vite no activo
Frontend abierto desde archivo local
FastAPI corriendo en puerto incorrecto
```

Solución:

```bash
curl http://localhost:8000/api/health
```

Luego abre el frontend desde:

```text
http://localhost:5173
```

No abras directamente `index.html` desde el explorador de archivos.


#### 17.4. npm ci demora o falla

Verifica Node:

```bash
node -v
npm -v
```

Recomendado:

```text
Node 22 LTS
```

Fuerza registry público:

```bash
npm config set registry https://registry.npmjs.org/
```

Reinstala:

```bash
rm -rf apps/web/node_modules
npm --prefix apps/web ci --no-audit --no-fund
```

#### 17.5. Python incorrecto

Verifica:

```bash
python --version
which python
```

Con `.atencion` activo debe apuntar a:

```text
.atencion/bin/python
```


### Uso rápido con Docker

Attention AI Lab puede ejecutarse como una demo local reproducible sin GPU ni API keys.

```bash
docker build -t attentio-ai-lab:v1.2.0 .
docker run --rm -p 7860:7860 attentio-ai-lab:v1.2.0
```

Abrir en el navegador:

```text
http://localhost:7860
```

Validar el backend:

```bash
curl http://localhost:7860/api/health
```

#### Flujo mínimo de demostración

1. Abrir la interfaz principal.
2. Verificar el estado del backend.
3. Probar el laboratorio de atención.
4. Probar el estimador de KV Cache.
5. Probar el Agent Debugger.
6. Revisar la consola API si se desea copiar payloads.

### Vista rápida con GIFs

#### Flujos visuales incluidos

La Fase 2.1 agrega GIFs de demostración para revisar los flujos principales sin ejecutar comandos adicionales.

```text
assets/gifs/kv-cache-estimator.gif
assets/gifs/agent-debugger.gif
assets/gifs/transformer-builder.gif
```

#### Uso en README

Los GIFs se muestran en el README para explicar rápidamente el valor de Attention AI Lab:

- Estimar memoria de KV Cache.
- Depurar agentes con timeline.
- Diseñar bloques Transformer.
