#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_error() { echo -e "${RED}✗ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${BLUE}→ $1${NC}"; }

link_env() {
    local dir=$1
    local app=$2

    if [ -z "$CONDUCTOR_ROOT_PATH" ]; then
        print_error "CONDUCTOR_ROOT_PATH not set"
        exit 1
    fi

    local source="$CONDUCTOR_ROOT_PATH/$dir/.env"
    local target="$dir/.env"

    if [ -f "$source" ]; then
        if [ ! -e "$target" ]; then
            ln -s "$source" "$target"
            print_success "$app: Linked .env from root"
        else
            print_success "$app: .env exists"
        fi
    else
        print_info "$app: No .env in root repo"
    fi
}

main() {
    echo -e "${BLUE}Harbor Conductor Setup${NC}\n"

    print_info "Running base setup"
    ./setup.sh

    echo ""
    link_env "www" "www"
    link_env "webapp" "webapp"
    link_env "api" "api"

    echo -e "\n${GREEN}Conductor setup complete${NC}"
    print_info "Use Conductor's run script to start services"
}

main
