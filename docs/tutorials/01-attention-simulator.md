### Tutorial 1 - Simulador de atención

Sirve para entender cómo una matriz de similitud se transforma en una distribución de atención.

1. Selecciona `InfoNCE imagen-texto`.
2. Cambia la temperatura τ.
3. Observa cómo el softmax concentra o dispersa probabilidad.
4. Cambia a `Atención causal de LLM`.
5. Verifica que los tokens futuros queden bloqueados.
6. Cambia a `Sliding Window Attention` y ajusta la ventana.
7. Cambia a `Atención dispersa Top-k` y ajusta `Top-k`.

Resultado esperado: comprender la relación `puntajes -> máscara -> softmax -> probabilidad`.
