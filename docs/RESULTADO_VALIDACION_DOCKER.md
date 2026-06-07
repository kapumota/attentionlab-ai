### Resultado de validación Docker

Release técnica documentada: Attentio AI Lab v1.1.0-dev

#### Estado

Este archivo debe actualizarse después de ejecutar Docker en una máquina con Docker disponible.

En el entorno de generación anterior no se pudo ejecutar Docker porque Docker no estaba instalado o no estaba disponible en `PATH`.

Salida esperada cuando Docker no está disponible:

```text
Docker no está instalado o no está disponible en PATH.
```

#### Comando oficial de validación

```bash
bash scripts/validate-docker.sh
```

#### Validación manual equivalente

```bash
docker build -t attentio-ai-lab:v1.1.0-dev .
docker run --rm -p 7860:7860 attentio-ai-lab:v1.1.0-dev
curl http://localhost:7860/api/health
```

#### Criterio para marcar como aprobado

Marca la validación Docker como aprobada solo si se cumple:

```text
1. docker build termina sin errores.
2. docker run levanta el contenedor.
3. http://localhost:7860 responde con el frontend.
4. http://localhost:7860/api/health devuelve status ok.
5. http://localhost:7860/docs carga Swagger/OpenAPI.
```

#### Resultado local del usuario

Completar después de ejecutar:

```text
Docker disponible: pendiente
Build: pendiente
Run: pendiente
Health check: pendiente
Frontend: pendiente
Docs: pendiente
Resultado final: pendiente
```