export interface Host {
  id: string;
  name: string;
  mac: string;
  ip: string;
  broadcastAddress: string;
  port: number;
  useDirectIp: boolean;
}

export interface WolResult {
  success: boolean;
  error?: string;
}
