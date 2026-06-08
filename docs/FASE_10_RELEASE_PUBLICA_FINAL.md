### Fase 10 - Release pública final

#### Objetivo

Cerrar una versión pública presentable de Attention AI Lab como producto educativo y portfolio técnico.

#### Entregables

- `CHANGELOG.md`.
- `RELEASE_NOTES.md`.
- README final con identidad pública.
- Validación final local.
- Validación final del Hugging Face Space.
- Tag `v1.2.0`.
- GitHub Release.

#### Decisión de nombre

El producto se presenta como **Attention AI Lab**.

El repositorio conserva el nombre `attentionlab-ai` para mantener compatibilidad con enlaces, historial de PRs, badges, scripts y despliegues previos.

El Hugging Face Space conserva el slug histórico `https://kapumota-attentio-ai-lab.hf.space` porque ya está publicado y validado.

#### Validación requerida

```bash
git diff --check
make validate
HF_SPACE_URL=https://kapumota-attentio-ai-lab.hf.space make validate
```

#### Criterio de cierre

La fase se considera cerrada cuando:

- El PR de Fase 10 está fusionado en `main`.
- El Space público responde.
- El tag `v1.2.0` existe en GitHub.
- El GitHub Release está publicado.
- Las ramas de fase fueron limpiadas.
