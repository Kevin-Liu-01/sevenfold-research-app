#!/bin/bash

set -e  # Exit on any error

echo "Installing root dependencies..."
pnpm install



echo "Setting up apps/www..."
cd apps/www
pnpm install next

if [ ! -f ".env" ]; then
  echo "Warning: .env file is missing in apps/www"
else
  echo "Found .env in apps/www"
fi
cd ../.. 



echo "Setting up apps/webapp..."
cd apps/webapp

if [ ! -f ".env" ]; then
  echo "Warning: .env file is missing in apps/webapp"
else
  echo "Found .env in apps/webapp"
fi
cd ../..



echo "Setting up apps/api..."
cd apps/api

if [ ! -d ".venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate

if [ -f "requirements.txt" ]; then
  echo "Installing Python dependencies..."
  pip install -r requirements.txt
else
  echo "Warning: requirements.txt not found"
fi

if [ ! -f ".env" ]; then
  echo "Warning: .env file is missing in apps/api"
else
  echo "Found .env in apps/api"
fi

deactivate
cd ../..



echo "✅ Setup complete!"
