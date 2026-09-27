#!/bin/bash

# Configuration
ARCHIVE_NAME="panty.tar.xz"
SPLIT_SIZE="10M"                    # Default split size
UPLOAD_URL="https://bashupload.com" # Active file sharing service

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to display usage/help
show_help() {
    cat <<EOF
${CYAN}Compression Utility Script${NC}

${YELLOW}USAGE:${NC}
    $0 [OPTIONS]

${YELLOW}OPTIONS:${NC}
    -h, --help              Show this help message
    -c, --compress          Compress current directory to ${ARCHIVE_NAME}
    -s, --split [SIZE]      Split archive into parts (default: ${SPLIT_SIZE})
    -j, --join              Reassemble split archive
    -u, --upload [FILE]     Upload file to ${UPLOAD_URL}
    -l, --list [FILE]       Show detailed archive information
    -v, --verbose           Verbose output

${YELLOW}FEATURES:${NC}
    ✓ Automatic integrity verification for ALL operations
    ✓ File size display after every operation
    ✓ Multi-threaded compression with xz -T0

${YELLOW}EXAMPLES:${NC}
    $0 -c                    # Compress current directory (auto-verified)
    $0 -s 20M -c             # Compress and split into 20MB parts (auto-verified)
    $0 -j                    # Reassemble split files (auto-verified)
    $0 -u ${ARCHIVE_NAME}     # Upload archive (pre-upload verification)
    $0 -l ${ARCHIVE_NAME}     # List archive contents

${YELLOW}DECOMPRESS:${NC}
    tar -xvf ${ARCHIVE_NAME} -C /target/directory

EOF
}

# Function to check if required commands exist
check_dependencies() {
    local deps=("tar" "xz" "curl" "split")
    local missing=()

    echo -e "${CYAN}Checking dependencies...${NC}"
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &>/dev/null; then
            missing+=("$dep")
        fi
    done

    if [ ${#missing[@]} -ne 0 ]; then
        echo -e "${RED}Error: Missing dependencies: ${missing[*]}${NC}" >&2
        exit 1
    fi
    echo -e "${GREEN}✓ All dependencies satisfied${NC}\n"
}

# Function to display file sizes
show_sizes() {
    local file="$1"
    if [ -f "$file" ]; then
        local size_bytes=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)
        local size_human=$(ls -lh "$file" | awk '{print $5}')
        echo -e "${GREEN}File:${NC} $file"
        echo -e "${GREEN}Size:${NC} $size_human ($size_bytes bytes)"
        return 0
    else
        echo -e "${RED}File not found: $file${NC}" >&2
        return 1
    fi
}

# Function to check archive integrity (MANDATORY - runs on all operations)
check_integrity() {
    local file="$1"
    local operation="$2"

    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: File $file not found${NC}" >&2
        return 1
    fi

    echo -e "\n${PURPLE}═══════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}   INTEGRITY VERIFICATION (${operation})${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════${NC}"

    local errors=0

    # Method 1: xz integrity check
    echo -ne "${YELLOW}Testing XZ compression integrity...${NC}"
    if xz -t "$file" 2>/dev/null; then
        echo -e "\r${GREEN}✓ XZ integrity check passed        ${NC}"
    else
        echo -e "\r${RED}✗ XZ integrity check failed        ${NC}" >&2
        ((errors++))
    fi

    # Method 2: Test tar archive integrity
    echo -ne "${YELLOW}Testing Tar archive structure...${NC}"
    if tar -tf "$file" &>/dev/null; then
        echo -e "\r${GREEN}✓ Tar archive is readable          ${NC}"
    else
        echo -e "\r${RED}✗ Tar archive is corrupted         ${NC}" >&2
        ((errors++))
    fi

    # Method 3: Quick content sampling (first 10 files)
    echo -ne "${YELLOW}Sampling archive contents...${NC}"
    local file_count=$(tar tf "$file" 2>/dev/null | wc -l)
    if [ $? -eq 0 ] && [ $file_count -gt 0 ]; then
        echo -e "\r${GREEN}✓ Archive contains $file_count files/directories${NC}"

        # Show sample if verbose
        if [ "$VERBOSE" = true ]; then
            echo -e "\n${CYAN}First 10 items in archive:${NC}"
            tar tf "$file" 2>/dev/null | head -10 | sed 's/^/  /'
        fi
    else
        echo -e "\r${RED}✗ Failed to read archive contents${NC}" >&2
        ((errors++))
    fi

    # Final result
    if [ $errors -eq 0 ]; then
        echo -e "\n${GREEN}✓ INTEGRITY CHECK PASSED - File is valid${NC}"
        show_sizes "$file"
        return 0
    else
        echo -e "\n${RED}✗ INTEGRITY CHECK FAILED - File may be corrupted${NC}" >&2
        return 1
    fi
}

# Function to compress current directory (with mandatory integrity check)
compress_directory() {
    local archive="$1"

    echo -e "\n${PURPLE}═══════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}   CREATING COMPRESSED ARCHIVE${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════${NC}\n"

    # Show what's being compressed
    echo -e "${YELLOW}Files to be archived:${NC}"
    ls -la | grep -v total | head -10
    [ $(ls -1 | wc -l) -gt 10 ] && echo -e "${YELLOW}... (and $(($(ls -1 | wc -l) - 10)) more)${NC}"

    echo -e "\n${CYAN}Command:${NC} tar cvf - * | xz -T0 -9e -c > ${archive}"
    echo -e "${YELLOW}Starting compression...${NC}\n"

    # Show progress indicator
    echo -ne "Compressing"
    local start_time=$(date +%s)

    # Perform compression
    if tar cvf - * 2>/dev/null | xz -T0 -9e -c >"$archive"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "\r${GREEN}✓ Compression completed in ${duration}s${NC}"

        # Show size info
        show_sizes "$archive"

        # Show xz details
        echo -e "\n${CYAN}Compression details:${NC}"
        xz --list "$archive"

        # MANDATORY integrity check
        check_integrity "$archive" "POST-COMPRESSION"
    else
        echo -e "\n${RED}✗ Compression failed${NC}" >&2
        return 1
    fi
}

# Function to split archive (with pre-split integrity check)
split_archive() {
    local file="$1"
    local size="${2:-$SPLIT_SIZE}"

    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: File $file not found${NC}" >&2
        return 1
    fi

    # MANDATORY integrity check before splitting
    if ! check_integrity "$file" "PRE-SPLIT"; then
        echo -e "${RED}✗ Cannot split corrupted archive${NC}" >&2
        return 1
    fi

    echo -e "\n${YELLOW}Splitting $file into ${size} parts...${NC}"
    split -b "$size" -d --verbose "$file" "${file}.part"

    echo -e "\n${GREEN}✓ Split complete${NC}"
    echo -e "\n${CYAN}Generated parts:${NC}"
    ls -lh "${file}".part*

    # Verify all parts were created
    local part_count=$(ls "${file}".part* 2>/dev/null | wc -l)
    echo -e "\n${GREEN}✓ Created $part_count part files${NC}"

    echo -e "\n${YELLOW}To reassemble:${NC}"
    echo "cat ${file}.part* > ${file}"
    echo -e "${YELLOW}(Reassembly will auto-verify integrity)${NC}"
}

# Function to reassemble split archive (with post-join integrity check)
reassemble_archive() {
    local base_name="${ARCHIVE_NAME}"

    # Try to find part files
    local part_files=$(ls ${base_name}.part* 2>/dev/null | sort)

    if [ -z "$part_files" ]; then
        echo -e "${RED}Error: No part files found (${base_name}.part*)${NC}" >&2
        return 1
    fi

    echo -e "\n${YELLOW}Reassembling ${base_name} from parts...${NC}"
    echo -e "Parts found: $(echo $part_files | wc -w)"

    # Show part details
    echo -e "\n${CYAN}Part details:${NC}"
    ls -lh ${base_name}.part*

    # Perform reassembly
    echo -ne "\nReassembling"
    if cat ${base_name}.part* >"$base_name"; then
        echo -e "\r${GREEN}✓ Reassembly complete        ${NC}"

        # MANDATORY integrity check after reassembly
        if check_integrity "$base_name" "POST-REASSEMBLY"; then
            echo -e "\n${GREEN}✓ Reassembly successful - Archive verified${NC}"
        else
            echo -e "\n${RED}✗ Reassembly produced corrupted archive${NC}" >&2
            return 1
        fi
    else
        echo -e "\n${RED}✗ Reassembly failed${NC}" >&2
        return 1
    fi
}

# Function to upload file (with pre-upload integrity check)
upload_file() {
    local file="$1"

    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: File $file not found${NC}" >&2
        return 1
    fi

    # MANDATORY integrity check before upload
    if ! check_integrity "$file" "PRE-UPLOAD"; then
        echo -e "${RED}✗ Cannot upload corrupted archive${NC}" >&2
        return 1
    fi

    echo -e "\n${YELLOW}Uploading $file to ${UPLOAD_URL}...${NC}"
    show_sizes "$file"

    # Upload with curl and show progress
    if curl -# --progress-bar -T "$file" "${UPLOAD_URL}/"; then
        echo -e "\n${GREEN}✓ Upload initiated successfully${NC}"
        echo -e "${YELLOW}Note: Files typically expire after 7 days${NC}"

        # Show alternative upload method
        echo -e "\n${CYAN}Alternative upload services:${NC}"
        echo "• bashupload.app - Supports password protection & custom expiration"
        echo "• curl bashupload.app -T \"$file\""
    else
        echo -e "\n${RED}✗ Upload failed${NC}" >&2
        return 1
    fi
}

# Function to list archive (with integrity check)
list_archive() {
    local file="$1"

    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: File $file not found${NC}" >&2
        return 1
    fi

    # MANDATORY integrity check before listing
    if ! check_integrity "$file" "PRE-LIST"; then
        echo -e "${RED}✗ Cannot list corrupted archive${NC}" >&2
        return 1
    fi

    echo -e "\n${PURPLE}═══════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}   ARCHIVE DETAILS${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════${NC}"

    # XZ details
    echo -e "\n${CYAN}Compression information:${NC}"
    xz --list "$file"

    # Archive contents
    echo -e "\n${CYAN}Archive contents:${NC}"
    local total_files=$(tar tf "$file" 2>/dev/null | wc -l)
    echo -e "Total items: ${GREEN}$total_files${NC}"

    echo -e "\n${YELLOW}First 20 items:${NC}"
    tar tvf "$file" 2>/dev/null | head -20 | while read line; do
        echo "  $line"
    done

    if [ $total_files -gt 20 ]; then
        echo -e "${YELLOW}  ... and $(($total_files - 20)) more items${NC}"
    fi
}

# Main script execution
main() {
    # Global verbose flag
    VERBOSE=false

    check_dependencies

    # Parse command line arguments
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi

    local compress=false
    local split=false
    local join=false
    local upload=""
    local list=""
    local split_size="$SPLIT_SIZE"

    while [[ $# -gt 0 ]]; do
        case $1 in
        -h | --help)
            show_help
            exit 0
            ;;
        -c | --compress)
            compress=true
            shift
            ;;
        -s | --split)
            split=true
            if [[ $2 =~ ^[0-9]+[MGK]?$ ]]; then
                split_size="$2"
                shift 2
            else
                shift
            fi
            ;;
        -j | --join)
            join=true
            shift
            ;;
        -u | --upload)
            upload="$2"
            shift 2
            ;;
        -l | --list)
            list="$2"
            shift 2
            ;;
        -v | --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}" >&2
            show_help
            exit 1
            ;;
        esac
    done

    # Execute requested operations with mandatory integrity checks
    local exit_code=0

    if [ "$compress" = true ]; then
        compress_directory "$ARCHIVE_NAME" || exit_code=1
    fi

    if [ "$split" = true ] && [ "$compress" = true ]; then
        split_archive "$ARCHIVE_NAME" "$split_size" || exit_code=1
    elif [ "$split" = true ]; then
        split_archive "$ARCHIVE_NAME" "$split_size" || exit_code=1
    fi

    if [ "$join" = true ]; then
        reassemble_archive || exit_code=1
    fi

    if [ -n "$upload" ]; then
        upload_file "$upload" || exit_code=1
    fi

    if [ -n "$list" ]; then
        list_archive "$list" || exit_code=1
    fi

    # Final summary if multiple operations
    if [ $exit_code -eq 0 ]; then
        echo -e "\n${GREEN}✓ All operations completed successfully with integrity verification${NC}"
    else
        echo -e "\n${RED}✗ Some operations failed - check errors above${NC}" >&2
    fi

    exit $exit_code
}

# Run main function with all arguments
main "$@"
