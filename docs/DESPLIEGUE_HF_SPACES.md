### Despliegue en Hugging Face Spaces

Attentio AI Lab  está preparado para publicarse como **Hugging Face Docker Space**.

#### 1. Requisitos

- Cuenta en Hugging Face.
- Git instalado.
- Repositorio local limpio.
- `README.md` con frontmatter de Docker Space.
- `Dockerfile` en la raíz del repo.
- Opcional: token `HF_TOKEN` si se usará GitHub Actions.

#### 2. Frontmatter del README

El `README.md` debe empezar con:

```yaml
---
title: Attentio AI Lab v1.1.0-dev
emoji: 🧠
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 7860
fullWidth: true
short_description: Laboratorio visual de atención, Transformers, LLMs, MLLMs, RAG y Agent Debugger.
---
```

`Hugging Face Spaces` usa `sdk: docker` para construir el `Dockerfile`, y `app_port: 7860` indica el puerto que expondrá la app.

#### 3. Crear el Space

En Hugging Face:

```text
New Space
SDK: Docker
Name: attentio-ai-lab
Visibility: Public o Private
```

#### 4. Publicación manual

Desde la raíz del proyecto:

```bash
git init
git add .
git commit -m "Release v1.1.0-dev"
git branch -M main
git remote add space https://huggingface.co/spaces/HF_USERNAME/attentio-ai-lab
git push --force space main
```

Reemplaza `HF_USERNAME` por tu usuario u organización de Hugging Face.

#### 5. Publicación desde GitHub Actions

El repo puede usar:

```text
.github/workflows/sync-to-hf-space.yml
```

Pasos:

1. Crea un token de Hugging Face con permiso de escritura.
2. En GitHub, ve a `Settings`.
3. Abre `Secrets and variables`.
4. Crea el secret `HF_TOKEN`.
5. Edita el workflow y reemplaza `HF_USERNAME/attentio-ai-lab` por tu Space real.
6. Ejecuta el workflow manualmente si está configurado con `workflow_dispatch`.

#### 6. Qué construye Hugging Face

El Space ejecuta el `Dockerfile`:

```text
Etapa 1: Node compila apps/web
Etapa 2: Python instala apps/api
Etapa 2: copia frontend compilado a /app/static
Etapa 2: levanta uvicorn en puerto 7860
```

Resultado:

```text
/               frontend React compilado
/api/*          backend FastAPI
/docs           Swagger/OpenAPI
/api/health     health check
```

#### 7. Verificación del Space

Cuando el Space esté en estado `Running`, verifica:

```text
/
/api/health
/api/models/runtime
/api/rag/status
/docs
```

Respuesta esperada para health:

```json
{
  "status": "ok"
}
```

#### 8. Errores comunes

##### Build falla en npm

Revisa que `apps/web/package-lock.json` no apunte a un registry privado:

```bash
grep -R "packages.applied-caas" apps/web/package-lock.json
grep -R "internal.api.openai.org" apps/web/package-lock.json
```

##### El Space abre pero no carga la app

Revisa que el Dockerfile copie:

```dockerfile
COPY --from=web-build /build/dist /app/static
```

Y que exista:

```dockerfile
ENV ATTENTIONLAB_STATIC_DIR=/app/static
```

##### La API no responde

Revisa que el contenedor use:

```dockerfile
EXPOSE 7860
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
```

#### 9. Archivos necesarios

Deben subirse:

```text
README.md
Dockerfile
apps/web/package.json
apps/web/package-lock.json
apps/web/src/
apps/api/requirements.txt
apps/api/app/
docs/
examples/
scripts/
```

No subir:

```text
.atencion/
apps/web/node_modules/
apps/web/dist/
.env
__pycache__/
.pytest_cache/
```