### Release Checklist

#### Objetivo

Definir el checklist mínimo para publicar una versión presentable de Attentio AI Lab.

#### Antes del PR

- La rama parte de `main` actualizado.
- El árbol de trabajo estaba limpio antes de iniciar la fase.
- Los cambios están acotados al objetivo de la fase.
- No se versionan caches, builds, dependencias instaladas ni entornos virtuales.
- La documentación usa títulos ### y subtítulos ####.
- No hay guiones largos ni separadores no deseados.

#### Validación local

```bash
make validate
```

#### Validación pública

```bash
HF_SPACE_URL=https://kapumota-attentio-ai-lab.hf.space bash scripts/validate-hf-space.sh
```

#### Antes del merge

- El PR tiene resumen técnico.
- El PR lista comandos de validación ejecutados.
- Los checks de GitHub Actions están verdes.
- No hay conflictos con `main`.
- El README mantiene enlace a demo pública.
- Los límites del proyecto siguen declarados.

#### Después del merge

- Actualizar `main` local.
- Borrar rama local de fase.
- Borrar rama remota de fase.
- Republicar Hugging Face Space si la fase cambia README, frontend, backend o endpoints públicos.
- Validar `/api/health`.
- Validar `/docs`.
- Validar manualmente módulos principales.

#### Criterio de release pública

Una versión puede etiquetarse si cumple:

- Demo pública funcional.
- Backend validado.
- Frontend validado.
- README narrativo actualizado.
- Quality gate documentado.
- Changelog o release notes preparados.
