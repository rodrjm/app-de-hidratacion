import { describe, it, expect, vi } from 'vitest';

// Test simple para verificar que la configuración funciona
describe('Simple Auth Service Test', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle mock functions', () => {
    const mockFn = vi.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should handle async operations', async () => {
    const mockAsyncFn = vi.fn().mockResolvedValue('success');
    const result = await mockAsyncFn();
    expect(result).toBe('success');
  });
});
