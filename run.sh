#!/bin/bash
set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

WEBAPP_PID=""
DOCKER_LOG_PID=""
COMPOSE_STARTED=0

print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${CYAN}→ $1${NC}"; }

cleanup() {
    if [ -n "$WEBAPP_PID" ]; then
        kill "$WEBAPP_PID" 2>/dev/null || true
    fi
    if [ -n "$DOCKER_LOG_PID" ]; then
        kill "$DOCKER_LOG_PID" 2>/dev/null || true
    fi
    if [ $COMPOSE_STARTED -eq 1 ]; then
        print_info "Stopping Docker services"
        sudo docker compose down >/dev/null 2>&1 || true
    fi
    print_success "All services stopped"
}

trap cleanup EXIT INT TERM

ensure_command() {
    local cmd=$1
    if ! command -v "$cmd" >/dev/null 2>&1; then
        print_error "Missing dependency: $cmd"
        exit 1
    fi
}

check_webapp_setup() {
    local missing=()
    [ ! -d "webapp/node_modules" ] && missing+=("webapp/node_modules (run pnpm install)")
    [ ! -f "webapp/.env" ] && missing+=("webapp/.env (copy env.template)")

    if [ ${#missing[@]} -ne 0 ]; then
        print_error "Webapp setup incomplete: ${missing[*]}"
        exit 1
    fi
}

start_compose() {
    print_info "Building and starting backend services via Docker Compose"
    sudo docker compose up --build -d "$@"
    COMPOSE_STARTED=1
    print_success "Docker services running (api + latex-service)"
}

stream_compose_logs() {
    print_info "Streaming Docker logs (api + latex-service)"
    (sudo docker compose logs -f --tail=50 2>&1 | sed 's/^/[docker] /') &
    DOCKER_LOG_PID=$!
}

start_webapp() {
    print_info "Starting webapp (Vite) on :5173"
    (cd webapp && pnpm dev 2>&1 | sed 's/^/[webapp] /') &
    WEBAPP_PID=$!
    sleep 1
    print_success "Webapp running"
}

main() {
    ensure_command docker
    ensure_command pnpm
    check_webapp_setup

    start_compose "$@"
    stream_compose_logs
    start_webapp

    echo -e "\n${GREEN}Services running:${NC}"
    echo "  webapp:   http://localhost:5173"
    echo "  api:      http://localhost:8080"
    echo "  latex:    http://localhost:8081"
    echo "  api docs: http://localhost:8080/docs"
    echo -e "\n${YELLOW}Press Ctrl+C to stop${NC}\n"

    wait "$WEBAPP_PID"
}

main "$@"
