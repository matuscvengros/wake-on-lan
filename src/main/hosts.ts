import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { Host } from '../shared/types';
import { validateHost } from './validation';

export { Host, validateHost };

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
  try {
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch {}
    throw err;
  }
}
