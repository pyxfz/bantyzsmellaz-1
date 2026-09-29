#!/bin/bash
# ==============================================================================
# Playwright + FFmpeg Installation for Headless Debian
# ==============================================================================

set -e

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
apt-get install -y -qq curl gnupg ca-certificates apt-transport-https

# --- Step 2: Install FFmpeg ---
log_info "Installing FFmpeg..."
apt-get install -y -qq ffmpeg

if command -v ffmpeg &> /dev/null; then
    log_info "FFmpeg installed: $(ffmpeg -version | head -n1)"
else
    log_error "FFmpeg installation failed!"
    exit 1
fi

# --- Step 3: Install Playwright CLI ---
log_info "Installing Playwright CLI globally..."
npm install -g @playwright/cli@latest

# --- Step 4: Install Playwright browsers with system dependencies ---
log_info "Installing Playwright browsers with all system dependencies..."
log_warn "This downloads Chromium, Firefox, WebKit + all required libraries."

playwright-cli install-browser --with-deps

# --- Step 5: Verify everything ---
log_info "Verifying installation..."
echo ""

if command -v playwright-cli &> /dev/null; then
    log_info "Playwright CLI: $(playwright-cli --version)"
else
    log_warn "Playwright CLI not in PATH. Restart your shell."
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