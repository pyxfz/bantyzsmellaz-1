#!/bin/bash
#===============================================================================
# Compression & Encryption Utility
# Features: Compress, Split, Encrypt, Upload, Decrypt, Extract
# Dependencies: tar, xz, gpg, split, curl, stat
#===============================================================================

set -euo pipefail # Exit on error, undefined vars, pipe failures

#-------------------------------------------------------------------------------
# CONFIGURATION
#-------------------------------------------------------------------------------
readonly SCRIPT_NAME="$(basename "$0")"
readonly ARCHIVE_NAME="panty.tar.xz"
readonly DEFAULT_SPLIT_SIZE="10M"
readonly UPLOAD_URL="https://bashupload.com"
readonly ENCRYPTION_CIPHER="AES256"

# Color codes - ANSI-C quoting for actual escape characters [[23]]
readonly RED=$'\033[0;31m' GREEN=$'\033[0;32m' YELLOW=$'\033[1;33m'
readonly PURPLE=$'\033[0;35m' CYAN=$'\033[0;36m' BLUE=$'\033[0;34m' NC=$'\033[0m'
readonly BOLD=$'\033[1m' DIM=$'\033[2m'

# Disable colors if output is not a terminal (for piping to files)
if [[ ! -t 1 ]]; then
    readonly RED='' GREEN='' YELLOW='' PURPLE='' CYAN='' BLUE='' NC='' BOLD='' DIM=''
fi

#-------------------------------------------------------------------------------
# GLOBAL STATE
#-------------------------------------------------------------------------------
VERBOSE="false"
USE_GPG_ENCRYPTION="false"
GPG_PASSPHRASE=""
EXTRACT_DIR=""

#-------------------------------------------------------------------------------
# UTILITY FUNCTIONS
#-------------------------------------------------------------------------------

log_info() { echo -e "${CYAN}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $*" >&2; }
log_error() { echo -e "${RED}[✗]${NC} $*" >&2; }
log_header() {
    echo -e ""
    echo -e "${PURPLE}═══════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}   ${BOLD}$*${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════${NC}"
    echo -e ""
}

# Secure passphrase prompt (input hidden)
prompt_passphrase() {
    local prompt="${1:-Enter passphrase}"
    local confirm="${2:-false}"
    local pass1 pass2

    while true; do
        read -rsp "${prompt}: " pass1
        echo
        if [[ "$confirm" == "true" ]]; then
            read -rsp "Confirm passphrase: " pass2
            echo
            if [[ "$pass1" == "$pass2" && -n "$pass1" ]]; then
                printf '%s' "$pass1"
                return 0
            fi
            log_error "Passphrases do not match or are empty. Try again."
        else
            if [[ -n "$pass1" ]]; then
                printf '%s' "$pass1"
                return 0
            fi
            log_error "Passphrase cannot be empty. Try again."
        fi
    done
}

# Clean sensitive data from memory
cleanup_secrets() {
    if [[ -n "${GPG_PASSPHRASE:-}" ]]; then
        unset GPG_PASSPHRASE
        log_info "Sensitive data cleared from memory"
    fi
}

# Cross-platform file size check
get_file_size() {
    local file="$1"
    if [[ -f "$file" ]]; then
        stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo "0"
    else
        echo "-1"
    fi
}

# Human-readable size formatting
format_size() {
    local bytes="$1"
    if [[ "$bytes" -lt 1024 ]]; then
        echo "${bytes}B"
    elif [[ "$bytes" -lt 1048576 ]]; then
        echo "$((bytes / 1024))KB"
    elif [[ "$bytes" -lt 1073741824 ]]; then
        echo "$((bytes / 1048576))MB"
    else
        echo "$((bytes / 1073741824))GB"
    fi
}

#-------------------------------------------------------------------------------
# DEPENDENCY CHECK
#-------------------------------------------------------------------------------
check_dependencies() {
    local deps=("tar" "xz" "gpg" "curl" "split")
    local missing=()

    log_info "Checking dependencies..."
    for dep in "${deps[@]}"; do
        command -v "$dep" &>/dev/null || missing+=("$dep")
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing required commands: ${missing[*]}"
        log_info "Install with: sudo apt install tar xz-utils gnupg curl coreutils"
        exit 1
    fi
    log_success "All dependencies satisfied"
}

#-------------------------------------------------------------------------------
# INTEGRITY VERIFICATION (MANDATORY for all operations)
#-------------------------------------------------------------------------------
check_integrity() {
    local file="$1"
    local operation="${2:-UNKNOWN}"
    local errors=0

    [[ ! -f "$file" ]] && {
        log_error "File not found: $file"
        return 1
    }

    log_header "INTEGRITY VERIFICATION ($operation)"

    # Method 1: XZ stream test
    printf "${YELLOW}Testing XZ compression integrity...${NC} "
    if xz -t "$file" 2>/dev/null; then
        echo -e "\r${GREEN}✓ XZ integrity passed          ${NC}"
    else
        echo -e "\r${RED}✗ XZ integrity failed          ${NC}" >&2
        ((errors++)) || true
    fi

    # Method 2: Tar structure test
    printf "${YELLOW}Testing Tar archive structure...${NC} "
    if tar -tf "$file" &>/dev/null; then
        echo -e "\r${GREEN}✓ Tar structure valid          ${NC}"
    else
        echo -e "\r${RED}✗ Tar structure corrupted      ${NC}" >&2
        ((errors++)) || true
    fi

    # Method 3: Content sampling
    printf "${YELLOW}Sampling archive contents...${NC} "
    local file_count
    file_count=$(tar tf "$file" 2>/dev/null | wc -l) || true
    if [[ "$file_count" -gt 0 ]]; then
        echo -e "\r${GREEN}✓ Contains $file_count items            ${NC}"
        if [[ "$VERBOSE" == "true" ]]; then
            echo -e "\n${CYAN}First 10 entries:${NC}"
            tar tf "$file" 2>/dev/null | head -10 | sed 's/^/  /'
        fi
    else
        echo -e "\r${RED}✗ Cannot read archive contents ${NC}" >&2
        ((errors++)) || true
    fi

    # Final result
    if [[ $errors -eq 0 ]]; then
        log_success "INTEGRITY CHECK PASSED"
        local size_bytes size_human
        size_bytes=$(get_file_size "$file")
        size_human=$(format_size "$size_bytes")
        echo -e "${GREEN}File:${NC} $file  ${GREEN}Size:${NC} $size_human ($size_bytes bytes)"
        return 0
    else
        log_error "INTEGRITY CHECK FAILED - File may be corrupted"
        return 1
    fi
}

#-------------------------------------------------------------------------------
# COMPRESSION FUNCTIONS
#-------------------------------------------------------------------------------

compress_directory() {
    local archive="$1"
    local output_file="$archive"

    log_header "CREATING COMPRESSED ARCHIVE"

    # Show what's being archived
    log_info "Archiving current directory contents:"
    ls -la 2>/dev/null | grep -v '^total' | head -10 || true
    local total_items
    total_items=$(find . -maxdepth 1 -mindepth 1 2>/dev/null | wc -l) || total_items=0
    if [[ $total_items -gt 10 ]]; then
        echo -e "${YELLOW}  ... and $((total_items - 10)) more items${NC}"
    fi

    local start_time end_time duration
    start_time=$(date +%s)

    if [[ "$USE_GPG_ENCRYPTION" == "true" ]]; then
        # Compress → Encrypt pipeline
        output_file="${archive}.gpg"
        log_info "Command: tar cvf - * | xz -T0 -9e -c | gpg --symmetric --cipher-algo $ENCRYPTION_CIPHER"
        log_info "Encryption: $ENCRYPTION_CIPHER (symmetric)"

        printf "${YELLOW}Compressing and encrypting"
        if tar cvf - * 2>/dev/null |
            xz -T0 -9e -c 2>/dev/null |
            gpg --batch --yes --passphrase-fd 0 --symmetric \
                --cipher-algo "$ENCRYPTION_CIPHER" \
                -o "$output_file" 2>/dev/null <<<"$GPG_PASSPHRASE"; then
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo -e "\r${GREEN}✓ Compression + encryption completed in ${duration}s${NC}"
        else
            echo -e "\r${RED}✗ Compression/encryption failed${NC}" >&2
            return 1
        fi
    else
        # Standard compression only
        log_info "Command: tar cvf - * | xz -T0 -9e -c > $archive"
        printf "${YELLOW}Compressing"
        if tar cvf - * 2>/dev/null | xz -T0 -9e -c >"$archive" 2>/dev/null; then
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo -e "\r${GREEN}✓ Compression completed in ${duration}s${NC}"
        else
            echo -e "\r${RED}✗ Compression failed${NC}" >&2
            return 1
        fi
    fi

    show_sizes "$output_file"

    # Show xz details if not encrypted
    if [[ "$USE_GPG_ENCRYPTION" != "true" ]]; then
        echo -e "\n${CYAN}Compression details:${NC}"
        xz --list "$archive" 2>/dev/null || true
    fi

    # Mandatory integrity check
    check_integrity "$output_file" "POST-COMPRESSION" || return 1

    log_success "Archive created: $output_file"
    return 0
}

#-------------------------------------------------------------------------------
# SPLIT/JOIN FUNCTIONS
#-------------------------------------------------------------------------------

split_archive() {
    local file="$1"
    local size="${2:-$DEFAULT_SPLIT_SIZE}"

    [[ ! -f "$file" ]] && {
        log_error "File not found: $file"
        return 1
    }

    # Pre-split integrity check
    check_integrity "$file" "PRE-SPLIT" || {
        log_error "Cannot split corrupted archive"
        return 1
    }

    log_header "SPLITTING ARCHIVE"
    log_info "Splitting $file into ${size} parts..."

    # Create parts with descriptive names
    split -b "$size" -d --verbose --suffix-length=3 \
        "$file" "${file}.part." 2>/dev/null

    log_success "Split complete"
    echo -e "\n${CYAN}Generated parts:${NC}"
    ls -lh "${file}".part.* 2>/dev/null || true

    local part_count
    part_count=$(ls "${file}".part.* 2>/dev/null | wc -l) || part_count=0
    log_success "Created $part_count part files"

    echo -e "\n${YELLOW}To reassemble:${NC}"
    echo "  cat ${file}.part.* > ${file}"
    echo -e "${BLUE}Note: Reassembly will auto-verify integrity${NC}"
}

reassemble_archive() {
    local base_name="${ARCHIVE_NAME}"

    # Find part files (handle both naming patterns)
    local part_files
    part_files=$(ls "${base_name}".part.* "${base_name}".part* 2>/dev/null | sort -V | uniq) || true

    if [[ -z "$part_files" ]]; then
        log_error "No part files found (looking for ${base_name}.part.* or ${base_name}.part*)"
        return 1
    fi

    log_header "REASSEMBLING ARCHIVE"
    log_info "Found $(echo "$part_files" | wc -l) part(s)"

    echo -e "\n${CYAN}Part details:${NC}"
    echo "$part_files" | while read -r part; do
        [[ -n "$part" ]] && ls -lh "$part" 2>/dev/null || true
    done

    printf "${YELLOW}Reassembling"
    if cat $part_files >"$base_name" 2>/dev/null; then
        echo -e "\r${GREEN}✓ Reassembly complete        ${NC}"

        # Post-assembly integrity check
        if check_integrity "$base_name" "POST-REASSEMBLY"; then
            log_success "Reassembly successful - Archive verified"
            return 0
        else
            log_error "Reassembly produced corrupted archive"
            return 1
        fi
    else
        echo -e "\r${RED}✗ Reassembly failed          ${NC}" >&2
        return 1
    fi
}

#-------------------------------------------------------------------------------
# ENCRYPTION FUNCTIONS (GPG Symmetric)
#-------------------------------------------------------------------------------

encrypt_standalone() {
    local file="$1"

    [[ ! -f "$file" ]] && {
        log_error "File not found: $file"
        return 1
    }

    # Pre-encryption integrity check
    check_integrity "$file" "PRE-ENCRYPTION" || {
        log_error "Cannot encrypt corrupted archive"
        return 1
    }

    log_header "ENCRYPTING WITH GPG"
    log_info "Cipher: $ENCRYPTION_CIPHER (AES-256 symmetric)"
    log_warn "Use a strong, unique passphrase. Do not reuse passwords!"

    # Prompt for passphrase securely
    GPG_PASSPHRASE=$(prompt_passphrase "Enter encryption passphrase" "true")

    local encrypted_file="${file}.gpg"

    printf "${YELLOW}Encrypting"
    if gpg --batch --yes --passphrase-fd 0 --symmetric \
        --cipher-algo "$ENCRYPTION_CIPHER" \
        -o "$encrypted_file" "$file" 2>/dev/null <<<"$GPG_PASSPHRASE"; then
        echo -e "\r${GREEN}✓ Encryption complete        ${NC}"

        show_sizes "$encrypted_file"

        # Verify encryption (test decryption without writing)
        printf "${YELLOW}Verifying encryption"
        if gpg --batch --yes --passphrase-fd 0 --decrypt "$encrypted_file" 2>/dev/null <<<"$GPG_PASSPHRASE" |
            tar -tf - &>/dev/null; then
            echo -e "\r${GREEN}✓ Encryption verified        ${NC}"
        else
            echo -e "\r${YELLOW}! Verification skipped (may be non-tar file)${NC}"
        fi

        log_success "Encrypted file: $encrypted_file"
        echo -e "${BLUE}To decrypt: $SCRIPT_NAME -x $encrypted_file${NC}"

        cleanup_secrets
        return 0
    else
        echo -e "\r${RED}✗ Encryption failed          ${NC}" >&2
        cleanup_secrets
        return 1
    fi
}

decrypt_and_extract() {
    local encrypted_file="$1"
    local target_dir="${EXTRACT_DIR:-}"

    [[ ! -f "$encrypted_file" ]] && {
        log_error "File not found: $encrypted_file"
        return 1
    }

    log_header "DECRYPTING & EXTRACTING"

    # Prompt for passphrase
    GPG_PASSPHRASE=$(prompt_passphrase "Enter decryption passphrase")

    # Interactive directory selection if not provided
    if [[ -z "$target_dir" ]]; then
        echo -e "\n${YELLOW}Archive:${NC} $encrypted_file"
        read -erp "Target directory for extraction (default: ./extracted): " target_dir
        target_dir="${target_dir:-./extracted}"
    fi

    # Create target directory safely
    if ! mkdir -p "$target_dir" 2>/dev/null; then
        log_error "Cannot create directory: $target_dir"
        cleanup_secrets
        return 1
    fi

    target_dir="$(cd "$target_dir" && pwd)" # Resolve to absolute path
    log_info "Extracting to: ${CYAN}$target_dir${NC}"

    printf "${YELLOW}Decrypting and extracting"
    if gpg --batch --yes --passphrase-fd 0 --decrypt "$encrypted_file" 2>/dev/null <<<"$GPG_PASSPHRASE" |
        tar -xvf - -C "$target_dir" 2>/dev/null; then
        echo -e "\r${GREEN}✓ Extraction complete        ${NC}"
        log_success "Files extracted to: $target_dir"

        echo -e "\n${CYAN}Contents of $target_dir:${NC}"
        ls -la "$target_dir" 2>/dev/null | head -15 || true

        cleanup_secrets
        return 0
    else
        echo -e "\r${RED}✗ Decryption or extraction failed${NC}" >&2
        log_warn "Tips:"
        echo "  • Verify you're using the correct passphrase"
        echo "  • Check if the file is actually GPG-encrypted (.gpg extension)"
        echo "  • Ensure sufficient disk space in $target_dir"
        cleanup_secrets
        return 1
    fi
}

#-------------------------------------------------------------------------------
# EXTRACTION FUNCTIONS
#-------------------------------------------------------------------------------

interactive_decompress() {
    local file="${1:-$ARCHIVE_NAME}"

    # Auto-detect encrypted archives
    if [[ "$file" == *.gpg ]]; then
        log_info "Detected GPG-encrypted archive"
        decrypt_and_extract "$file"
        return $?
    fi

    [[ ! -f "$file" ]] && {
        log_error "File not found: $file"
        return 1
    }

    # Pre-extraction integrity check
    check_integrity "$file" "PRE-EXTRACTION" || return 1

    log_header "EXTRACTING ARCHIVE"

    # Interactive directory prompt
    echo -e "${YELLOW}Archive:${NC} $file"
    read -erp "Target directory (default: ./extracted): " EXTRACT_DIR
    EXTRACT_DIR="${EXTRACT_DIR:-./extracted}"

    if ! mkdir -p "$EXTRACT_DIR" 2>/dev/null; then
        log_error "Cannot create: $EXTRACT_DIR"
        return 1
    fi

    EXTRACT_DIR="$(cd "$EXTRACT_DIR" && pwd)"
    log_info "Extracting to: ${CYAN}$EXTRACT_DIR${NC}"

    printf "${YELLOW}Extracting"
    if tar -xvf "$file" -C "$EXTRACT_DIR" 2>/dev/null; then
        echo -e "\r${GREEN}✓ Extraction complete        ${NC}"
        log_success "Successfully extracted to: $EXTRACT_DIR"

        echo -e "\n${CYAN}Extracted contents:${NC}"
        ls -la "$EXTRACT_DIR" 2>/dev/null | head -15 || true
        return 0
    else
        echo -e "\r${RED}✗ Extraction failed          ${NC}" >&2
        return 1
    fi
}

#-------------------------------------------------------------------------------
# UPLOAD FUNCTION
#-------------------------------------------------------------------------------

upload_file() {
    local file="$1"

    [[ ! -f "$file" ]] && {
        log_error "File not found: $file"
        return 1
    }

    # Pre-upload integrity check
    check_integrity "$file" "PRE-UPLOAD" || {
        log_error "Cannot upload corrupted file"
        return 1
    }

    log_header "UPLOADING FILE"
    log_info "Uploading to: $UPLOAD_URL"
    show_sizes "$file"

    echo -e "\n${YELLOW}Upload progress:${NC}"
    if curl -# --progress-bar -T "$file" "${UPLOAD_URL}/" 2>/dev/null; then
        echo -e "\n${GREEN}✓ Upload initiated${NC}"
        log_warn "Files typically expire after 7 days on bashupload.com"

        echo -e "\n${CYAN}Alternative services:${NC}"
        echo "  • bashupload.app (password protection, custom expiry)"
        echo "  • Command: curl -T \"$file\" https://bashupload.app"
        return 0
    else
        log_error "Upload failed"
        return 1
    fi
}

#-------------------------------------------------------------------------------
# LIST/INFO FUNCTION
#-------------------------------------------------------------------------------

list_archive() {
    local file="$1"

    [[ ! -f "$file" ]] && {
        log_error "File not found: $file"
        return 1
    }

    # Handle encrypted files
    if [[ "$file" == *.gpg ]]; then
        log_info "Encrypted archive - cannot list contents without decryption"
        echo -e "${BLUE}Use: $SCRIPT_NAME -x $file${NC}"
        return 0
    fi

    check_integrity "$file" "PRE-LIST" || return 1

    log_header "ARCHIVE DETAILS"

    # XZ metadata
    echo -e "${CYAN}Compression info:${NC}"
    xz --list "$file" 2>/dev/null || echo "  (Not an XZ-compressed file)"

    # Archive contents
    echo -e "\n${CYAN}Archive contents:${NC}"
    local total_items
    total_items=$(tar tf "$file" 2>/dev/null | wc -l) || total_items=0
    echo -e "Total items: ${GREEN}$total_items${NC}"

    echo -e "\n${YELLOW}First 20 entries (detailed):${NC}"
    tar tvf "$file" 2>/dev/null | head -20 | sed 's/^/  /' || true

    if [[ $total_items -gt 20 ]]; then
        echo -e "${YELLOW}  ... and $((total_items - 20)) more items${NC}"
    fi
}

#-------------------------------------------------------------------------------
# HELP & USAGE
#-------------------------------------------------------------------------------

show_help() {
    cat <<EOF
${CYAN}${SCRIPT_NAME} - Secure Compression & Encryption Utility${NC}

${YELLOW}USAGE:${NC}
    $SCRIPT_NAME [OPTIONS]

${YELLOW}OPERATIONS:${NC}
    ${GREEN}-c, --compress${NC}           Compress current directory to ${ARCHIVE_NAME}
    ${GREEN}-s, --split [SIZE]${NC}       Split archive (default: ${DEFAULT_SPLIT_SIZE})
    ${GREEN}-j, --join${NC}               Reassemble split archive parts
    ${GREEN}-p, --protect${NC}            Encrypt archive with GPG (prompts for passphrase)
    ${GREEN}-x, --extract [FILE]${NC}     Decrypt & extract encrypted archive (interactive)
    ${GREEN}-d, --decompress [FILE]${NC}  Interactive extract (prompts for directory)
    ${GREEN}-u, --upload FILE${NC}        Upload file to ${UPLOAD_URL}
    ${GREEN}-l, --list FILE${NC}          Show archive details and contents

${YELLOW}OPTIONS:${NC}
    ${GREEN}-h, --help${NC}               Show this help message
    ${GREEN}-v, --verbose${NC}            Enable detailed output

${YELLOW}FEATURES:${NC}
    ✓ Multi-threaded compression: xz -T0 -9e
    ✓ GPG symmetric encryption: AES256 cipher
    ✓ Mandatory integrity verification for ALL operations
    ✓ Secure passphrase handling (hidden input, memory cleanup)
    ✓ Cross-platform compatibility (Linux/macOS)

${YELLOW}EXAMPLES:${NC}
    ${BLUE}# Basic compression${NC}
    $ $SCRIPT_NAME -c
    
    ${BLUE}# Compress + encrypt + split${NC}
    $ $SCRIPT_NAME -c -p -s 50M
    
    ${BLUE}# Decrypt & extract (interactive)${NC}
    $ $SCRIPT_NAME -x panty.tar.xz.gpg
    
    ${BLUE}# Standard extract with directory prompt${NC}
    $ $SCRIPT_NAME -d panty.tar.xz
    
    ${BLUE}# Full workflow${NC}
    $ $SCRIPT_NAME -c -p          # Create encrypted archive
    $ $SCRIPT_NAME -s 20M -c      # Also split it
    $ $SCRIPT_NAME -u *.gpg       # Upload encrypted parts
    # Later, on another machine:
    $ $SCRIPT_NAME -j             # Reassemble
    $ $SCRIPT_NAME -x             # Decrypt & extract (prompts for passphrase + dir)

${YELLOW}SECURITY NOTES:${NC}
    • Passphrases are never stored in environment variables
    • Memory is cleared after encryption/decryption operations
    • Use strong, unique passphrases (12+ chars, mixed case, symbols)
    • For automated scripts, consider GPG key-based encryption instead

${YELLOW}DECOMPRESSION QUICK REFERENCE:${NC}
    Standard:  tar -xvf archive.tar.xz -C /target/dir
    Encrypted: $SCRIPT_NAME -x archive.tar.xz.gpg  (interactive)

EOF
}

#-------------------------------------------------------------------------------
# DISPLAY FILE INFORMATION
#-------------------------------------------------------------------------------

show_sizes() {
    local file="$1"
    [[ ! -f "$file" ]] && {
        log_error "File not found: $file"
        return 1
    }

    local size_bytes size_human
    size_bytes=$(get_file_size "$file")
    size_human=$(format_size "$size_bytes")

    echo -e "${GREEN}File:${NC} $file"
    echo -e "${GREEN}Size:${NC} $size_human ($size_bytes bytes)"
    return 0
}

#-------------------------------------------------------------------------------
# MAIN EXECUTION
#-------------------------------------------------------------------------------

main() {
    # Parse arguments
    if [[ $# -eq 0 ]]; then
        show_help
        exit 0
    fi

    # Initialize flags
    local compress="false"
    local split="false"
    local join="false"
    local encrypt_file=""
    local decrypt_file=""
    local decompress_file=""
    local upload_file=""
    local list_file=""
    local split_size="$DEFAULT_SPLIT_SIZE"

    # Parse options
    while [[ $# -gt 0 ]]; do
        case "$1" in
        -h | --help)
            show_help
            exit 0
            ;;
        -c | --compress)
            compress="true"
            shift
            ;;
        -s | --split)
            split="true"
            if [[ $# -gt 1 && "$2" =~ ^[0-9]+[MGK]?$ ]]; then
                split_size="$2"
                shift 2
            else
                shift
            fi
            ;;
        -j | --join)
            join="true"
            shift
            ;;
        -p | --protect)
            USE_GPG_ENCRYPTION="true"
            GPG_PASSPHRASE=$(prompt_passphrase "Enter encryption passphrase" "true")
            shift
            ;;
        -x | --extract)
            decrypt_file="${2:-}"
            shift 2
            ;;
        -d | --decompress)
            decompress_file="${2:-}"
            shift 2
            ;;
        -u | --upload)
            upload_file="${2:-}"
            shift 2
            ;;
        -l | --list)
            list_file="${2:-}"
            shift 2
            ;;
        -v | --verbose)
            VERBOSE="true"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
        esac
    done

    # Check dependencies first
    check_dependencies

    local exit_code=0

    # Execute operations in logical order
    if [[ "$compress" == "true" ]]; then
        compress_directory "$ARCHIVE_NAME" || exit_code=1
        # If split requested and compression succeeded, split the result
        if [[ "$split" == "true" && $exit_code -eq 0 ]]; then
            split_archive "$ARCHIVE_NAME" "$split_size" || exit_code=1
        fi
    elif [[ "$split" == "true" && -f "$ARCHIVE_NAME" ]]; then
        # Split existing archive
        split_archive "$ARCHIVE_NAME" "$split_size" || exit_code=1
    fi

    if [[ "$join" == "true" ]]; then
        reassemble_archive || exit_code=1
    fi

    if [[ -n "$encrypt_file" ]]; then
        encrypt_standalone "$encrypt_file" || exit_code=1
    fi

    if [[ -n "$decrypt_file" ]]; then
        decrypt_and_extract "$decrypt_file" || exit_code=1
    fi

    if [[ -n "$decompress_file" ]]; then
        interactive_decompress "$decompress_file" || exit_code=1
    fi

    if [[ -n "$upload_file" ]]; then
        upload_file "$upload_file" || exit_code=1
    fi

    if [[ -n "$list_file" ]]; then
        list_archive "$list_file" || exit_code=1
    fi

    # Final summary
    echo
    if [[ $exit_code -eq 0 ]]; then
        log_success "All operations completed successfully"
    else
        log_error "Some operations failed - review errors above"
    fi

    # Always cleanup secrets
    cleanup_secrets 2>/dev/null || true

    exit $exit_code
}

# Trap to ensure cleanup on exit/interrupt
trap 'cleanup_secrets 2>/dev/null || true' EXIT INT TERM

# Entry point
main "$@"
