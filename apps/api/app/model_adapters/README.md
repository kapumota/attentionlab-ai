# Model adapters para v0.5

Esta carpeta queda preparada para conectar modelos reales en la versión v0.5.

Adaptadores previstos:

- `transformers_local.py`: inferencia local con Transformers/PyTorch.
- `onnx_runtime.py`: inferencia con ONNX Runtime.
- `external_api.py`: cliente para endpoints externos compatibles.
- `mock.py`: adaptador ligero para tests y demo.

En v0.5 los modelos reales se ejecutan preferentemente en navegador con Transformers.js/ONNX. El backend puede activar Python Transformers de forma opcional.
