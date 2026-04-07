import { describe, it, expect } from 'vitest';
import { isValidMac, isValidIp, isValidPort, validateHost } from '../src/main/validation';

describe('isValidMac', () => {
  it('accepts valid uppercase MAC', () => {
    expect(isValidMac('AA:BB:CC:DD:EE:FF')).toBe(true);
  });

  it('accepts valid lowercase MAC', () => {
    expect(isValidMac('aa:bb:cc:dd:ee:ff')).toBe(true);
  });

  it('accepts valid mixed case MAC', () => {
    expect(isValidMac('Aa:Bb:Cc:Dd:Ee:Ff')).toBe(true);
  });

  it('rejects MAC without colons', () => {
    expect(isValidMac('AABBCCDDEEFF')).toBe(false);
  });

  it('rejects MAC with dashes', () => {
    expect(isValidMac('AA-BB-CC-DD-EE-FF')).toBe(false);
  });

  it('rejects MAC with too few octets', () => {
    expect(isValidMac('AA:BB:CC:DD:EE')).toBe(false);
  });

  it('rejects MAC with too many octets', () => {
    expect(isValidMac('AA:BB:CC:DD:EE:FF:00')).toBe(false);
  });

  it('rejects MAC with invalid hex', () => {
    expect(isValidMac('GG:BB:CC:DD:EE:FF')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidMac('')).toBe(false);
  });

  it('rejects non-string types', () => {
    expect(isValidMac(123)).toBe(false);
    expect(isValidMac(null)).toBe(false);
    expect(isValidMac(undefined)).toBe(false);
    expect(isValidMac({})).toBe(false);
  });

  it('rejects MAC with single-digit octets', () => {
    expect(isValidMac('A:B:C:D:E:F')).toBe(false);
  });

  it('rejects MAC with three-digit octets', () => {
    expect(isValidMac('AAA:BBB:CCC:DDD:EEE:FFF')).toBe(false);
  });
});

describe('isValidIp', () => {
  it('accepts valid IP', () => {
    expect(isValidIp('192.168.1.100')).toBe(true);
  });

  it('accepts 0.0.0.0', () => {
    expect(isValidIp('0.0.0.0')).toBe(true);
  });

  it('accepts 255.255.255.255', () => {
    expect(isValidIp('255.255.255.255')).toBe(true);
  });

  it('rejects octets > 255', () => {
    expect(isValidIp('256.1.1.1')).toBe(false);
    expect(isValidIp('1.1.1.256')).toBe(false);
  });

  it('rejects leading zeros', () => {
    expect(isValidIp('192.168.01.1')).toBe(false);
    expect(isValidIp('010.0.0.1')).toBe(false);
  });

  it('rejects too few octets', () => {
    expect(isValidIp('192.168.1')).toBe(false);
  });

  it('rejects too many octets', () => {
    expect(isValidIp('192.168.1.1.1')).toBe(false);
  });

  it('rejects non-numeric octets', () => {
    expect(isValidIp('192.168.abc.1')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidIp('')).toBe(false);
  });

  it('rejects non-string types', () => {
    expect(isValidIp(123)).toBe(false);
    expect(isValidIp(null)).toBe(false);
    expect(isValidIp(undefined)).toBe(false);
  });

  it('rejects negative octets', () => {
    expect(isValidIp('-1.0.0.0')).toBe(false);
  });

  it('rejects IP with spaces', () => {
    expect(isValidIp('192. 168.1.1')).toBe(false);
  });
});

describe('isValidPort', () => {
  it('accepts port 1', () => {
    expect(isValidPort(1)).toBe(true);
  });

  it('accepts port 9 (default WoL)', () => {
    expect(isValidPort(9)).toBe(true);
  });

  it('accepts port 65535', () => {
    expect(isValidPort(65535)).toBe(true);
  });

  it('rejects port 0', () => {
    expect(isValidPort(0)).toBe(false);
  });

  it('rejects port 65536', () => {
    expect(isValidPort(65536)).toBe(false);
  });

  it('rejects negative port', () => {
    expect(isValidPort(-1)).toBe(false);
  });

  it('rejects float port', () => {
    expect(isValidPort(9.5)).toBe(false);
  });

  it('rejects string port', () => {
    expect(isValidPort('9')).toBe(false);
  });

  it('rejects NaN', () => {
    expect(isValidPort(NaN)).toBe(false);
  });

  it('rejects Infinity', () => {
    expect(isValidPort(Infinity)).toBe(false);
  });
});

describe('validateHost', () => {
  const validHost = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Gaming PC',
    mac: 'AA:BB:CC:DD:EE:FF',
    ip: '192.168.1.100',
    broadcastAddress: '192.168.1.255',
    port: 9,
    useDirectIp: false,
  };

  it('accepts valid host', () => {
    expect(validateHost(validHost)).toBe(true);
  });

  it('accepts host with useDirectIp true', () => {
    expect(validateHost({ ...validHost, useDirectIp: true })).toBe(true);
  });

  it('rejects null', () => {
    expect(validateHost(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(validateHost(undefined)).toBe(false);
  });

  it('rejects empty object', () => {
    expect(validateHost({})).toBe(false);
  });

  it('rejects array', () => {
    expect(validateHost([])).toBe(false);
  });

  it('rejects host with empty id', () => {
    expect(validateHost({ ...validHost, id: '' })).toBe(false);
  });

  it('rejects host with empty name', () => {
    expect(validateHost({ ...validHost, name: '' })).toBe(false);
  });

  it('rejects host with invalid MAC', () => {
    expect(validateHost({ ...validHost, mac: 'invalid' })).toBe(false);
  });

  it('rejects host with invalid IP', () => {
    expect(validateHost({ ...validHost, ip: '999.999.999.999' })).toBe(false);
  });

  it('rejects host with invalid broadcast', () => {
    expect(validateHost({ ...validHost, broadcastAddress: 'not-an-ip' })).toBe(false);
  });

  it('rejects host with invalid port', () => {
    expect(validateHost({ ...validHost, port: 0 })).toBe(false);
    expect(validateHost({ ...validHost, port: 70000 })).toBe(false);
    expect(validateHost({ ...validHost, port: '9' })).toBe(false);
  });

  it('rejects host with non-boolean useDirectIp', () => {
    expect(validateHost({ ...validHost, useDirectIp: 'false' })).toBe(false);
    expect(validateHost({ ...validHost, useDirectIp: 0 })).toBe(false);
  });

  it('rejects host missing fields', () => {
    const { mac, ...noMac } = validHost;
    expect(validateHost(noMac)).toBe(false);

    const { ip, ...noIp } = validHost;
    expect(validateHost(noIp)).toBe(false);
  });

  it('accepts host with extra fields (ignores them)', () => {
    expect(validateHost({ ...validHost, extra: 'field' })).toBe(true);
  });
});
