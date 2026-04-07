import { Host } from '../shared/types';

const MAC_RE = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function isValidMac(mac: unknown): mac is string {
  return typeof mac === 'string' && MAC_RE.test(mac);
}

export function isValidIp(ip: unknown): ip is string {
  if (typeof ip !== 'string') return false;
  const m = IPV4_RE.exec(ip);
  if (!m) return false;
  return m.slice(1).every(octet => {
    const n = parseInt(octet, 10);
    return n >= 0 && n <= 255 && String(n) === octet;
  });
}

export function isValidPort(port: unknown): port is number {
  return typeof port === 'number' && Number.isInteger(port) && port >= 1 && port <= 65535;
}

export function validateHost(h: unknown): h is Host {
  if (typeof h !== 'object' || h === null) return false;
  const obj = h as Record<string, unknown>;
  return (
    typeof obj.id === 'string' && obj.id.length > 0 &&
    typeof obj.name === 'string' && obj.name.length > 0 &&
    isValidMac(obj.mac) &&
    isValidIp(obj.ip) &&
    isValidIp(obj.broadcastAddress) &&
    isValidPort(obj.port) &&
    typeof obj.useDirectIp === 'boolean'
  );
}
