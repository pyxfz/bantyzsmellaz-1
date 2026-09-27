#!/usr/bin/env bash
set -e
set -o pipefail

LOG_DIR="wdp"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/deploy_$(date +%Y%m%d_%H%M%S).log"

check_token() {
	read -p "Have you exported CLOUDFLARE_API_TOKEN? (y/n): " confirm
	if [[ "$confirm" != "y" ]]; then
		echo "Aborted. Please run: export CLOUDFLARE_API_TOKEN='your_token' first."
		exit 1
	fi
}

run_cmd() {
	echo ">>> $*" | tee -a "$LOG_FILE"
	"$@" 2>&1 | tee -a "$LOG_FILE"
}

deploy() {
	echo "=== Starting Deployment ===" | tee "$LOG_FILE"
	run_cmd bunx wrangler setup
	run_cmd bunx wrangler types
	run_cmd bun run build
	run_cmd bunx wrangler types # Post-build type regeneration
	run_cmd bun run deploy

	echo "=== Deployment Complete ===" | tee -a "$LOG_FILE"
	echo "" | tee -a "$LOG_FILE"
	echo "To delete worker - go into the directory and run:" | tee -a "$LOG_FILE"
	echo "bunx wrangler delete" | tee -a "$LOG_FILE"
	echo "" | tee -a "$LOG_FILE"
	echo "Full log saved to: $LOG_FILE"
}

check_token
deploy
