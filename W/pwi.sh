#!/bin/bash
# ==============================================================================
# Playwright + FFmpeg Installation for Headless Debian (Bun Edition)
# ==============================================================================

set -e

# Self-elevate to root if needed
if [[ $EUID -ne 0 ]]; then
    exec sudo "$0" "$@"
fi

# --- Colors ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# --- Step 1: System update & core tools ---
log_info "Updating system and installing core tools..."
apt-get update -qq
apt-get install -y -qq curl gnupg ca-certificates apt-transport-https unzip

# --- Step 2: Install Bun if not present ---
if ! command -v bun &> /dev/null; then
    log_info "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    
    # Add bun to PATH for the current session
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    
    # Verify
    if ! command -v bun &> /dev/null; then
        log_error "Bun installation failed or not in PATH."
        log_error "Try running: export PATH=\"\$HOME/.bun/bin:\$PATH\""
        exit 1
    fi
else
    log_info "Bun already installed: $(bun --version)"
fi

# --- Step 3: Install FFmpeg ---
log_info "Installing FFmpeg..."
apt-get install -y -qq ffmpeg

if command -v ffmpeg &> /dev/null; then
    log_info "FFmpeg installed: $(ffmpeg -version | head -n1)"
else
    log_error "FFmpeg installation failed!"
    exit 1
fi

# --- Step 4: Install Playwright CLI globally via Bun ---
log_info "Installing Playwright CLI globally via Bun..."
bun install -g @playwright/cli@latest

# --- Step 5: Install Playwright browsers with system dependencies ---
log_info "Installing Playwright browsers with all system dependencies..."
log_warn "This downloads Chromium, Firefox, WebKit + all required libraries."

# Use bunx to run the browser install
bunx playwright install --with-deps

# --- Step 6: Verify everything ---
log_info "Verifying installation..."
echo ""

if command -v bunx &> /dev/null; then
    log_info "Bunx: $(bunx --version 2>/dev/null || echo 'available')"
else
    log_warn "bunx not in PATH. Restart your shell."
fi

if command -v ffmpeg &> /dev/null; then
    log_info "FFmpeg: $(ffmpeg -version | head -n1)"
else
    log_error "FFmpeg not found!"
fi

BROWSER_CACHE="${HOME}/.cache/ms-playwright"
if [ -d "$BROWSER_CACHE" ]; then
    log_info "Browsers installed to: ${BROWSER_CACHE}"
    ls -1 "$BROWSER_CACHE" 2>/dev/null | head -5
else
    log_warn "Browser cache not found. Check installation output."
fi

echo ""
log_info "Installation complete!"