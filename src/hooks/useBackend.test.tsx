import { vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useBackend } from './useBackend';

const ok = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);

const apiFetch = (url: string) =>
  url.endsWith('/api/health')
    ? ok({ status: 'UP', service: 'momentum-backend', timestamp: 'now' })
    : ok([{ id: 1, name: 'Football', code: 'FOOT', type: 'FOOTBALL', active: true }]);

describe('useBackend', () => {
  it('starts in the checking state', () => {
    const { result } = renderHook(() => useBackend());
    expect(result.current.status).toBe('checking');
  });

  it('goes offline when the API is unreachable', async () => {
    const { result } = renderHook(() => useBackend());
    await waitFor(() => expect(result.current.status).toBe('offline'));
  });

  it('goes online with the sports list when the API answers', async () => {
    vi.stubGlobal('fetch', vi.fn(apiFetch));
    const { result } = renderHook(() => useBackend());

    await waitFor(() => expect(result.current.status).toBe('online'));
    expect(result.current).toMatchObject({ sports: [{ code: 'FOOT' }] });
  });

  it('re-checks periodically and recovers after an outage', async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.fn(() => Promise.reject(new TypeError('down')));
      vi.stubGlobal('fetch', fetchMock);
      const { result } = renderHook(() => useBackend());
      await act(async () => { await vi.advanceTimersByTimeAsync(10); });
      expect(result.current.status).toBe('offline');

      vi.stubGlobal('fetch', vi.fn(apiFetch));
      await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
      expect(result.current.status).toBe('online');
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops polling and aborts on unmount', async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.fn(() => Promise.reject(new TypeError('down')));
      vi.stubGlobal('fetch', fetchMock);
      const { unmount } = renderHook(() => useBackend());
      await act(async () => { await vi.advanceTimersByTimeAsync(10); });
      const calls = fetchMock.mock.calls.length;

      unmount();
      await vi.advanceTimersByTimeAsync(90000);
      expect(fetchMock.mock.calls.length).toBe(calls);
    } finally {
      vi.useRealTimers();
    }
  });
});