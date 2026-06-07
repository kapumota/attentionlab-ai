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

#### Nota

Si Docker no está instalado en el entorno, el script falla de forma explícita y no marca la validación como completada.
