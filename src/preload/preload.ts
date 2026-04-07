import { contextBridge, ipcRenderer } from 'electron';
import type { Host, WolResult } from '../shared/types';

contextBridge.exposeInMainWorld('api', {
  loadHosts: () => ipcRenderer.invoke('hosts:load') as Promise<Host[]>,
  saveHosts: (hosts: Host[]) => ipcRenderer.invoke('hosts:save', hosts) as Promise<void>,
  sendWol: (host: Host) => ipcRenderer.invoke('wol:send', host) as Promise<WolResult>,
});
