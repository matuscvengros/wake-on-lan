import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { Host } from '../shared/types';

export { Host };

const MAC_RE = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function isValidMac(mac: unknown): mac is string {
  return typeof mac === 'string' && MAC_RE.test(mac);
}

function isValidIp(ip: unknown): ip is string {
  if (typeof ip !== 'string') return false;
  const m = IPV4_RE.exec(ip);
  if (!m) return false;
  return m.slice(1).every(octet => {
    const n = parseInt(octet, 10);
    return n >= 0 && n <= 255;
  });
}

function isValidPort(port: unknown): port is number {
  return typeof port === 'number' && Number.isInteger(port) && port >= 1 && port <= 65535;
}

export function validateHost(h: unknown): h is Host {
  if (typeof h !== 'object' || h === null) return false;
  const obj = h as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' && obj.name.length > 0 &&
    isValidMac(obj.mac) &&
    isValidIp(obj.ip) &&
    isValidIp(obj.broadcastAddress) &&
    isValidPort(obj.port) &&
    typeof obj.useDirectIp === 'boolean'
  );
}

function getHostsPath(): string {
  return path.join(app.getPath('userData'), 'hosts.json');
}

export function loadHosts(): Host[] {
  const filePath = getHostsPath();
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!raw || !Array.isArray(raw.hosts)) return [];
    return raw.hosts.filter(validateHost);
  } catch {
    return [];
  }
}

export function saveHosts(hosts: Host[]): void {
  const filePath = getHostsPath();
  const dir = path.dirname(filePath);
  const tmpPath = path.join(dir, `hosts.${Date.now()}.tmp`);
  fs.writeFileSync(tmpPath, JSON.stringify({ hosts }, null, 2));
  fs.renameSync(tmpPath, filePath);
}
