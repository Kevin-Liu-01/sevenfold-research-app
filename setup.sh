#!/bin/bash
set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${BLUE}→ $1${NC}"; }

command_exists() { command -v "$1" &> /dev/null; }

check_requirements() {
    local missing=()

    if ! command_exists pnpm; then
        missing+=("pnpm")
    fi

    if ! command_exists python3; then
        missing+=("python3")
    fi

    if ! command_exists pip && ! python3 -m pip --version &> /dev/null; then
        missing+=("pip")
    fi

    if [ ${#missing[@]} -ne 0 ]; then
        print_error "Missing tools: ${missing[*]}"
        exit 1
    fi
}

check_env_file() {
    local dir=$1
    local app=$2

    if [ -f "$dir/env.template" ] && [ ! -f "$dir/.env" ]; then
        print_warning "$app: .env missing (create from env.template)"
    elif [ -f "$dir/.env" ]; then
        print_success "$app: .env found"
    fi
}

install_node_deps() {
    local dir=$1
    local app=$2

    [ ! -f "$dir/package.json" ] && return

    print_info "$app: Installing dependencies"
    (cd "$dir" && pnpm install -s) || exit 1
}

setup_python_api() {
    print_info "api: Setting up Python environment"
    cd api

    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi

    source .venv/bin/activate
    pip install --upgrade pip -q
    pip install -r requirements.txt -q || exit 1
    deactivate
    cd ..
}

main() {
    echo -e "${BLUE}Harbor Setup${NC}\n"

    check_requirements

    echo ""
    check_env_file "www" "www"
    check_env_file "webapp" "webapp"
    check_env_file "api" "api"

    echo ""
    install_node_deps "www" "www"
    install_node_deps "webapp" "webapp"
    setup_python_api

    echo -e "\n${GREEN}Setup complete${NC}"
    print_info "Run './run.sh' to start services"
}

main
