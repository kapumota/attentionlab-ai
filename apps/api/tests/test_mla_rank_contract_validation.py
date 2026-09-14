from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.schemas import LLMEstimateRequest


@pytest.mark.parametrize(
    ("dimension", "mla_rank"),
    [
        (64, 63),
        (4096, 512),
        (32768, 8192),
    ],
)
def test_mla_rank_estrictamente_menor_que_dimension_es_valido(
    dimension: int,
    mla_rank: int,
) -> None:
    request = LLMEstimateRequest(dimension=dimension, mla_rank=mla_rank)

    assert request.mla_rank < request.dimension


@pytest.mark.parametrize(
    ("dimension", "mla_rank"),
    [
        (64, 64),
        (64, 65),
        (4096, 4096),
    ],
)
def test_mla_rank_igual_o_mayor_que_dimension_se_rechaza(
    dimension: int,
    mla_rank: int,
) -> None:
    with pytest.raises(ValidationError, match="mla_rank debe ser menor que dimension"):
        LLMEstimateRequest(dimension=dimension, mla_rank=mla_rank)


def test_valores_por_defecto_respetan_el_contrato_latente() -> None:
    request = LLMEstimateRequest()

    assert request.mla_rank < request.dimension
