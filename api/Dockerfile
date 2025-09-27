FROM python:3.11

# Set the working directory inside the container
WORKDIR /code

# Set PYTHONPATH so Python can find modules in the /code directory
ENV PYTHONPATH=/code

# Copy only the requirements file first to leverage Docker layer caching
COPY api/requirements.txt requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy your application and schema code into the container
# These paths are relative to the build context (the repo root)
COPY api/ /code/api/
COPY schema/ /code/schema/

# Expose the port the app runs on
EXPOSE 8080

# Command to run your application
# The --host 0.0.0.0 is crucial for it to be accessible from outside the container
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]
