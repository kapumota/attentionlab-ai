### Validación Docker

La imagen está diseñada para Hugging Face Docker Spaces y expone el puerto `7860`.

#### Construcción

```bash
docker build -t attentio-ai-lab:v1.1.0-dev .
```

#### Ejecución

```bash
docker run --rm -p 7860:7860 attentio-ai-lab:v1.1.0-dev
```

#### Validación automática

```bash
bash scripts/validate-docker.sh
```

El script comprueba:

1. Docker disponible.
2. Build de imagen.
3. Arranque del contenedor.
4. Health check en `http://localhost:7860/api/health`.
5. Carga del frontend en `http://localhost:7860/`.
6. Carga de Swagger/OpenAPI en `http://localhost:7860/docs`.

#### Nota

Si Docker no está instalado en el entorno, el script falla de forma explícita y no marca la validación como completada.

#### Validación equivalente al Space

La validación Docker local debe aproximar el comportamiento del Space:

```text
Docker local -> puerto 7860 -> frontend + API + docs
```

Si esta validación falla, no se debe publicar todavía en Hugging Face.
