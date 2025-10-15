#!/bin/bash

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

print_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Link environment file from root repo
link_env_file() {
    local dir=$1
    local app_name=$2

    if [ -z "$CONDUCTOR_ROOT_PATH" ]; then
        print_error "CONDUCTOR_ROOT_PATH not set - are you running in Conductor?"
        exit 1
    fi

    if [ -f "$CONDUCTOR_ROOT_PATH/$dir/.env" ]; then
        if [ ! -e "$dir/.env" ]; then
            print_info "Linking .env file for $app_name from root repo..."
            ln -s "$CONDUCTOR_ROOT_PATH/$dir/.env" "$dir/.env"
            print_success ".env file linked for $app_name"
        else
            print_success ".env file already exists in $app_name/"
        fi
    else
        print_warning "No .env file found in root repo for $app_name"
        print_info "Expected at: $CONDUCTOR_ROOT_PATH/$dir/.env"
    fi
}

# Main setup process
main() {
    print_section "Harbor Conductor Workspace Setup"

    # First, run the base setup script
    print_info "Running base setup.sh..."
    ./setup.sh

    # Link environment files from root repo (excluding extension)
    print_section "Linking Environment Files from Root Repo"
    link_env_file "www" "www"
    link_env_file "webapp" "webapp"
    link_env_file "api" "api"

    # Note: extension is not included as it doesn't need linking

    # Summary
    print_section "Conductor Setup Complete"
    print_success "Workspace is ready!"
    print_info "Run the 'run' script in Conductor to start all services"
}

# Run main function
main
