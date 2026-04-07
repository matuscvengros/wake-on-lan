import * as dgram from 'dgram';

export interface WolTarget {
  mac: string;
  ip: string;
  broadcastAddress: string;
  port: number;
  useDirectIp: boolean;
}

export function parseMac(mac: string): Buffer {
  const bytes = mac.split(':').map(hex => parseInt(hex, 16));
  if (bytes.length !== 6 || bytes.some(b => isNaN(b) || b < 0 || b > 0xff)) {
    throw new Error(`Invalid MAC address: ${mac}`);
  }
  return Buffer.from(bytes);
}

export function buildMagicPacket(mac: string): Buffer {
  const macBuffer = parseMac(mac);
  const packet = Buffer.alloc(102);

  for (let i = 0; i < 6; i++) {
    packet[i] = 0xff;
  }

  for (let i = 0; i < 16; i++) {
    macBuffer.copy(packet, 6 + i * 6);
  }

  return packet;
}

export function sendMagicPacket(target: WolTarget): Promise<void> {
  return new Promise((resolve, reject) => {
    const packet = buildMagicPacket(target.mac);
    const address = target.useDirectIp ? target.ip : target.broadcastAddress;
    const socket = dgram.createSocket('udp4');

    socket.once('error', (err) => {
      socket.close();
      reject(err);
    });

    socket.bind(() => {
      socket.setBroadcast(true);
      socket.send(packet, 0, packet.length, target.port, address, (err) => {
        socket.removeAllListeners('error');
        socket.close();
        if (err) reject(err);
        else resolve();
      });
    });
  });
}
