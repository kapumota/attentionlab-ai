.PHONY: web api docker test

web:
	npm --prefix apps/web run dev

api:
	PYTHONPATH=apps/api uvicorn app.main:app --host 0.0.0.0 --port 7860 --reload

docker:
	docker build -t attentionlab-ai:v1.0 .

test:
	PYTHONPATH=apps/api pytest apps/api/tests
