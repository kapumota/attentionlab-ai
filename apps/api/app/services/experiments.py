from __future__ import annotations

import hashlib
import json

from app.schemas import ExperimentListResponse, ExperimentRecord, ExperimentSaveResponse


class ExperimentStore:
    """Persistencia ligera en memoria para v0.5.

    El contrato permite migrar a SQLite/Postgres sin cambiar la UI.
    """

    def __init__(self) -> None:
        self.records: list[ExperimentRecord] = []

    def save(self, record: ExperimentRecord) -> ExperimentSaveResponse:
        raw = json.dumps(record.model_dump(), sort_keys=True, ensure_ascii=False)
        record_id = record.id or hashlib.sha1(raw.encode("utf-8")).hexdigest()[:12]
        stored = record.model_copy(update={"id": record_id})
        self.records = [item for item in self.records if item.id != record_id]
        self.records.append(stored)
        return ExperimentSaveResponse(
            id=record_id,
            total_experiments=len(self.records),
            message="Experimento guardado en memoria. En producción, conectar a almacenamiento persistente.",
        )

    def list(self) -> ExperimentListResponse:
        return ExperimentListResponse(experiments=self.records[-25:])


experiment_store = ExperimentStore()
