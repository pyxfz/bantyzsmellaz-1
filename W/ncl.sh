#!/bin/bash

clean_build_artifacts() {
	mkdir -p "./ncl"
	local log_file="./ncl/cleanup_$(date +%Y%m%d_%H%M%S).log"

	echo "=== Cleanup Started at $(date) ===" | tee -a "$log_file"
	for dir in node_modules .node_modules tmp dist .vercel .next .svelte-kit .wrangler; do
		find . -maxdepth 5 -type d -name "$dir" -prune -exec rm -rf {} \; -exec echo "Deleted: {}" \; 2>/dev/null | tee -a "$log_file"
	done
	echo "=== Cleanup Completed at $(date) ===" | tee -a "$log_file"
	echo "Log: $log_file"
}

clean_build_artifacts
