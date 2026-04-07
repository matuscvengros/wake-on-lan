import { describe, it, expect } from 'vitest';
import { parseMac, buildMagicPacket } from '../src/main/wol';

describe('parseMac', () => {
  it('parses valid uppercase MAC', () => {
    const buf = parseMac('AA:BB:CC:DD:EE:FF');
    expect(buf).toEqual(Buffer.from([0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff]));
  });

  it('parses valid lowercase MAC', () => {
    const buf = parseMac('aa:bb:cc:dd:ee:ff');
    expect(buf).toEqual(Buffer.from([0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff]));
  });

  it('parses all zeros', () => {
    const buf = parseMac('00:00:00:00:00:00');
    expect(buf).toEqual(Buffer.from([0, 0, 0, 0, 0, 0]));
  });

  it('parses all FF', () => {
    const buf = parseMac('FF:FF:FF:FF:FF:FF');
    expect(buf).toEqual(Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff]));
  });

  it('returns exactly 6 bytes', () => {
    const buf = parseMac('01:02:03:04:05:06');
    expect(buf.length).toBe(6);
  });

  it('throws on too few octets', () => {
    expect(() => parseMac('AA:BB:CC:DD:EE')).toThrow('Invalid MAC');
  });

  it('throws on too many octets', () => {
    expect(() => parseMac('AA:BB:CC:DD:EE:FF:00')).toThrow('Invalid MAC');
  });

  it('throws on invalid hex characters', () => {
    expect(() => parseMac('GG:BB:CC:DD:EE:FF')).toThrow('Invalid MAC');
  });

  it('throws on empty string', () => {
    expect(() => parseMac('')).toThrow('Invalid MAC');
  });

  it('throws on MAC without colons', () => {
    expect(() => parseMac('AABBCCDDEEFF')).toThrow('Invalid MAC');
  });

  it('throws on MAC with dashes', () => {
    expect(() => parseMac('AA-BB-CC-DD-EE-FF')).toThrow('Invalid MAC');
  });
});

describe('buildMagicPacket', () => {
  const mac = 'AA:BB:CC:DD:EE:FF';
  const packet = buildMagicPacket(mac);

  it('produces exactly 102 bytes', () => {
    expect(packet.length).toBe(102);
  });

  it('starts with 6 bytes of 0xFF', () => {
    for (let i = 0; i < 6; i++) {
      expect(packet[i]).toBe(0xff);
    }
  });

  it('contains MAC repeated 16 times after header', () => {
    const macBytes = [0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff];
    for (let rep = 0; rep < 16; rep++) {
      for (let b = 0; b < 6; b++) {
        expect(packet[6 + rep * 6 + b]).toBe(macBytes[b]);
      }
    }
  });

  it('produces different packets for different MACs', () => {
    const packet2 = buildMagicPacket('11:22:33:44:55:66');
    expect(packet.equals(packet2)).toBe(false);
  });

  it('produces identical packets for same MAC', () => {
    const packet2 = buildMagicPacket(mac);
    expect(packet.equals(packet2)).toBe(true);
  });

  it('throws for invalid MAC', () => {
    expect(() => buildMagicPacket('invalid')).toThrow('Invalid MAC');
  });
});
