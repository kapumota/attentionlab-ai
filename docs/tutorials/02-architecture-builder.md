### Tutorial 2 - Constructor de arquitecturas

Sirve para crear una arquitectura Transformer híbrida exportable como JSON.

1. Ajusta número de capas y dimensión.
2. Selecciona `GQA`, `SWA + GQA`, `MLA` o `Gated Full Attention`.
3. Ajusta `Window size`, `MLA rank`, `heads` y `KV heads`.
4. Activa o desactiva RoPE y gating.
5. Pulsa `Agregar bloque`.
6. Copia el JSON generado.

Ejemplo de patrón útil:

```json
{
  "layers": [
    {"type": "gqa"},
    {"type": "swa_gqa", "window": 1024},
    {"type": "mla", "compression_rank": 128},
    {"type": "gated_full_attention"}
  ],
  "repeat": 6
}
```
