.PHONY: web api docker docker-run validate-local validate-docker validate-hf-space test

web:
	npm --prefix apps/web run dev

api:
	PYTHONPATH=apps/api uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

docker:
	docker build -t attentio-ai-lab:v1.1.0-dev .

docker-run:
	docker run --rm -p 7860:7860 attentio-ai-lab:v1.1.0-dev

validate-local:
	bash scripts/validate-local.sh

validate-docker:
	bash scripts/validate-docker.sh

test:
	PYTHONPATH=apps/api pytest apps/api/tests -q

# Fase 7 - inicio
.PHONY: validate validate-backend validate-frontend validate-docs validate-hf-space

validate:
	bash scripts/validate-all.sh

validate-backend:
	PYTHONPATH=apps/api python -m pytest apps/api/tests -q

validate-frontend:
	npm --prefix apps/web ci --include=dev
	npm --prefix apps/web run check

validate-docs:
	git diff --check
	@if grep -RIn --exclude-dir=node_modules --exclude-dir=.venv --exclude-dir=.atencion --exclude-dir=.git --exclude-dir=dist --exclude-dir=__pycache__ "====\|—\|–" README.md docs packages/shared-contracts/openapi-notes.md; then echo "Documentación con separadores o guiones no permitidos."; exit 1; fi

validate-hf-space:
	bash scripts/validate-hf-space.sh
# Fase 7 - fin
