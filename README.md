# Wake-on-LAN (WoL)

A simple, cross-platform bash script to wake network devices using Wake-on-LAN magic packets.

## Overview

Wake-on-LAN (WoL) is a networking standard that allows a computer or device to be turned on remotely by sending a special network message called a "magic packet". This script provides a lightweight, dependency-minimal way to send these packets from macOS or Linux systems.

## Features

- Cross-platform support (macOS and Linux)
- Automatic platform detection for netcat compatibility
- Input validation for MAC addresses, IP addresses, and ports
- Colorized terminal output (when supported)
- Configurable UDP port
- No external dependencies beyond `netcat` (pre-installed on most systems)

## Requirements

- Bash 3.x or later
- `nc` (netcat) - typically pre-installed on macOS and most Linux distributions

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/wake-on-lan.git
   cd wake-on-lan
   ```

2. Make the script executable:
   ```bash
   chmod +x wol.sh
   ```

3. (Optional) Add to your PATH for system-wide access:
   ```bash
   # Copy to a directory in your PATH
   sudo cp wol.sh /usr/local/bin/wol
   
   # Or create a symlink
   sudo ln -s "$(pwd)/wol.sh" /usr/local/bin/wol
   ```

## Usage

```
wol.sh [-h|--help] [-p|--port PORT] MAC_ADDRESS IP_ADDRESS
```

### Arguments

| Argument | Description |
|----------|-------------|
| `MAC_ADDRESS` | Target device MAC address (12 hex characters, no separators). Accepts both uppercase and lowercase. |
| `IP_ADDRESS` | Target device IP address on the local network |

### Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message and exit |
| `-p, --port PORT` | UDP port to send packet (default: 9) |

### Examples

```bash
# Wake device using default port 9
./wol.sh AABBCCDDEEFF 192.168.1.100

# Wake device using custom port
./wol.sh -p 7 aabbccddeeff 192.168.1.100

# Using long option format
./wol.sh --port 9 AABBCCDDEEFF 10.0.0.50
```

## How It Works

The script sends a "magic packet" to wake a sleeping device on the network. A magic packet consists of:

1. **Synchronization stream**: 6 bytes of `0xFF`
2. **Target MAC address**: The device's MAC address repeated 16 times

This 102-byte packet is sent via UDP (default port 9) to the specified IP address. When the target device's network interface receives this packet while in a low-power state, it triggers the system to power on.

## Prerequisites for Target Device

For Wake-on-LAN to work, the target device must:

1. **Have WoL enabled in BIOS/UEFI**: Look for settings like "Wake on LAN", "Power On by PCI-E", or similar
2. **Have WoL enabled in the operating system**:
   - **Linux**: Use `ethtool` to enable WoL on the network interface
     ```bash
     sudo ethtool -s eth0 wol g
     ```
   - **Windows**: Enable in Device Manager > Network Adapter > Properties > Power Management
   - **macOS**: System Preferences > Energy Saver > "Wake for network access"
3. **Be connected to the network** (even when powered off, the NIC remains active in standby mode)
4. **Be on the same local network** or have proper network routing configured

## Finding Your Device's MAC Address

### On the target device:

**Linux:**
```bash
ip link show
# or
ifconfig
```

**macOS:**
```bash
ifconfig en0 | grep ether
```

**Windows:**
```cmd
ipconfig /all
```

### From your router:
Check your router's admin panel for connected devices and their MAC addresses.

## Troubleshooting

### "Required dependency 'nc' (netcat) not found"

Install netcat for your system:
- **Debian/Ubuntu**: `sudo apt install netcat`
- **RHEL/CentOS/Fedora**: `sudo dnf install nc`
- **macOS**: Pre-installed; if missing, use `brew install netcat`

### Device doesn't wake up

1. Verify WoL is enabled in the device's BIOS/UEFI
2. Verify WoL is enabled in the device's OS network settings
3. Ensure the device is connected via Ethernet (Wi-Fi WoL support varies)
4. Check that you're using the correct MAC and IP addresses
5. Verify there are no firewalls blocking UDP traffic on the specified port
6. Some routers may block broadcast packets; try using the device's last known IP

### "Invalid MAC address" error

Ensure the MAC address:
- Contains exactly 12 hexadecimal characters
- Has no separators (colons, dashes, etc.)
- Example: `AABBCCDDEEFF` (not `AA:BB:CC:DD:EE:FF`)

## Platform Notes

### macOS
Uses BSD netcat with `-w1` timeout flag.

### Linux
Automatically detects netcat variant and uses `-q1` (GNU netcat) or `-w1` (others) for timeout.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## Author

Matus Cvengros
