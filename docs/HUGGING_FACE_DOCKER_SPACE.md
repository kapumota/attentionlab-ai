### Publicación en Hugging Face Docker Spaces

Attention AI Lab usa Docker Space para servir el frontend compilado y la API FastAPI desde un único contenedor.

#### Configuración del Space

El bloque YAML al inicio de `README.md` define:

```yaml
sdk: docker
app_port: 7860
```

El `Dockerfile` hace dos etapas:

1. Compila el frontend React/Vite.
2. Instala FastAPI y sirve `/api/*` junto con el frontend estático desde el puerto `7860`.

#### Subida manual desde GitHub

Después de fusionar el PR de la fase en `main`:

```bash
git checkout main
git pull origin main
git remote add space https://huggingface.co/spaces/HF_USERNAME/attentio-ai-lab
git push --force space main
```

Si el remoto `space` ya existe:

```bash
git remote set-url space https://huggingface.co/spaces/HF_USERNAME/attentio-ai-lab
git push --force space main
```

#### Verificación esperada

- `/` muestra la aplicación React.
- `/api/health` devuelve `status: ok`.
- `/docs` muestra Swagger/OpenAPI.
- El panel no exige GPU ni API keys.

#### Validación automatizada

Usa la URL directa de la aplicación, no solo la página del repositorio del Space:

```bash
HF_SPACE_URL=https://HF_USERNAME-attentio-ai-lab.hf.space bash scripts/validate-hf-space.sh
```

#### Captura recomendada

Actualiza esta captura después de verificar el Space real:

```text
La evidencia visual antigua fue retirada. La referencia vigente es el Space público validado por URL.
```

No se debe reemplazar por una captura simulada.
