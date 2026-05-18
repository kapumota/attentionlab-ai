from __future__ import annotations

from app.schemas import ArchitectureSpec, ArchitectureValidationResponse


def validate_architecture(spec: ArchitectureSpec) -> ArchitectureValidationResponse:
    warnings: list[str] = []

    if spec.kv_heads > spec.heads:
        warnings.append("kv_heads no debería ser mayor que heads; se normalizó al valor de heads.")
        spec.kv_heads = spec.heads

    if spec.dimension % spec.heads != 0:
        warnings.append("dimension no es divisible entre heads; algunas implementaciones requerirán ajuste.")

    if not spec.layers:
        warnings.append("La arquitectura no tiene bloques; agrega al menos una capa para simular un stack real.")

    for idx, block in enumerate(spec.layers):
        if block.type == "swa_gqa" and not block.window:
            warnings.append(f"Bloque {idx + 1}: swa_gqa debería definir window.")
        if block.type == "mla" and not block.compression_rank:
            warnings.append(f"Bloque {idx + 1}: mla debería definir compression_rank.")
        if block.type == "sparse_topk" and not block.top_k:
            warnings.append(f"Bloque {idx + 1}: sparse_topk debería definir top_k.")

    return ArchitectureValidationResponse(valid=len([w for w in warnings if "debería" not in w]) == 0, warnings=warnings, normalized=spec)
