### Fase 2 - Deploy cero fricción en Hugging Face Space

#### Objetivo

Publicar Attentio AI Lab como Docker Space para que una persona pueda probar el proyecto desde un enlace público, sin instalar dependencias locales, sin GPU y sin API keys.

#### Alcance

Esta fase cubre:

- Frontmatter de Hugging Face Spaces en `README.md`.
- Dockerfile compatible con puerto `7860`.
- Validación local de Docker.
- Validación pública del Space mediante script.
- Workflow manual para sincronizar GitHub con Hugging Face.
- Documentación de publicación y verificación end-to-end.

No cubre todavía:

- WebAssembly.
- Demo frontend-only.
- Métricas de uso.
- Modelos reales obligatorios.

#### Rama

```bash
git checkout main
git pull origin main
git checkout -b fase-2-deploy-hf-space
```

#### Validación local mínima

```bash
git diff --check
source .atencion/bin/activate
PYTHONPATH=apps/api python -m pytest apps/api/tests -q
npm --prefix apps/web run check
bash scripts/validate-docker.sh
```

#### Crear el Space

En Hugging Face:

```text
New Space
Owner: tu usuario u organización
Name: attentio-ai-lab
SDK: Docker
Visibility: Public
```

El README del repositorio ya incluye:

```yaml
sdk: docker
app_port: 7860
```

#### Publicación manual

Después de fusionar la fase en `main`:

```bash
git checkout main
git pull origin main
git remote add space https://huggingface.co/spaces/HF_USERNAME/attentio-ai-lab
git push --force space main
```

Si el remoto ya existe:

```bash
git remote set-url space https://huggingface.co/spaces/HF_USERNAME/attentio-ai-lab
git push --force space main
```

#### Validación pública

Cuando Hugging Face muestre el Space en estado `Running`, usa la URL directa de la app:

```bash
HF_SPACE_URL=https://HF_USERNAME-attentio-ai-lab.hf.space bash scripts/validate-hf-space.sh
```

El script valida:

- `/`
- `/api/health`
- `/docs`

#### Publicación con GitHub Actions

Configura en GitHub:

```text
Settings -> Secrets and variables -> Actions
```

Agrega:

```text
Secret: HF_TOKEN
Variable: HF_SPACE_ID=HF_USERNAME/attentio-ai-lab
```

Luego ejecuta manualmente:

```text
Actions -> Sync to Hugging Face Space -> Run workflow
```

#### Criterio de cierre

La fase se considera cerrada si se cumple:

```text
1. Docker build pasa localmente o en CI.
2. El contenedor responde en http://localhost:7860.
3. /api/health responde con status ok.
4. /docs carga Swagger/OpenAPI.
5. El Space público queda en Running.
6. scripts/validate-hf-space.sh pasa contra la URL directa del Space.
7. README contiene el enlace público real, no HF_USERNAME.
```

#### Capturas

Las capturas deben actualizarse después de verificar el Space real. Como mínimo:

```text
La evidencia visual antigua fue retirada. La referencia vigente es el Space público validado por URL.
```

No se debe reemplazar una captura por una imagen simulada. Si no hay acceso al navegador o al Space real, se deja la captura anterior y se documenta como pendiente.
