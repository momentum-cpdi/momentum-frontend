import { vi } from 'vitest';
import { ApiError, apiGet } from './client';

const ok = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);

describe('apiGet', () => {
  it('returns the parsed JSON body and requests JSON', async () => {
    const fetchMock = vi.fn(() => ok({ hello: 'world' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiGet('/api/ping')).resolves.toEqual({ hello: 'world' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ping',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
  });

  it('throws an ApiError carrying the HTTP status on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 503 } as Response)));

    await expect(apiGet('/api/ping')).rejects.toMatchObject({ name: 'ApiError', status: 503 });
  });

  it('wraps network failures in an ApiError without status', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('network'))));

    const error = await apiGet('/api/ping').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBeUndefined();
  });

  it('aborts the request when the caller signal is aborted', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      })));
    const controller = new AbortController();

    const pending = apiGet('/api/slow', controller.signal);
    controller.abort();
    await expect(pending).rejects.toBeInstanceOf(ApiError);
  });

  it('aborts the request after the timeout', async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        })));

      const pending = apiGet('/api/slow').catch((e: unknown) => e);
      await vi.advanceTimersByTimeAsync(5001);
      expect(await pending).toBeInstanceOf(ApiError);
    } finally {
      vi.useRealTimers();
    }
  });
});