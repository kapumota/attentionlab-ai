### Tutorial 3 - LLM playground

Sirve para comparar costos de memoria y contexto largo.

1. Sube la longitud de contexto.
2. Compara KV cache MHA vs GQA.
3. Ajusta `KV heads` y observa la reducción.
4. Ajusta `MLA rank` y compara MLA vs GQA.
5. Observa tokens/s estimados y costo long-context.

Interpretación: GQA reduce claves/valores compartiendo KV heads; MLA comprime la representación cacheada.
