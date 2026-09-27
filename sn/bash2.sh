#!/usr/bin/env bash
# General Commands Dump

set -euo pipefail

# --- Colors ---
BBLACK='\033[1;90m'
BRED='\033[1;91m'
BGREEN='\033[1;92m'
BYELLOW='\033[1;93m'
BBLUE='\033[1;94m'
BMAGENTA='\033[1;95m'
BCYAN='\033[1;96m'
BWHITE='\033[1;97m'
RESET='\033[0m'

# --- Commands ---

# Booty

smell_fart() {
    cat <<'EOF'
⠄⠄⠸⣿⣿⢣⢶⣟⣿⣖⣿⣷⣻⣮⡿⣽⣿⣻⣖⣶⣤⣭⡉⠄⠄⠄⠄⠄
⠄⠄⠄⢹⠣⣛⣣⣭⣭⣭⣁⡛⠻⢽⣿⣿⣿⣿⢻⣿⣿⣿⣽⡧⡄⠄⠄⠄
⠄⠄⠄⠄⣼⣿⣿⣿⣿⣿⣿⣿⣿⣶⣌⡛⢿⣽⢘⣿⣷⣿⡻⠏⣛⣀⠄⠄
⠄⠄⠄⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⠙⡅⣿⠚⣡⣴⣿⣿⣿⡆⠄
⠄⠄⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠄⣱⣾⣿⣿⣿⣿⣿⣿⠄
⠄⢀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢸⣿⣿⣿⣿⣿⣿⣿⣿⠄
⠄⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠣⣿⣿⣿⣿⣿⣿⣿⣿⣿⠄
⠄⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠛⠑⣿⣮⣝⣛⠿⠿⣿⣿⣿⣿⠄
⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⠄⠄⠄⠄⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠄
⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠇⠄⠄⠄⠄⢹⣿⣿⣿⣿⣿⣿⣿⣿⠁⠄
⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠏⠄⠄⠄⠄⠄⠸⣿⣿⣿⣿⣿⡿⢟⣣⣀
EOF
}

# Terraform Execution
tfexec() {
    declare -a CMD=(
        # // Check Terraform Version
        "terraform --version"

        # //Terrform login to get Creds for remote backend
        "terraform login"

    )
    CMDEXEC="${CMD[1]}"
    echo -e "${BBLUE} · · ────── ꒰ঌ·✦·໒꒱ ────── · ·"
    date && smell_fart
    echo -e "Executing:${RESET} ${CMDEXEC}"
    eval "${CMDEXEC}"
    echo -e "${BGREEN}Done!"
    echo -e "───── ⋆⋅☆⋅⋆ ─────${RESET}"
}

e2e1() {
    declare -a CMD=(
        # Installing uv and chnging
        "uv init e2"                      # e2 being the e2e tries
        "cd e2 && uv run main.py"         # Running the main
        "cd e2 && uv pip install e2e-cli" # Installing e2e_cli
        "uv run e2e_cli --help"

    )

    for CMDEXEC in "${CMD[@]}"; do
        echo -e "${BBLUE}────── ꒰ঌ·✦·໒꒱ ──────${RESET}"
        echo -e "Executing: ${CMDEXEC}"
        eval "${CMDEXEC}"
        echo -e "${BGREEN}Done!${RESET}"
        echo -e "${BBLUE}───── ⋆⋅☆⋅⋆ ─────${RESET}"
        echo # Add blank line between commands
    done
}

# -- Execution Blocks ---
panty() {
    # tfexec
    # otfexec
    # e2eisntall
    e2e1
    # e2e2
    # terrformInstall
    # openTofuInstall

}

# Main Execution
panty
