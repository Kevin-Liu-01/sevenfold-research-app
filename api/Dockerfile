FROM python:3.11

# Set the working directory inside the container
WORKDIR /code

# Set PYTHONPATH so Python can find modules in the /code directory
ENV PYTHONPATH=/code

# Install Tectonic LaTeX engine for PDF compilation
# Using the binary installation method for reliability
RUN apt-get update && \
    apt-get install -y wget ca-certificates && \
    wget https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-unknown-linux-gnu.tar.gz && \
    tar -xzf tectonic-0.15.0-x86_64-unknown-linux-gnu.tar.gz && \
    mv tectonic /usr/local/bin/ && \
    rm tectonic-0.15.0-x86_64-unknown-linux-gnu.tar.gz && \
    chmod +x /usr/local/bin/tectonic && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
    
# Copy only the requirements file first to leverage Docker layer caching
COPY api/requirements.txt requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy your application and schema code into the container
# These paths are relative to the build context (the repo root)
COPY api/ /code/api/
COPY schema/ /code/schema/

WORKDIR /code/api

# Expose the port the app runs on
EXPOSE 8080

# Command to run your application
# The --host 0.0.0.0 is crucial for it to be accessible from outside the container
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]
