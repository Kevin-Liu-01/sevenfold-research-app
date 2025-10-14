#!/bin/bash

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Process IDs
WWW_PID=""
WEBAPP_PID=""
API_PID=""

# Helper functions
print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

print_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

print_service() {
    echo -e "${CYAN}[SERVICE] $1${NC}"
}

# Cleanup function to kill all processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"

    if [ ! -z "$WWW_PID" ]; then
        kill $WWW_PID 2>/dev/null
        echo -e "${YELLOW}   Stopped www (PID: $WWW_PID)${NC}"
    fi

    if [ ! -z "$WEBAPP_PID" ]; then
        kill $WEBAPP_PID 2>/dev/null
        echo -e "${YELLOW}   Stopped webapp (PID: $WEBAPP_PID)${NC}"
    fi

    if [ ! -z "$API_PID" ]; then
        kill $API_PID 2>/dev/null
        echo -e "${YELLOW}   Stopped api (PID: $API_PID)${NC}"
    fi

    echo -e "${GREEN}[SUCCESS] All services stopped${NC}"
    exit 0
}

# Register cleanup function
trap cleanup SIGINT SIGTERM EXIT

# Check if required directories exist
check_directories() {
    local missing=()

    [ ! -d "www" ] && missing+=("www")
    [ ! -d "webapp" ] && missing+=("webapp")
    [ ! -d "api" ] && missing+=("api")

    if [ ${#missing[@]} -ne 0 ]; then
        print_error "Missing directories: ${missing[*]}"
        exit 1
    fi
}

# Check if dependencies are installed
check_dependencies() {
    local missing=()

    if [ ! -d "www/node_modules" ]; then
        missing+=("www/node_modules")
    fi

    if [ ! -d "webapp/node_modules" ]; then
        missing+=("webapp/node_modules")
    fi

    if [ ! -d "api/.venv" ]; then
        missing+=("api/.venv")
    fi

    if [ ${#missing[@]} -ne 0 ]; then
        print_error "Dependencies not installed. Missing: ${missing[*]}"
        print_info "Run './setup.sh' first to install dependencies"
        exit 1
    fi
}

# Check if environment files exist
check_env_files() {
    local warnings=0

    if [ ! -f "www/.env" ]; then
        print_error ".env file missing in www/"
        ((warnings++))
    fi

    if [ ! -f "webapp/.env" ]; then
        print_error ".env file missing in webapp/"
        ((warnings++))
    fi

    if [ ! -f "api/.env" ]; then
        print_error ".env file missing in api/"
        ((warnings++))
    fi

    if [ $warnings -gt 0 ]; then
        print_error "Missing .env files. Run './setup.sh' to create them."
        exit 1
    fi
}

# Start a service with logging
start_service() {
    local name=$1
    local port=$2
    local command=$3

    print_service "Starting $name on port $port..."
    eval "$command" &
    local pid=$!
    echo $pid
}

# Main function
main() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Harbor - Starting All Services${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Pre-flight checks
    check_directories
    check_dependencies
    check_env_files

    print_success "Pre-flight checks passed"
    echo ""

    # Start www (Next.js)
    WWW_PID=$(start_service "www (Next.js)" "3000" "cd www && pnpm dev 2>&1 | sed 's/^/[www] /'")

    # Start webapp (Vite)
    WEBAPP_PID=$(start_service "webapp (Vite)" "5173" "cd webapp && pnpm dev 2>&1 | sed 's/^/[webapp] /'")

    # Start API (FastAPI)
    API_PID=$(start_service "api (FastAPI)" "8080" "cd api && source .venv/bin/activate && uvicorn main:app --reload --port 8080 2>&1 | sed 's/^/[api] /'")

    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}All Services Started${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${CYAN}Service URLs:${NC}"
    echo -e "   www (Next.js):     http://localhost:3000"
    echo -e "   webapp (Vite):      http://localhost:5173"
    echo -e "   api (FastAPI):     http://localhost:8080"
    echo -e "   API Docs:          http://localhost:8080/docs"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    echo ""

    # Wait for all processes
    wait
}

# Run main function
main
