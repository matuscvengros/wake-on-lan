import { contextBridge, ipcRenderer } from 'electron';
import type { Host, WolResult } from '../shared/types';

export interface SaveResult {
  success: boolean;
  error?: string;
}

contextBridge.exposeInMainWorld('api', {
  loadHosts: () => ipcRenderer.invoke('hosts:load') as Promise<Host[]>,
  saveHosts: (hosts: Host[]) => ipcRenderer.invoke('hosts:save', hosts) as Promise<SaveResult>,
  sendWol: (host: Host) => ipcRenderer.invoke('wol:send', host) as Promise<WolResult>,
});
