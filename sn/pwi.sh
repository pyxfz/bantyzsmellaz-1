#!/bin/bash
# ==============================================================================
# Complete Playwright + FFmpeg Installation for Headless Debian
# No flags needed afterward - everything is pre-installed
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

# --- Step 1: Root check ---
if [[ $EUID -ne 0 ]]; then
   log_error "Run this script with sudo: sudo ./install-playwright-full.sh"
   exit 1
fi

# --- Step 2: System update & core tools ---
log_info "Updating system and installing core tools..."
apt-get update -qq
apt-get install -y -qq curl gnupg ca-certificates apt-transport-https

# --- Step 3: Install Node.js 20 ---
log_info "Installing Node.js 20 (required for Playwright)..."
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

apt-get update -qq
apt-get install -y -qq nodejs

log_info "Node.js: $(node --version), npm: $(npm --version)"

# --- Step 4: Install FFmpeg (system-wide) ---
log_info "Installing FFmpeg..."
apt-get install -y -qq ffmpeg

# Verify FFmpeg
if command -v ffmpeg &> /dev/null; then
    log_info "FFmpeg installed: $(ffmpeg -version | head -n1)"
else
    log_error "FFmpeg installation failed!"
    exit 1
fi

# --- Step 5: Install Playwright CLI ---
log_info "Installing Playwright CLI globally..."
npm install -g @playwright/cli@latest

# --- Step 6: Install Playwright browsers with system dependencies ---
log_info "Installing Playwright browsers with all system dependencies..."
log_warn "This downloads Chromium, Firefox, WebKit + all required libraries."

# --with-deps installs the OS libraries Playwright needs on Debian [citation:3][citation:13]
playwright-cli install-browser --with-deps

# --- Step 7: Verify everything ---
log_info "Verifying installation..."
echo ""

# Check Playwright
if command -v playwright-cli &> /dev/null; then
    log_info "Playwright CLI: $(playwright-cli --version)"
else
    log_warn "Playwright CLI not in PATH. Restart your shell."
fi

# Check FFmpeg
if command -v ffmpeg &> /dev/null; then
    log_info "FFmpeg: $(ffmpeg -version | head -n1)"
else
    log_error "FFmpeg not found!"
fi

# Check browsers
BROWSER_CACHE="${HOME}/.cache/ms-playwright"
if [ -d "$BROWSER_CACHE" ]; then
    log_info "Browsers installed to: ${BROWSER_CACHE}"
    ls -1 "$BROWSER_CACHE" 2>/dev/null | head -5
else
    log_warn "Browser cache not found. Check installation output."
fi

echo ""
log_info "Installation complete! No flags needed — everything is pre-installed."