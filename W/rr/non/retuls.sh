#!/usr/bin/env bash
#
# install-re-tools.sh
# Modular installer for a Windows reverse engineering toolkit on Linux.
#
# Supports: Debian/Ubuntu, Arch, Fedora/RHEL
# Usage:    chmod +x install-re-tools.sh && sudo ./install-re-tools.sh
#
# Author:  (you)
# License: MIT
#

set -uo pipefail
# NOTE: we intentionally do NOT use `set -e` so one failed tool
# doesn't abort the whole run. Each module tracks its own status.

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_VERSION="1.0.0"
REPORT_DIR="${REPORT_DIR:-/var/log/re-toolkit}"
TOOL_PREFIX="/usr/local/bin"
OPT_PREFIX="/opt"

# =============================================================================
# COLORS & LOGGING
# =============================================================================

if [[ -t 1 ]]; then
    RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
    BLUE='\033[0;34m'; CYAN='\033[0;36m'; MAGENTA='\033[0;35m'; NC='\033[0m'
else
    RED=''; GREEN=''; YELLOW=''; BLUE=''; CYAN=''; MAGENTA=''; NC=''
fi

log()    { echo -e "${BLUE}[*]${NC} $*"; }
ok()     { echo -e "${GREEN}[+]${NC} $*"; }
warn()   { echo -e "${YELLOW}[!]${NC} $*"; }
err()    { echo -e "${RED}[x]${NC} $*" >&2; }
skip()   { echo -e "${MAGENTA}[-]${NC} $*"; }
header() { echo -e "\n${CYAN}==== $* ====${NC}"; }

# =============================================================================
# RESULT REGISTRY
# =============================================================================
# Each entry: name|status|location|version|notes
#   status = INSTALLED | SKIPPED | FAILED | MANUAL
# =============================================================================

declare -a RESULTS=()

record_result() {
    local name="$1" status="$2" location="$3" version="$4" notes="${5:-}"
    RESULTS+=("${name}|${status}|${location}|${version}|${notes}")
}

# =============================================================================
# DISTRO DETECTION
# =============================================================================

detect_distro() {
    if [[ -f /etc/os-release ]]; then
        # shellcheck disable=SC1091
        . /etc/os-release
        echo "${ID,,}"
    else
        echo "unknown"
    fi
}

DISTRO="$(detect_distro)"

# =============================================================================
# PACKAGE MANAGER ABSTRACTION
# =============================================================================

pkg_update() {
    case "$DISTRO" in
        ubuntu|debian|linuxmint|pop|kali)     apt-get update -y ;;
        arch|manjaro|endeavouros)             pacman -Sy --noconfirm ;;
        fedora|rhel|centos|rocky|almalinux)   dnf makecache -y ;;
        *) err "Unsupported distro: $DISTRO"; return 1 ;;
    esac
}

pkg_install() {
    case "$DISTRO" in
        ubuntu|debian|linuxmint|pop|kali)     apt-get install -y "$@" ;;
        arch|manjaro|endeavouros)             pacman -S --noconfirm --needed "$@" ;;
        fedora|rhel|centos|rocky|almalinux)   dnf install -y "$@" ;;
    esac
}

pkg_available() {
    case "$DISTRO" in
        ubuntu|debian|linuxmint|pop|kali)     apt-cache show "$1" >/dev/null 2>&1 ;;
        arch|manjaro|endeavouros)             pacman -Si "$1" >/dev/null 2>&1 ;;
        fedora|rhel|centos|rocky|almalinux)   dnf info "$1" >/dev/null 2>&1 ;;
        *) return 1 ;;
    esac
}

# =============================================================================
# PREFLIGHT
# =============================================================================

preflight() {
    header "Preflight checks"

    if [[ $EUID -ne 0 ]]; then
        err "This script must be run as root (use sudo)."
        exit 1
    fi

    log "Distribution detected: ${DISTRO}"

    case "$DISTRO" in
        ubuntu|debian|linuxmint|pop|kali|arch|manjaro|endeavouros|fedora|rhel|centos|rocky|almalinux)
            ok "Distro supported."
            ;;
        *)
            err "Unsupported distro: $DISTRO"
            exit 1
            ;;
    esac

    mkdir -p "$REPORT_DIR"
}

# =============================================================================
# MODULE: Base dependencies
# =============================================================================

install_base_deps() {
    header "Module: base dependencies"

    pkg_update || { err "pkg_update failed"; return 1; }

    case "$DISTRO" in
        ubuntu|debian|linuxmint|pop|kali)
            pkg_install curl wget git unzip openjdk-17-jdk python3 python3-pip \
                        build-essential pkg-config
            ;;
        arch|manjaro|endeavouros)
            pkg_install curl wget git unzip jdk17-openjdk python python-pip \
                        base-devel pkgconf
            ;;
        fedora|rhel|centos|rocky|almalinux)
            pkg_install curl wget git unzip java-17-openjdk-devel python3 python3-pip \
                        @development-tools
            ;;
    esac

    if [[ $? -eq 0 ]]; then
        ok "Base dependencies installed."
        record_result "Base dependencies" "INSTALLED" "system" "-" \
            "curl wget git unzip JDK17 python3 build tools"
        return 0
    else
        err "Base dependency installation failed."
        record_result "Base dependencies" "FAILED" "-" "-" "See above"
        return 1
    fi
}

# =============================================================================
# MODULE: Radare2
# =============================================================================

install_radare2() {
    header "Module: Radare2"

    if command -v r2 >/dev/null 2>&1; then
        local ver; ver="$(r2 -v 2>/dev/null | head -n1 || echo unknown)"
        skip "Radare2 already installed: $ver"
        record_result "Radare2" "SKIPPED" "$(command -v r2)" "$ver" "Already present"
        return 0
    fi

    local tmp; tmp="$(mktemp -d)"
    if git clone --depth=1 https://github.com/radareorg/radare2 "$tmp/radare2" \
       && "$tmp/radare2/sys/install.sh"; then
        local ver; ver="$(r2 -v 2>/dev/null | head -n1 || echo unknown)"
        ok "Radare2 installed: $ver"
        record_result "Radare2" "INSTALLED" "$(command -v r2)" "$ver" "Built from source"
        rm -rf "$tmp"
        return 0
    else
        err "Radare2 build/install failed."
        record_result "Radare2" "FAILED" "-" "-" "Source build failed"
        rm -rf "$tmp"
        return 1
    fi
}

# =============================================================================
# MODULE: Ghidra
# =============================================================================

install_ghidra() {
    header "Module: Ghidra"

    local ghidra_ver="11.2.1"
    local ghidra_date="20241105"

    if command -v ghidra >/dev/null 2>&1 || [[ -d "${OPT_PREFIX}/ghidra" ]]; then
        skip "Ghidra already installed."
        record_result "Ghidra" "SKIPPED" "${OPT_PREFIX}/ghidra" "$ghidra_ver" "Already present"
        return 0
    fi

    local url="https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_${ghidra_ver}_build/ghidra_${ghidra_ver}_PUBLIC_${ghidra_date}.zip"

    log "Downloading Ghidra ${ghidra_ver}..."
    if ! wget -q --show-progress -O /tmp/ghidra.zip "$url"; then
        err "Ghidra download failed."
        record_result "Ghidra" "FAILED" "-" "$ghidra_ver" "Download failed"
        return 1
    fi

    if unzip -q /tmp/ghidra.zip -d "${OPT_PREFIX}/"; then
        mv "${OPT_PREFIX}"/ghidra_* "${OPT_PREFIX}/ghidra"
        rm -f /tmp/ghidra.zip

        cat > "${TOOL_PREFIX}/ghidra" <<'EOF'
#!/usr/bin/env bash
exec /opt/ghidra/ghidraRun "$@"
EOF
        chmod +x "${TOOL_PREFIX}/ghidra"

        ok "Ghidra installed to ${OPT_PREFIX}/ghidra"
        record_result "Ghidra" "INSTALLED" "${OPT_PREFIX}/ghidra" "$ghidra_ver" \
            "Launcher: ${TOOL_PREFIX}/ghidra"
        return 0
    else
        err "Ghidra extraction failed."
        record_result "Ghidra" "FAILED" "-" "$ghidra_ver" "Unzip failed"
        return 1
    fi
}

# =============================================================================
# MODULE: IDA Free
# =============================================================================

install_ida_free() {
    header "Module: IDA Free"

    if command -v ida >/dev/null 2>&1 || [[ -d /opt/idafree* ]]; then
        skip "IDA Free already installed."
        record_result "IDA Free" "SKIPPED" "$(command -v ida 2>/dev/null || echo /opt/idafree*)" \
            "unknown" "Already present"
        return 0
    fi

    case "$DISTRO" in
        ubuntu|debian|linuxmint|pop|kali)
            if pkg_available ida-free; then
                if pkg_install ida-free; then
                    ok "IDA Free installed via apt."
                    record_result "IDA Free" "INSTALLED" "$(command -v ida 2>/dev/null || echo /opt)" \
                        "repo" "Installed via apt"
                    return 0
                fi
            fi
            ;;
    esac

    warn "IDA Free requires manual download."
    warn "  https://hex-rays.com/ida-free/"
    record_result "IDA Free" "MANUAL" "-" "-" \
        "Download manually: https://hex-rays.com/ida-free/"
    return 0
}

# =============================================================================
# MODULE: msitools + innoextract
# =============================================================================

install_installer_tools() {
    header "Module: installer extraction (msitools, innoextract)"

    local ok_msi=0 ok_inno=0

    if pkg_install msitools; then ok_msi=1; fi
    if pkg_install innoextract; then ok_inno=1; fi

    if [[ $ok_msi -eq 1 ]]; then
        ok "msitools installed (msiextract, msiinfo, msidump)."
        record_result "msitools" "INSTALLED" "$(command -v msiextract)" "-" \
            "msiextract / msiinfo / msidump"
    else
        err "msitools installation failed."
        record_result "msitools" "FAILED" "-" "-" "pkg_install failed"
    fi

    if [[ $ok_inno -eq 1 ]]; then
        ok "innoextract installed."
        record_result "innoextract" "INSTALLED" "$(command -v innoextract)" \
            "$(innoextract --version 2>/dev/null | head -n1 || echo '-')" \
            "Inno Setup unpacker"
    else
        err "innoextract installation failed."
        record_result "innoextract" "FAILED" "-" "-" "pkg_install failed"
    fi
}

# =============================================================================
# MODULE: readpe / pev
# =============================================================================

install_pev() {
    header "Module: readpe (pev toolkit)"

    if command -v readpe >/dev/null 2>&1; then
        skip "readpe already installed."
        record_result "readpe (pev)" "SKIPPED" "$(command -v readpe)" "-" "Already present"
        return 0
    fi

    if pkg_install pev; then
        ok "pev installed via package manager."
        record_result "readpe (pev)" "INSTALLED" "$(command -v readpe 2>/dev/null || echo '-')" \
            "repo" "Via package manager"
        return 0
    fi

    warn "pev not in repos; building from source..."
    local tmp; tmp="$(mktemp -d)"
    if git clone --depth=1 https://github.com/merces/pev "$tmp/pev" \
       && make -C "$tmp/pev" -j"$(nproc)" \
       && make -C "$tmp/pev" install; then
        ok "pev built and installed from source."
        record_result "readpe (pev)" "INSTALLED" "$(command -v readpe 2>/dev/null || echo '-')" \
            "source" "Built from source"
        rm -rf "$tmp"
        return 0
    else
        err "pev build failed."
        record_result "readpe (pev)" "FAILED" "-" "-" "Source build failed"
        rm -rf "$tmp"
        return 1
    fi
}

# =============================================================================
# MODULE: ht (hte)
# =============================================================================

install_ht() {
    header "Module: ht (hte)"

    if command -v ht >/dev/null 2>&1 || command -v hte >/dev/null 2>&1; then
        skip "ht already installed."
        record_result "ht (hte)" "SKIPPED" "$(command -v ht 2>/dev/null || command -v hte)" \
            "-" "Already present"
        return 0
    fi

    local tmp; tmp="$(mktemp -d)"
    if ! git clone --depth=1 https://github.com/htdump/ht "$tmp/ht" 2>/dev/null; then
        warn "ht clone failed; skipping (optional tool)."
        record_result "ht (hte)" "FAILED" "-" "-" "Upstream clone failed (optional)"
        rm -rf "$tmp"
        return 0
    fi

    if ( cd "$tmp/ht" && ./configure && make -j"$(nproc)" && make install ); then
        ok "ht installed."
        record_result "ht (hte)" "INSTALLED" "$(command -v ht 2>/dev/null || echo '-')" \
            "source" "Built from source"
    else
        warn "ht build failed; skipping (optional)."
        record_result "ht (hte)" "FAILED" "-" "-" "Source build failed (optional)"
    fi
    rm -rf "$tmp"
}

# =============================================================================
# MODULE: pefile + capstone (Python)
# =============================================================================

install_pefile() {
    header "Module: pefile + capstone (Python)"

    local installed=0
    if pip3 install --upgrade pefile capstone 2>/dev/null; then
        installed=1
    elif pip3 install --break-system-packages --upgrade pefile capstone 2>/dev/null; then
        installed=1
    fi

    if [[ $installed -eq 1 ]]; then
        local pefile_ver; pefile_ver="$(python3 -c 'import pefile; print(pefile.__version__)' 2>/dev/null || echo unknown)"
        ok "pefile + capstone installed (pefile $pefile_ver)."
        record_result "pefile (Python)" "INSTALLED" "$(python3 -c 'import pefile, os; print(os.path.dirname(pefile.__file__))' 2>/dev/null || echo 'site-packages')" \
            "$pefile_ver" "Python module"
        record_result "capstone (Python)" "INSTALLED" "site-packages" \
            "$(python3 -c 'import capstone; print(capstone.__version__)' 2>/dev/null || echo unknown)" \
            "Python module"
    else
        err "pefile/capstone installation failed."
        record_result "pefile (Python)" "FAILED" "-" "-" "pip install failed"
    fi
}

# =============================================================================
# MODULE: Wine
# =============================================================================

install_wine() {
    header "Module: Wine (dynamic analysis)"

    if command -v wine >/dev/null 2>&1; then
        skip "Wine already installed."
        record_result "Wine" "SKIPPED" "$(command -v wine)" \
            "$(wine --version 2>/dev/null || echo unknown)" "Already present"
        return 0
    fi

    case "$DISTRO" in
        ubuntu|debian|linuxmint|pop|kali)
            dpkg --add-architecture i386 || true
            pkg_update
            pkg_install wine wine32 wine64 2>/dev/null || pkg_install wine
            ;;
        arch|manjaro|endeavouros)
            pkg_install wine
            ;;
        fedora|rhel|centos|rocky|almalinux)
            pkg_install wine
            ;;
    esac

    if command -v wine >/dev/null 2>&1; then
        ok "Wine installed."
        record_result "Wine" "INSTALLED" "$(command -v wine)" \
            "$(wine --version 2>/dev/null || echo unknown)" "Run 'winecfg' once"
    else
        err "Wine installation failed."
        record_result "Wine" "FAILED" "-" "-" "See above"
    fi
}

# =============================================================================
# MODULE: Extras
# =============================================================================

install_extras() {
    header "Module: extras"

    pkg_install binutils file xxd foremost 2>/dev/null || \
        pkg_install binutils file foremost 2>/dev/null || true

    ok "Extras installed (best-effort)."
    record_result "Extras" "INSTALLED" "system" "-" \
        "binutils, file, xxd, foremost (best-effort)"
}

# =============================================================================
# REPORT GENERATION
# =============================================================================

write_report() {
    header "Writing report"

    local ts; ts="$(date +%Y%m%d_%H%M%S)"
    local human_ts; human_ts="$(date '+%Y-%m-%d %H:%M:%S %Z')"
    local report_file="${REPORT_DIR}/re-toolkit-install-${ts}.txt"

    {
        echo "================================================================="
        echo " Reverse Engineering Toolkit - Installation Report"
        echo "================================================================="
        echo " Generated : ${human_ts}"
        echo " Host      : $(hostname)"
        echo " Distro    : ${DISTRO}"
        echo " Kernel    : $(uname -r)"
        echo " Script    : install-re-tools.sh v${SCRIPT_VERSION}"
        echo "================================================================="
        echo
        printf "%-22s %-11s %-32s %-14s %s\n" \
               "TOOL" "STATUS" "LOCATION" "VERSION" "NOTES"
        printf "%-22s %-11s %-32s %-14s %s\n" \
               "----------------------" "-----------" \
               "--------------------------------" "--------------" \
               "------------------------------"

        local installed=0 skipped=0 failed=0 manual=0

        for entry in "${RESULTS[@]}"; do
            IFS='|' read -r name status location version notes <<<"$entry"
            printf "%-22s %-11s %-32s %-14s %s\n" \
                   "$name" "$status" "$location" "$version" "$notes"

            case "$status" in
                INSTALLED) ((installed++)) ;;
                SKIPPED)   ((skipped++)) ;;
                FAILED)    ((failed++)) ;;
                MANUAL)    ((manual++)) ;;
            esac
        done

        echo
        echo "-----------------------------------------------------------------"
        echo " Summary"
        echo "-----------------------------------------------------------------"
        printf "  Installed : %d\n" "$installed"
        printf "  Skipped   : %d\n" "$skipped"
        printf "  Failed    : %d\n" "$failed"
        printf "  Manual    : %d\n" "$manual"
        echo
        echo "-----------------------------------------------------------------"
        echo " Quick reference"
        echo "-----------------------------------------------------------------"
        cat <<'EOF'
  Ghidra             ->  ghidra
  IDA Free           ->  ida  (or manual download)
  Radare2            ->  r2 / rabin2 / radare2
  msitools (MSI)     ->  msiextract file.msi -C outdir
                         msiinfo    file.msi
                         msidump    file.msi
  Inno Setup         ->  innoextract installer.exe
  readpe / pev       ->  readpe file.exe
                         pescan file.exe
                         pesec  file.exe
  ht (hte)           ->  ht file.exe
  pefile (Python)    ->  python3 -c "import pefile; pe=pefile.PE('file.exe')"
  Wine               ->  wine file.exe
EOF
        echo
        echo "================================================================="
        echo " End of report"
        echo "================================================================="
    } | tee "$report_file"

    echo
    ok "Report saved to: ${report_file}"
    # Also drop a stable "latest" symlink for convenience
    ln -sf "$report_file" "${REPORT_DIR}/latest.txt" 2>/dev/null || true
    ok "Latest symlink: ${REPORT_DIR}/latest.txt"
}

# =============================================================================
# MAIN
# =============================================================================

main() {
    echo -e "${CYAN}"
    cat <<'BANNER'
  ____  _____   _____           _ _    _
 |  _ \| ____| |_   _|__   ___ | | | _(_) |_
 | |_) |  _|     | |/ _ \ / _ \| | __| | __|
 |  _ <| |___    | | (_) | (_) | | |_| | |_
 |_| \_\_____|   |_|\___/ \___/|_|\__|_|\__|

 Modular Windows RE toolkit installer for Linux
BANNER
    echo -e "${NC}"

    preflight

    # ---- Modules ----
    # Each module is independent and records its own result.
    # Order matters only for dependencies (base_deps must be first).
    install_base_deps
    install_radare2
    install_ghidra
    install_ida_free
    install_installer_tools
    install_pev
    install_ht
    install_pefile
    install_wine
    install_extras

    # ---- Report ----
    write_report
}

main "$@"