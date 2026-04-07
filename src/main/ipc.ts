import { ipcMain } from 'electron';
import { loadHosts, saveHosts, validateHost } from './hosts';
import { sendMagicPacket } from './wol';
import { Host, WolResult } from '../shared/types';

export function registerIpcHandlers(): void {
  ipcMain.handle('hosts:load', (): Host[] => {
    return loadHosts();
  });

  ipcMain.handle('hosts:save', (_event, hosts: unknown): { success: boolean; error?: string } => {
    try {
      if (!Array.isArray(hosts) || !hosts.every(validateHost)) {
        return { success: false, error: 'Invalid host data' };
      }
      saveHosts(hosts);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save hosts';
      return { success: false, error: message };
    }
  });

  ipcMain.handle('wol:send', async (_event, host: unknown): Promise<WolResult> => {
    try {
      if (!validateHost(host)) {
        return { success: false, error: 'Invalid host data' };
      }
      await sendMagicPacket({
        mac: host.mac,
        ip: host.ip,
        broadcastAddress: host.broadcastAddress,
        port: host.port,
        useDirectIp: host.useDirectIp,
      });
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  });
}
