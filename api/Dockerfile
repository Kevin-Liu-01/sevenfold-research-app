# Start with an official Python image
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /api

# Copy your requirements file and install dependencies
COPY ./requirements.txt /api/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /api/requirements.txt

# Copy your application code into the container
COPY . /api/

EXPOSE 8080

# Command to run your application
# The --host 0.0.0.0 is crucial for it to be accessible inside the container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
