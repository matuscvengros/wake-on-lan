#!/usr/bin/env bash
#
# Wake-on-LAN (WoL) - Send magic packet to wake a network device
# Compatible with macOS and Linux
#

set -euo pipefail

# ------------------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------------------
readonly DEFAULT_PORT=9
readonly SCRIPT_NAME="$(basename "$0")"

# ------------------------------------------------------------------------------
# Colors and Formatting (only if terminal supports it)
# ------------------------------------------------------------------------------
if [[ -t 1 ]]; then
    readonly RED='\033[0;31m'
    readonly GREEN='\033[0;32m'
    readonly YELLOW='\033[0;33m'
    readonly BLUE='\033[0;34m'
    readonly BOLD='\033[1m'
    readonly DIM='\033[2m'
    readonly RESET='\033[0m'
else
    readonly RED=''
    readonly GREEN=''
    readonly YELLOW=''
    readonly BLUE=''
    readonly BOLD=''
    readonly DIM=''
    readonly RESET=''
fi

readonly CHECK_MARK="${GREEN}✔${RESET}"
readonly CROSS_MARK="${RED}✖${RESET}"

# ------------------------------------------------------------------------------
# Help Function
# ------------------------------------------------------------------------------
show_help() {
    printf '%b\n' "
${BOLD}Wake-on-LAN (WoL)${RESET} - Send magic packet to wake a network device

${BOLD}Usage:${RESET} ${SCRIPT_NAME} [-h|--help] [-p|--port PORT] MAC_ADDRESS IP_ADDRESS

${BOLD}Arguments:${RESET}
  ${BLUE}MAC_ADDRESS${RESET}    Target device MAC address (12 hex chars, no separators)
                 Accepts both uppercase and lowercase (e.g., AABBCCDDEEFF)
  ${BLUE}IP_ADDRESS${RESET}     Target device IP address on local network

${BOLD}Options:${RESET}
  ${YELLOW}-h, --help${RESET}     Show this help message and exit
  ${YELLOW}-p, --port${RESET}     UDP port to send packet (default: ${DEFAULT_PORT})

${BOLD}Examples:${RESET}
  ${DIM}# Wake device using default port 9${RESET}
  ${SCRIPT_NAME} AABBCCDDEEFF 192.168.1.100

  ${DIM}# Wake device using custom port${RESET}
  ${SCRIPT_NAME} -p 7 aabbccddeeff 192.168.1.100

  ${DIM}# Using long option format${RESET}
  ${SCRIPT_NAME} --port 9 AABBCCDDEEFF 10.0.0.50
"
}

# ------------------------------------------------------------------------------
# Output Functions
# ------------------------------------------------------------------------------
error() {
    local message="$1"
    local hint="${2:-}"
    
    echo -e "${CROSS_MARK} ${RED}Error:${RESET} ${message}" >&2
    if [[ -n "$hint" ]]; then
        echo -e "  ${hint}" >&2
    fi
    exit 1
}

success() {
    local mac_formatted="$1"
    local ip="$2"
    local port="$3"
    
    echo -e ""
    echo -e "${CHECK_MARK} ${GREEN}${BOLD}Magic packet sent successfully!${RESET}"
    echo -e ""
    echo -e "  ${DIM}MAC Address:${RESET} ${BOLD}${mac_formatted}${RESET}"
    echo -e "  ${DIM}Destination:${RESET} ${BOLD}${ip}:${port}${RESET}"
    echo -e ""
}

# ------------------------------------------------------------------------------
# Validation Functions
# ------------------------------------------------------------------------------
validate_mac() {
    local mac="$1"
    
    # Check length
    if [[ ${#mac} -ne 12 ]]; then
        error "Invalid MAC address '${mac}'" \
              "Expected: 12 hexadecimal characters (e.g., AABBCCDDEEFF)"
    fi
    
    # Check if all characters are hexadecimal
    if ! [[ "$mac" =~ ^[0-9A-Fa-f]{12}$ ]]; then
        error "Invalid MAC address '${mac}'" \
              "Expected: 12 hexadecimal characters (e.g., AABBCCDDEEFF)"
    fi
}

validate_ip() {
    local ip="$1"
    
    # Check basic IPv4 format
    if ! [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        error "Invalid IP address '${ip}'" \
              "Expected: Valid IPv4 address (e.g., 192.168.1.100)"
    fi
    
    # Check each octet is in range 0-255
    local IFS='.'
    read -ra octets <<< "$ip"
    for octet in "${octets[@]}"; do
        if (( octet < 0 || octet > 255 )); then
            error "Invalid IP address '${ip}'" \
                  "Each octet must be between 0 and 255"
        fi
    done
}

validate_port() {
    local port="$1"
    
    # Check if numeric
    if ! [[ "$port" =~ ^[0-9]+$ ]]; then
        error "Invalid port '${port}'" \
              "Expected: Numeric value between 1 and 65535"
    fi
    
    # Check range
    if (( port < 1 || port > 65535 )); then
        error "Invalid port '${port}'" \
              "Expected: Value between 1 and 65535"
    fi
}

# ------------------------------------------------------------------------------
# Dependency Check
# ------------------------------------------------------------------------------
check_dependencies() {
    if ! command -v nc &> /dev/null; then
        error "Required dependency 'nc' (netcat) not found" \
              "Please install netcat to use this script"
    fi
}

# ------------------------------------------------------------------------------
# Format MAC Address for Display
# ------------------------------------------------------------------------------
format_mac() {
    local mac
    mac="$(echo "$1" | tr '[:lower:]' '[:upper:]')"  # Convert to uppercase
    echo "${mac:0:2}:${mac:2:2}:${mac:4:2}:${mac:6:2}:${mac:8:2}:${mac:10:2}"
}

# ------------------------------------------------------------------------------
# Build and Send Magic Packet
# ------------------------------------------------------------------------------
send_magic_packet() {
    local mac="$1"
    local ip="$2"
    local port="$3"
    
    # Convert MAC to lowercase for consistency (compatible with bash 3.x)
    mac="$(echo "$mac" | tr '[:upper:]' '[:lower:]')"
    
    # Build magic packet:
    # - 6 bytes of 0xFF (synchronization stream)
    # - MAC address repeated 16 times
    local packet=""
    
    # Add 6 bytes of 0xFF
    for _ in {1..6}; do
        packet+='\xff'
    done
    
    # Add MAC address 16 times
    local mac_bytes=""
    for (( i=0; i<12; i+=2 )); do
        mac_bytes+="\\x${mac:i:2}"
    done
    
    for _ in {1..16}; do
        packet+="$mac_bytes"
    done
    
    # Detect platform and send packet
    local os_type
    os_type="$(uname -s)"
    
    case "$os_type" in
        Darwin)
            # macOS (BSD netcat)
            printf '%b' "$packet" | nc -u -w1 "$ip" "$port" 2>/dev/null
            ;;
        Linux)
            # Linux (GNU netcat) - try -q1 first, fall back to -w1
            if nc -h 2>&1 | grep -q '\-q'; then
                printf '%b' "$packet" | nc -u -q1 "$ip" "$port" 2>/dev/null
            else
                printf '%b' "$packet" | nc -u -w1 "$ip" "$port" 2>/dev/null
            fi
            ;;
        *)
            # Unknown OS, try generic approach
            printf '%b' "$packet" | nc -u -w1 "$ip" "$port" 2>/dev/null
            ;;
    esac
}

# ------------------------------------------------------------------------------
# Main
# ------------------------------------------------------------------------------
main() {
    local port="$DEFAULT_PORT"
    local mac=""
    local ip=""
    local positional_args=()
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                show_help
                exit 0
                ;;
            -p|--port)
                if [[ -z "${2:-}" ]]; then
                    error "Option '$1' requires a port number" \
                          "Run '${SCRIPT_NAME} --help' for usage information."
                fi
                port="$2"
                shift 2
                ;;
            -*)
                error "Unknown option '$1'" \
                      "Run '${SCRIPT_NAME} --help' for usage information."
                ;;
            *)
                positional_args+=("$1")
                shift
                ;;
        esac
    done
    
    # Check positional arguments
    if [[ ${#positional_args[@]} -lt 1 ]]; then
        error "Missing required argument: MAC_ADDRESS" \
              "Run '${SCRIPT_NAME} --help' for usage information."
    fi
    
    if [[ ${#positional_args[@]} -lt 2 ]]; then
        error "Missing required argument: IP_ADDRESS" \
              "Run '${SCRIPT_NAME} --help' for usage information."
    fi
    
    if [[ ${#positional_args[@]} -gt 2 ]]; then
        error "Too many arguments provided" \
              "Run '${SCRIPT_NAME} --help' for usage information."
    fi
    
    mac="${positional_args[0]}"
    ip="${positional_args[1]}"
    
    # Validate inputs
    validate_mac "$mac"
    validate_ip "$ip"
    validate_port "$port"
    
    # Check dependencies
    check_dependencies
    
    # Send magic packet
    send_magic_packet "$mac" "$ip" "$port"
    
    # Show success message
    local mac_formatted
    mac_formatted="$(format_mac "$mac")"
    success "$mac_formatted" "$ip" "$port"
}

main "$@"
