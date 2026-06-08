### Instalación local de Attention AI Lab

Esta guía instala el proyecto en modo desarrollo local usando `pyenv`, Python 3.10/3.11, entorno virtual `.atencion` y Node 22.

#### Requisitos

- Linux, macOS o WSL.
- `pyenv` instalado.
- Python 3.10 o 3.11 disponible en `pyenv`.
- `nvm` instalado para manejar Node.
- Node.js `^20.19.0` o `>=22.12.0`; recomendado Node 22.
- Docker opcional.

#### Versión recomendada de Python

Recomendado para desarrollo local:

```text
Python 3.10.x o Python 3.11.x
```

Docker usa:

```text
python:3.11-slim
```

Python 3.12 puede funcionar, pero se debe validar con la suite de pruebas antes de declararlo oficialmente compatible.

#### Terminal 0: preparación

Desde la raíz del proyecto:

```bash
cd attentio-ai-lab
```

Verifica la estructura:

```bash
ls
```

Debes ver:

```text
apps
docs
examples
scripts
Dockerfile
docker-compose.yml
README.md
```

#### 1. Configurar Python con pyenv

Lista versiones instaladas:

```bash
pyenv versions
```

Selecciona Python 3.10:

```bash
pyenv local 3.10.x
python --version
which python
```

Si prefieres alinearte con Docker:

```bash
pyenv local 3.11.x
python --version
```

#### 2. Crear entorno virtual `.atencion`

```bash
python -m venv .atencion
source .atencion/bin/activate
```

Verifica:

```bash
which python
python --version
```

Debe apuntar a:

```text
./.atencion/bin/python
```

#### 3. Instalar dependencias del backend

```bash
python -m pip install --upgrade pip
pip install -r apps/api/requirements-dev.txt
```

`requirements-dev.txt` incluye dependencias de ejecución y pruebas.

#### 4. Configurar Node y npm

```bash
nvm install 22
nvm use 22
node -v
npm -v
```

Asegura el registry público:

```bash
npm config set registry https://registry.npmjs.org/
npm config get registry
```

Debe responder:

```text
https://registry.npmjs.org/
```

#### 5. Instalar dependencias del frontend

```bash
npm --prefix apps/web ci --no-audit --no-fund
```

Usa `npm ci` porque instala de forma reproducible desde `package-lock.json`.

#### 6. Validar instalación

Con `.atencion` activado:

```bash
PYTHONPATH=apps/api pytest apps/api/tests -q
npm --prefix apps/web run check
bash scripts/validate-local.sh
```

Resultado esperado:

```text
Backend tests: passed
Frontend TypeScript: OK
Frontend build: OK
Validación local completada.
```

#### 7. Ejecutar en desarrollo local

Usa dos terminales.

#### Terminal 1: backend

```bash
cd attentio-ai-lab
source .atencion/bin/activate
PYTHONPATH=apps/api uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Abre:

```text
http://localhost:8000/api/health
http://localhost:8000/docs
```

#### Terminal 2: frontend

```bash
cd attentio-ai-lab
npm --prefix apps/web run dev
```

Abre:

```text
http://localhost:5173
```

#### 8. Ejecutar integrado en un solo puerto

```bash
npm --prefix apps/web run build
export ATTENTIONLAB_STATIC_DIR="$PWD/apps/web/dist"
PYTHONPATH=apps/api uvicorn app.main:app --host 0.0.0.0 --port 7860
```

Abre:

```text
http://localhost:7860
```

#### 9. Problemas comunes

#### npm tarda demasiado o da ETIMEDOUT

Revisa que no apunte a un registry interno:

```bash
grep -R "packages.applied-caas" apps/web/package-lock.json
grep -R "internal.api.openai.org" apps/web/package-lock.json
```

Si aparece algo, regenera el lockfile:

```bash
rm -rf apps/web/node_modules apps/web/dist
rm -f apps/web/package-lock.json
npm --prefix apps/web install --package-lock-only --registry=https://registry.npmjs.org/ --no-audit --no-fund
npm --prefix apps/web ci --no-audit --no-fund
```

#### EBADENGINE en Vite

Actualiza Node:

```bash
nvm install 22
nvm use 22
```

#### Backend desconectado en frontend

Verifica:

```bash
curl http://localhost:8000/api/health
```

Si falla, vuelve a iniciar FastAPI en Terminal 1.

#### 10. Archivos que no se suben

```text
.atencion/
apps/web/node_modules/
apps/web/dist/
__pycache__/
.pytest_cache/
.env
```
