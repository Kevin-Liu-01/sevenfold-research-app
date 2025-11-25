.PHONY: webapp www api api-setup latex-service latex-service-setup

webapp:
	cd webapp && pnpm dev --port 3001 --host

www:
	cd www && pnpm dev

api-setup:
	cd api && python3 -m venv venv || python -m venv venv
	cd api && . venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt

api:
	cd api && . venv/bin/activate && uvicorn main:app --reload --port 8000

latex-service:
	docker build -t latex-service ./latex-service && docker run -p 8001:8001 latex-service
