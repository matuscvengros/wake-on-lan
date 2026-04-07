import { describe, it, expect } from 'vitest';
import { compareVersions } from '../src/main/updater';

describe('compareVersions', () => {
  it('returns true when latest is newer (patch)', () => {
    expect(compareVersions('0.0.1', '0.0.2')).toBe(true);
  });

  it('returns true when latest is newer (minor)', () => {
    expect(compareVersions('0.1.0', '0.2.0')).toBe(true);
  });

  it('returns true when latest is newer (major)', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toBe(true);
  });

  it('returns false when versions are equal', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(false);
  });

  it('returns false when current is newer', () => {
    expect(compareVersions('2.0.0', '1.0.0')).toBe(false);
  });

  it('handles v prefix on both', () => {
    expect(compareVersions('v1.0.0', 'v1.0.1')).toBe(true);
  });

  it('handles v prefix on latest only', () => {
    expect(compareVersions('1.0.0', 'v1.0.1')).toBe(true);
  });

  it('handles v prefix on current only', () => {
    expect(compareVersions('v1.0.0', '1.0.1')).toBe(true);
  });

  it('compares major before minor', () => {
    expect(compareVersions('1.9.9', '2.0.0')).toBe(true);
  });

  it('compares minor before patch', () => {
    expect(compareVersions('1.1.9', '1.2.0')).toBe(true);
  });

  it('returns false when current major is higher despite lower minor', () => {
    expect(compareVersions('2.0.0', '1.9.9')).toBe(false);
  });

  it('handles missing patch version', () => {
    expect(compareVersions('1.0', '1.0.1')).toBe(true);
  });

  it('handles both missing patch', () => {
    expect(compareVersions('1.0', '1.0')).toBe(false);
  });

  it('returns true for 0.0.1 -> 0.0.2', () => {
    expect(compareVersions('0.0.1', 'v0.0.2')).toBe(true);
  });
});
