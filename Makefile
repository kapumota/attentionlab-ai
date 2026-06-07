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

validate-hf-space:
	bash scripts/validate-hf-space.sh

test:
	PYTHONPATH=apps/api pytest apps/api/tests -q
