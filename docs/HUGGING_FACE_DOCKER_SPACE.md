### Publicación en Hugging Face Docker Spaces

Esta versión usa Docker Space.

El bloque YAML del `README.md` define:

```yaml
sdk: docker
app_port: 7860
```

El `Dockerfile` hace dos etapas:

1. Compila el frontend React/Vite.
2. Instala FastAPI y sirve `/api/*` + frontend estático desde un solo contenedor.

#### Subida

```bash
git init
git add .
git commit -m "Release v0.4 Real Models Docker Space"
git branch -M main
git remote add origin https://huggingface.co/spaces/TU_USUARIO/attentionlab-ai
git push -u origin main
```

#### Verificación esperada

- `/api/health` devuelve `status: ok`.
- `/docs` muestra Swagger/OpenAPI.
- `/` muestra la aplicación React.
