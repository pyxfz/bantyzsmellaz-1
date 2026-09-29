#!/usr/bin/env bash
#
# install-re-tools.sh
# Modular installer for a Windows reverse engineering toolkit on Linux.
#
# Supports: Debian/Ubuntu, Arch, Fedora/RHEL
# Usage:    chmod +x install-re-tools.sh && sudo ./install-re-tools.sh
#
# Design notes:
#  - Script must be run with sudo (for system packages).
#  - User-space tools (Radare2) are installed as the invoking user (SUDO_USER),
#    NOT as root, to respect their security model and avoid permission issues.
#  - Ghidra requires JDK 21; JAVA_HOME is set persistently via /etc/profile.d.
#  - The 'ht' tool was removed: its upstream repo no longer exists.
#

set -uo pipefail
# NOTE: intentionally NOT using `set -e`; each module tracks its own status.

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_VERSION="1.1.0"
REPORT_DIR="${REPORT_DIR:-/var/log/re-toolkit}"
TOOL_PREFIX="/usr/local/bin"
OPT_PREFIX="/opt"

GHIDRA_VER="11.2.1"
GHIDRA_DATE="20241105"

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
# USER CONTEXT
# =============================================================================
# We must distinguish between the root user (running this script) and the
# real user (SUDO_USER) whose home we install user-space tools into.

REAL_USER="${SUDO_USER:-}"
if [[ -z "$REAL_USER" || "$REAL_USER" == "root" ]]; then
    REAL_USER="root"
    REAL_HOME="/root"
else
    REAL_HOME="$(getent passwd "$REAL_USER" | cut -d: -f6)"
fi

# Helper: run a command as the real user (when we're root)
as_user() {
    if [[ "$REAL_USER" == "root" ]]; then
        "$@"
    else
        sudo -u "$REAL_USER" -H "$@"
    fi
}

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
    log "Real user (for user-space tools): ${REAL_USER} (home: ${REAL_HOME})"

    case "$DISTRO" in
        ubuntu|debian|linuxmint|pop|kali|arch|manjaro|endeavouros|fedora|rhel|centos|rocky|almalinux)
            ok "Distro supported."
            ;;
        *)
            err "Unsupported distro: $DISTRO"
            exit 1
            ;;
    esac

    if [[ "$REAL_USER" == "root" ]]; then
        warn "No SUDO_USER detected; user-space tools will install to /root."
        warn "Consider running as: sudo -u <youruser> ...  (or via sudo from your shell)."
    fi

    mkdir -p "$REPORT_DIR"
}

# =============================================================================
# MODULE: Base dependencies (incl. JDK 21 for Ghidra)
# =============================================================================

install_base_deps() {
    header "Module: base dependencies (incl. JDK 21)"

    pkg_update || { err "pkg_update failed"; return 1; }

    local jdk_pkg
    case "$DISTRO" in
        ubuntu|debian|linuxmint|pop|kali)
            jdk_pkg="openjdk-21-jdk"
            # Fall back to 17 if 21 isn't available on this release
            if ! pkg_available "$jdk_pkg"; then
                warn "openjdk-21-jdk not available; falling back to openjdk-17-jdk."
                jdk_pkg="openjdk-17-jdk"
            fi
            pkg_install curl wget git unzip "$jdk_pkg" \
                        python3 python3-pip python3-venv \
                        build-essential pkg-config
            ;;
        arch|manjaro|endeavouros)
            jdk_pkg="jdk21-openjdk"
            if ! pkg_available "$jdk_pkg"; then
                warn "jdk21-openjdk not available; falling back to jdk-openjdk."
                jdk_pkg="jdk-openjdk"
            fi
            pkg_install curl wget git unzip "$jdk_pkg" \
                        python python-pip \
                        base-devel pkgconf
            ;;
        fedora|rhel|centos|rocky|almalinux)
            jdk_pkg="java-21-openjdk-devel"
            if ! pkg_available "$jdk_pkg"; then
                warn "java-21-openjdk-devel not available; falling back to java-17-openjdk-devel."
                jdk_pkg="java-17-openjdk-devel"
            fi
            pkg_install curl wget git unzip "$jdk_pkg" \
                        python3 python3-pip \
                        @development-tools
            ;;
    esac

    if [[ $? -eq 0 ]]; then
        ok "Base dependencies installed (JDK package: ${jdk_pkg})."
        record_result "Base dependencies" "INSTALLED" "system" "-" \
            "curl wget git unzip ${jdk_pkg} python3 build tools"
        return 0
    else
        err "Base dependency installation failed."
        record_result "Base dependencies" "FAILED" "-" "-" "See above"
        return 1
    fi
}

# =============================================================================
# MODULE: Java runtime configuration (for Ghidra)
# =============================================================================

configure_java() {
    header "Module: Java (JAVA_HOME for Ghidra)"

    if ! command -v javac >/dev/null 2>&1; then
        err "javac not found; cannot configure JAVA_HOME."
        record_result "Java runtime" "FAILED" "-" "-" "javac missing"
        return 1
    fi

    # Resolve JDK home from javac's real path
    local javac_path jdk_home
    javac_path="$(readlink -f "$(command -v javac)")"
    jdk_home="$(dirname "$(dirname "$javac_path")")"

    if [[ ! -x "${jdk_home}/bin/java" ]]; then
        err "Resolved JAVA_HOME looks invalid: ${jdk_home}"
        record_result "Java runtime" "FAILED" "-" "-" "Invalid JAVA_HOME"
        return 1
    fi

    local java_ver
    java_ver="$("${jdk_home}/bin/java" -version 2>&1 | head -n1 | tr -d '"' || echo unknown)"

    # Persist globally
    cat > /etc/profile.d/re-toolkit-java.sh <<EOF
# Set by install-re-tools.sh
export JAVA_HOME="${jdk_home}"
export PATH="\$JAVA_HOME/bin:\$PATH"
EOF
    chmod 0644 /etc/profile.d/re-toolkit-java.sh

    # Also make JDK discoverable via alternatives (Debian/Ubuntu only, best-effort)
    if [[ "$DISTRO" == "ubuntu" || "$DISTRO" == "debian" || "$DISTRO" == "linuxmint" || "$DISTRO" == "pop" || "$DISTRO" == "kali" ]]; then
        if [[ -x /usr/sbin/update-java-alternatives || -x /usr/bin/update-java-alternatives ]]; then
            local jdk_name
            jdk_name="$(basename "$jdk_home")"
            update-java-alternatives -s "$jdk_name" >/dev/null 2>&1 || true
        fi
    fi

    ok "JAVA_HOME set to: ${jdk_home} (${java_ver})"
    record_result "Java runtime" "INSTALLED" "$jdk_home" "$java_ver" \
        "Persisted via /etc/profile.d/re-toolkit-java.sh"
    return 0
}

# =============================================================================
# MODULE: Radare2 (installed as real user; sys/user.sh avoids root refusal)
# =============================================================================

install_radare2() {
    header "Module: Radare2 (user-space install)"

    # Check both current PATH and the real user's ~/.local/bin
    local user_r2="${REAL_HOME}/.local/bin/r2"

    if [[ -x "$user_r2" ]]; then
        local ver; ver="$("$user_r2" -v 2>/dev/null | head -n1 || echo unknown)"
        skip "Radare2 already installed: $ver"
        record_result "Radare2" "SKIPPED" "$user_r2" "$ver" "Already present"
        return 0
    fi
    if command -v r2 >/dev/null 2>&1; then
        local ver; ver="$(r2 -v 2>/dev/null | head -n1 || echo unknown)"
        skip "Radare2 already installed (system PATH): $ver"
        record_result "Radare2" "SKIPPED" "$(command -v r2)" "$ver" "Already present"
        return 0
    fi

    local tmp; tmp="$(mktemp -d)"
    chmod 755 "$tmp"

    if ! as_user git clone --depth=1 https://github.com/radareorg/radare2 "$tmp/radare2"; then
        err "Radare2 clone failed."
        record_result "Radare2" "FAILED" "-" "-" "git clone failed"
        rm -rf "$tmp"
        return 1
    fi
    chown -R "$REAL_USER":"$REAL_USER" "$tmp/radare2" 2>/dev/null || true

    # sys/user.sh is the KEY FIX: installs to ~/.local without sudo,
    # so Radare2 does NOT refuse to run as root.
    if as_user bash "$tmp/radare2/sys/user.sh"; then
        local ver="unknown"
        [[ -x "$user_r2" ]] && ver="$("$user_r2" -v 2>/dev/null | head -n1 || echo unknown)"
        ok "Radare2 installed to ${REAL_HOME}/.local (${ver})"
        record_result "Radare2" "INSTALLED" "${REAL_HOME}/.local/bin/r2" "$ver" \
            "Built from source via sys/user.sh (no sudo)"
        warn "Ensure ${REAL_HOME}/.local/bin is in ${REAL_USER}'s PATH."
        rm -rf "$tmp"
        return 0
    else
        err "Radare2 build/install failed."
        record_result "Radare2" "FAILED" "-" "-" "sys/user.sh failed"
        rm -rf "$tmp"
        return 1
    fi
}

# =============================================================================
# MODULE: Ghidra
# =============================================================================

install_ghidra() {
    header "Module: Ghidra"

    if [[ -d "${OPT_PREFIX}/ghidra" ]]; then
        skip "Ghidra already installed at ${OPT_PREFIX}/ghidra."
        record_result "Ghidra" "SKIPPED" "${OPT_PREFIX}/ghidra" "$GHIDRA_VER" "Already present"
        return 0
    fi

    # Ensure JAVA_HOME is set for this session
    if [[ -f /etc/profile.d/re-toolkit-java.sh ]]; then
        # shellcheck disable=SC1091
        . /etc/profile.d/re-toolkit-java.sh
    fi

    if [[ -z "${JAVA_HOME:-}" || ! -x "${JAVA_HOME}/bin/java" ]]; then
        err "JAVA_HOME is not set or invalid; cannot install Ghidra."
        record_result "Ghidra" "FAILED" "-" "$GHIDRA_VER" "JAVA_HOME not set"
        return 1
    fi

    local url="https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_${GHIDRA_VER}_build/ghidra_${GHIDRA_VER}_PUBLIC_${GHIDRA_DATE}.zip"

    log "Downloading Ghidra ${GHIDRA_VER}..."
    if ! wget -q --show-progress -O /tmp/ghidra.zip "$url"; then
        err "Ghidra download failed."
        record_result "Ghidra" "FAILED" "-" "$GHIDRA_VER" "Download failed"
        return 1
    fi

    if unzip -q /tmp/ghidra.zip -d "${OPT_PREFIX}/"; then
        mv "${OPT_PREFIX}"/ghidra_* "${OPT_PREFIX}/ghidra"
        rm -f /tmp/ghidra.zip

        # Wrapper that exports JAVA_HOME explicitly so Ghidra always finds it
        cat > "${TOOL_PREFIX}/ghidra" <<EOF
#!/usr/bin/env bash
export JAVA_HOME="${JAVA_HOME}"
export PATH="\$JAVA_HOME/bin:\$PATH"
exec /opt/ghidra/ghidraRun "\$@"
EOF
        chmod +x "${TOOL_PREFIX}/ghidra"

        ok "Ghidra installed to ${OPT_PREFIX}/ghidra"
        record_result "Ghidra" "INSTALLED" "${OPT_PREFIX}/ghidra" "$GHIDRA_VER" \
            "Launcher: ${TOOL_PREFIX}/ghidra (JAVA_HOME=${JAVA_HOME})"
        return 0
    else
        err "Ghidra extraction failed."
        record_result "Ghidra" "FAILED" "-" "$GHIDRA_VER" "Unzip failed"
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
        record_result "IDA Free" "SKIPPED" \
            "$(command -v ida 2>/dev/null || echo /opt/idafree*)" \
            "unknown" "Already present"
        return 0
    fi

    case "$DISTRO" in
        ubuntu|debian|linuxmint|pop|kali)
            if pkg_available ida-free; then
                if pkg_install ida-free; then
                    ok "IDA Free installed via apt."
                    record_result "IDA Free" "INSTALLED" \
                        "$(command -v ida 2>/dev/null || echo /opt)" \
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
        record_result "readpe (pev)" "INSTALLED" \
            "$(command -v readpe 2>/dev/null || echo '-')" \
            "repo" "Via package manager"
        return 0
    fi

    warn "pev not in repos; building from source..."
    local tmp; tmp="$(mktemp -d)"
    if git clone --depth=1 https://github.com/merces/pev "$tmp/pev" \
       && make -C "$tmp/pev" -j"$(nproc)" \
       && make -C "$tmp/pev" install; then
        ok "pev built and installed from source."
        record_result "readpe (pev)" "INSTALLED" \
            "$(command -v readpe 2>/dev/null || echo '-')" \
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
# MODULE: pefile + capstone (Python)
# =============================================================================
# NOTE: 'ht' module was removed. Its upstream repo (htdump/ht) no longer exists
# and caused spurious GitHub credential prompts. readpe/pev covers the use case.

install_pefile() {
    header "Module: pefile + capstone (Python)"

    local installed=0
    if pip3 install --upgrade pefile capstone 2>/dev/null; then
        installed=1
    elif pip3 install --break-system-packages --upgrade pefile capstone 2>/dev/null; then
        installed=1
    fi

    if [[ $installed -eq 1 ]]; then
        local pefile_ver
        pefile_ver="$(python3 -c 'import pefile; print(pefile.__version__)' 2>/dev/null || echo unknown)"
        ok "pefile + capstone installed (pefile ${pefile_ver})."
        record_result "pefile (Python)" "INSTALLED" \
            "$(python3 -c 'import pefile, os; print(os.path.dirname(pefile.__file__))' 2>/dev/null || echo 'site-packages')" \
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
        echo " Real user : ${REAL_USER} (home: ${REAL_HOME})"
        echo " Script    : install-re-tools.sh v${SCRIPT_VERSION}"
        echo "================================================================="
        echo
        printf "%-22s %-11s %-40s %-16s %s\n" \
               "TOOL" "STATUS" "LOCATION" "VERSION" "NOTES"
        printf "%-22s %-11s %-40s %-16s %s\n" \
               "----------------------" "-----------" \
               "----------------------------------------" "----------------" \
               "------------------------------"

        local installed=0 skipped=0 failed=0 manual=0

        for entry in "${RESULTS[@]}"; do
            IFS='|' read -r name status location version notes <<<"$entry"
            printf "%-22s %-11s %-40s %-16s %s\n" \
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
        echo " Environment notes"
        echo "-----------------------------------------------------------------"
        echo "  JAVA_HOME      : ${JAVA_HOME:-<not set in this shell>}"
        echo "  Java profile   : /etc/profile.d/re-toolkit-java.sh"
        if [[ "$REAL_USER" != "root" ]]; then
            echo "  User PATH hint : add '${REAL_HOME}/.local/bin' to PATH"
            echo "                   (Radare2 installs there)."
        fi
        echo
        echo "-----------------------------------------------------------------"
        echo " Quick reference"
        echo "-----------------------------------------------------------------"
        cat <<'EOF'
  Ghidra             ->  ghidra
  IDA Free           ->  ida  (or manual download)
  Radare2            ->  r2 / rabin2 / radare2   (~/.local/bin)
  msitools (MSI)     ->  msiextract file.msi -C outdir
                         msiinfo    file.msi
                         msidump    file.msi
  Inno Setup         ->  innoextract installer.exe
  readpe / pev       ->  readpe file.exe
                         pescan file.exe
                         pesec  file.exe
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

    # ---- Modules (each independent, records its own result) ----
    install_base_deps        # must run first (provides JDK 21)
    configure_java           # must run before Ghidra
    install_radare2          # user-space, uses sys/user.sh
    install_ghidra           # needs JAVA_HOME from configure_java
    install_ida_free         # manual/repo
    install_installer_tools  # msitools + innoextract
    install_pev              # readpe (pev)
    install_pefile           # Python pefile + capstone
    install_wine             # dynamic analysis
    install_extras           # binutils, file, xxd, foremost
    # NOTE: install_ht was removed (dead upstream, caused auth prompts).

    # ---- Report ----
    write_report
}

main "$@"