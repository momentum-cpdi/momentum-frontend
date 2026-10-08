import { vi } from 'vitest';
import { fetchHealth, fetchSports } from './sports';

const ok = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);

describe('sports API', () => {
  it('fetchSports calls GET /api/sports', async () => {
    const fetchMock = vi.fn<(url: string) => Promise<Response>>().mockImplementation(() => ok([{ id: 1, name: 'Football', code: 'FOOT', type: 'FOOTBALL', active: true }]));
    vi.stubGlobal('fetch', fetchMock);

    const sports = await fetchSports();
    expect(sports).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/sports');
  });

  it('fetchHealth calls GET /api/health', async () => {
    const fetchMock = vi.fn<(url: string) => Promise<Response>>().mockImplementation(() => ok({ status: 'UP', service: 'momentum-backend', timestamp: 'now' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchHealth()).resolves.toMatchObject({ status: 'UP' });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/health');
  });
});