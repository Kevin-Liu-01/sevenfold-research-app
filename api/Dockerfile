# Start with an official Python image
FROM python:3.11

# Set the working directory inside the container
WORKDIR /code

ENV PYTHONPATH=/code

# Copy your requirements file and install dependencies
COPY api/requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy your application code into the container
COPY api/ /code/api/
COPY schema/ /code/schema

EXPOSE 8080

# Command to run your application
# The --host 0.0.0.0 is crucial for it to be accessible inside the container
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]
