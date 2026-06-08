### Contratos compartidos

En v1.2.0 los contratos viven en `apps/api/app/schemas/contracts.py` y el OpenAPI se expone automáticamente en `/docs` y `/openapi.json`.

Para una una fase posterior se recomienda generar clientes TypeScript desde `/openapi.json` y colocarlos en este paquete.
