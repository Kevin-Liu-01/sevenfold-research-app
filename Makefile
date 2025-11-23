.PHONY: webapp www api api-setup

webapp:
	cd webapp && pnpm dev

www:
	cd www && pnpm dev

api-setup:
	cd api && python3 -m venv venv || python -m venv venv
	cd api && . venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt

api:
	cd api && . venv/bin/activate && uvicorn main:app --reload --port 7000

