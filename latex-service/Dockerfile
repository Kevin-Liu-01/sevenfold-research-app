FROM --platform=linux/amd64 python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies required by Tectonic
# libgraphite2, libharfbuzz, libfontconfig, and other dependencies
RUN apt-get update && \
    apt-get install -y \
    wget \
    ca-certificates \
    libgraphite2-3 \
    libharfbuzz0b \
    libfontconfig1 \
    libfreetype6 \
    libpng16-16 \
    && rm -rf /var/lib/apt/lists/*

# Install Tectonic LaTeX engine for PDF compilation
# Using the binary installation method for reliability and smaller image size
RUN wget https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-unknown-linux-gnu.tar.gz && \
    tar -xzf tectonic-0.15.0-x86_64-unknown-linux-gnu.tar.gz && \
    mv tectonic /usr/local/bin/ && \
    rm tectonic-0.15.0-x86_64-unknown-linux-gnu.tar.gz && \
    chmod +x /usr/local/bin/tectonic

# Copy requirements and install dependencies
COPY latex-service/requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy application code
COPY latex-service/main.py .
COPY latex-service/latex_compiler.py .

# Expose the port the service runs on
EXPOSE 8081

# Health check to verify service is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8081/health')" || exit 1

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8081"]
