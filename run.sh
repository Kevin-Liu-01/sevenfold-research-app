#!/bin/bash

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

WWW_PID=""
WEBAPP_PID=""
API_PID=""

print_error() { echo -e "${RED}✗ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${CYAN}→ $1${NC}"; }

cleanup() {
    echo -e "\n${YELLOW}Stopping services...${NC}"
    [ -n "$WWW_PID" ] && kill $WWW_PID 2>/dev/null
    [ -n "$WEBAPP_PID" ] && kill $WEBAPP_PID 2>/dev/null
    [ -n "$API_PID" ] && kill $API_PID 2>/dev/null
    print_success "All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

check_setup() {
    local missing=()

    [ ! -d "www/node_modules" ] && missing+=("www/node_modules")
    [ ! -d "webapp/node_modules" ] && missing+=("webapp/node_modules")
    [ ! -d "api/.venv" ] && missing+=("api/.venv")
    [ ! -f "www/.env" ] && missing+=("www/.env")
    [ ! -f "webapp/.env" ] && missing+=("webapp/.env")
    [ ! -f "api/.env" ] && missing+=("api/.env")

    if [ ${#missing[@]} -ne 0 ]; then
        print_error "Missing: ${missing[*]}"
        print_info "Run './setup.sh' first"
        exit 1
    fi
}

main() {
    echo -e "${CYAN}Harbor Services${NC}\n"

    check_setup
    print_success "Pre-flight checks passed\n"

    print_info "Starting www (Next.js) on :3000"
    (cd www && pnpm dev 2>&1 | sed 's/^/[www] /') &
    WWW_PID=$!

    print_info "Starting webapp (Vite) on :5173"
    (cd webapp && pnpm dev 2>&1 | sed 's/^/[webapp] /') &
    WEBAPP_PID=$!

    print_info "Starting api (FastAPI) on :8080"
    (cd api && source .venv/bin/activate && uvicorn main:app --reload --port 8080 2>&1 | sed 's/^/[api] /') &
    API_PID=$!

    sleep 2

    echo -e "\n${GREEN}Services running:${NC}"
    echo "  www:      http://localhost:3000"
    echo "  webapp:   http://localhost:5173"
    echo "  api:      http://localhost:8080"
    echo "  api docs: http://localhost:8080/docs"
    echo -e "\n${YELLOW}Press Ctrl+C to stop${NC}\n"

    wait
}

main
