# LaTeX Compiler Microservice

A standalone microservice for compiling LaTeX documents to PDF using the Tectonic engine.

## Features

- **Fast LaTeX Compilation**: Uses Tectonic engine for quick, modern LaTeX compilation
- **REST API**: Simple HTTP endpoints for compilation requests
- **Health Checks**: Built-in health monitoring
- **Asset Support**: Handle images, bibliography files, and other LaTeX assets
- **Docker Ready**: Containerized with optimized Dockerfile
- **Error Handling**: Detailed compilation error messages

## API Endpoints

### `GET /health`

Health check endpoint that verifies the service and Tectonic are running.

**Response:**

```json
{
  "status": "healthy",
  "tectonic_available": true,
  "version": "1.0.0"
}
```

### `POST /compile`

Compile LaTeX source code to PDF.

**Request Body:**

```json
{
  "tex_content": "\\documentclass{article}\\begin{document}Hello World\\end{document}",
  "assets": null,
  "timeout": 30
}
```

**Response:** PDF file (`application/pdf`)

**Error Response:**

```json
{
  "detail": "LaTeX compilation failed:\n=== Compilation Errors ===\n..."
}
```

## Running Locally

### Prerequisites

- Python 3.11+
- Tectonic LaTeX engine

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run the Service

```bash
python main.py
```

The service will start on `http://localhost:8081`

## Running with Docker

### Build the Image

```bash
docker build -t latex-service:latest .
```

### Run the Container

```bash
docker run -d -p 8081:8081 --name latex-service latex-service:latest
```

### Test the Service

```bash
# Health check
curl http://localhost:8081/health

# Compile LaTeX (using example.tex file)
# Method 1: Using jq (recommended - handles escaping properly)
curl -X POST http://localhost:8081/compile \
  -H "Content-Type: application/json" \
  -d "$(jq -n --rawfile tex example.tex '{"tex_content": $tex}')" \
  --output test.pdf

# Method 2: Alternative without jq (requires Python)
curl -X POST http://localhost:8081/compile \
  -H "Content-Type: application/json" \
  -d "$(python3 -c "import json, sys; print(json.dumps({'tex_content': open('example.tex').read()}))")" \
  --output test.pdf
```

## Integration with Main API

Update the main API's compose router to call this microservice:

```python
# In api/routes/compose_router.py
import httpx

LATEX_SERVICE_URL = os.getenv("LATEX_SERVICE_URL", "http://localhost:8081")

@router.post("/compile-latex/{composition_id}")
async def compile_latex(composition_id: str, authorization: str = Header(...)):
    # ... get composition and verify access ...

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{LATEX_SERVICE_URL}/compile",
            json={"tex_content": tex_content, "timeout": 30}
        )

        if response.status_code == 200:
            return Response(
                content=response.content,
                media_type="application/pdf"
            )
        else:
            raise HTTPException(status_code=400, detail=response.json()["detail"])
```

## Environment Variables

- `PORT`: Service port (default: 8081)
- `LOG_LEVEL`: Logging level (default: INFO)

## Architecture Benefits

- **Scalability**: Scale LaTeX compilation independently from main API
- **Isolation**: Compilation failures don't affect main API
- **Resource Management**: Dedicate resources to computation-heavy LaTeX compilation
- **Deployment**: Deploy on separate infrastructure or serverless functions
