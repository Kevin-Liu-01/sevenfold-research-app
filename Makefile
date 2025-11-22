.PHONY: webapp www api

webapp:
	cd webapp && pnpm dev

www:
	cd www && pnpm dev

api:
	cd api && uvicorn api.main:app --reload --port 7000

