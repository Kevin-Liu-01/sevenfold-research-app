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

# Check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check required tools
check_requirements() {
    print_section "Checking Required Tools"

    local missing_tools=()

    if ! command_exists pnpm; then
        missing_tools+=("pnpm")
        print_error "pnpm is not installed"
        print_info "Install with: npm install -g pnpm"
    else
        print_success "pnpm found ($(pnpm --version))"
    fi

    if ! command_exists python3; then
        missing_tools+=("python3")
        print_error "python3 is not installed"
        print_info "Install from: https://www.python.org/downloads/"
    else
        print_success "python3 found ($(python3 --version))"
    fi

    if ! command_exists pip && ! python3 -m pip --version &> /dev/null; then
        missing_tools+=("pip")
        print_error "pip is not installed"
    else
        print_success "pip found"
    fi

    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
}

# Setup environment variables for a directory
setup_env_file() {
    local dir=$1
    local app_name=$2

    if [ -f "$dir/env.template" ]; then
        if [ ! -f "$dir/.env" ]; then
            print_info "Creating .env file in $app_name from template..."
            cp "$dir/env.template" "$dir/.env"
            print_warning ".env file created in $app_name/ - Please fill in the required values"
        else
            print_success ".env file already exists in $app_name/"
        fi
    fi
}

# Validate critical environment variables
validate_env_file() {
    local env_file=$1
    local app_name=$2
    local required_vars=("${@:3}")

    if [ ! -f "$env_file" ]; then
        print_warning ".env file missing in $app_name/"
        return 1
    fi

    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=.\\+" "$env_file" 2>/dev/null; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_warning "Missing or empty variables in $app_name/.env: ${missing_vars[*]}"
        return 1
    fi

    return 0
}

# Install Node.js dependencies for an app
install_node_deps() {
    local dir=$1
    local app_name=$2

    print_section "Installing Dependencies: $app_name"

    cd "$dir"

    if [ ! -f "package.json" ]; then
        print_warning "No package.json found in $app_name, skipping..."
        cd - > /dev/null
        return
    fi

    pnpm install

    if [ $? -eq 0 ]; then
        print_success "$app_name dependencies installed"
    else
        print_error "Failed to install $app_name dependencies"
        cd - > /dev/null
        exit 1
    fi

    cd - > /dev/null
}

# Setup Python API
setup_python_api() {
    print_section "Setting Up Python API"

    cd api

    # Create virtual environment if it doesn't exist
    if [ ! -d ".venv" ]; then
        print_info "Creating Python virtual environment..."
        python3 -m venv .venv
        print_success "Virtual environment created"
    else
        print_success "Virtual environment already exists"
    fi

    # Activate virtual environment
    source .venv/bin/activate

    # Upgrade pip
    print_info "Upgrading pip..."
    pip install --upgrade pip --quiet

    # Install dependencies
    if [ -f "requirements.txt" ]; then
        print_info "Installing Python dependencies..."
        pip install -r requirements.txt

        if [ $? -eq 0 ]; then
            print_success "Python dependencies installed"
        else
            print_error "Failed to install Python dependencies"
            deactivate
            cd ..
            exit 1
        fi
    else
        print_error "requirements.txt not found in api/"
        deactivate
        cd ..
        exit 1
    fi

    deactivate
    cd ..
}

# Main setup process
main() {
    print_section "Harbor Project Setup"

    # Check requirements
    check_requirements

    # Setup environment files
    print_section "Setting Up Environment Files"
    setup_env_file "www" "www"
    setup_env_file "webapp" "webapp"
    setup_env_file "extension" "extension"
    setup_env_file "api" "api"

    # Install dependencies for all Node.js apps
    install_node_deps "www" "www (Next.js)"
    install_node_deps "webapp" "webapp (Vite)"
    install_node_deps "extension" "extension (Chrome Extension)"

    # Setup Python API
    setup_python_api

    # Final environment validation
    print_section "Validating Environment Configuration"

    local env_warnings=0

    if ! validate_env_file "api/.env" "api" "SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "ANTHROPIC_API_KEY"; then
        ((env_warnings++))
    fi

    if ! validate_env_file "webapp/.env" "webapp" "VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY"; then
        ((env_warnings++))
    fi

    if ! validate_env_file "www/.env" "www" "NEXT_PUBLIC_APP_URL"; then
        ((env_warnings++))
    fi

    # Summary
    print_section "Setup Complete"

    if [ $env_warnings -gt 0 ]; then
        print_warning "Setup completed with $env_warnings environment configuration warning(s)"
        print_info "Please review and update the .env files before running the application"
    else
        print_success "All dependencies installed and environment configured!"
        print_info "Run './run.sh' to start all services"
    fi
}

# Run main function
main
