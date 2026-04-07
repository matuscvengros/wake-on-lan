interface Host {
  id: string;
  name: string;
  mac: string;
  ip: string;
  broadcastAddress: string;
  port: number;
  useDirectIp: boolean;
}

interface WolResult {
  success: boolean;
  error?: string;
}

interface SaveResult {
  success: boolean;
  error?: string;
}

interface Window {
  api: {
    loadHosts(): Promise<Host[]>;
    saveHosts(hosts: Host[]): Promise<SaveResult>;
    sendWol(host: Host): Promise<WolResult>;
  };
}
