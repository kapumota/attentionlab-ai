### Quality Gate

#### Objetivo

Definir las condiciones mínimas para aceptar cambios en Attention AI Lab.

#### Criterios obligatorios

- El backend debe pasar la suite de Pytest.
- El frontend debe compilar con TypeScript y Vite.
- El árbol de trabajo no debe incluir caches, builds, entornos virtuales ni dependencias instaladas.
- La documentación no debe contener separadores formados por cuatro signos de igualdad ni guiones tipográficos largos.
- Se permite el delimitador `---` del front matter requerido por Hugging Face Spaces.
- El README debe conservar el enlace público del Hugging Face Space.
- Los cambios funcionales deben incluir pruebas o evidencia de validación.

#### Comando principal

```bash
make validate
```

#### Validación backend

```bash
PYTHONPATH=apps/api python -m pytest apps/api/tests -q
```

#### Validación frontend

```bash
npm --prefix apps/web ci --include=dev
npm --prefix apps/web run check
```

#### Validación documental

```bash
make validate-docs
```

La implementación canónica de esta comprobación se mantiene en el `Makefile` y en `.github/workflows/ci.yml`.

#### Validación del Space

```bash
HF_SPACE_URL=https://kapumota-attentio-ai-lab.hf.space bash scripts/validate-hf-space.sh
```

#### Limpieza antes del commit

```bash
rm -rf apps/web/node_modules
rm -rf apps/web/dist
rm -rf .pytest_cache
find . -type d -name "__pycache__" -prune -exec rm -rf {} +
find . -type f -name "*.pyc" -delete
find . -type f -name "*.pyo" -delete
rm -f *.patch
```
