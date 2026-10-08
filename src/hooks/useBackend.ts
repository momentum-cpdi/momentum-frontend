import { useEffect, useState } from 'react';
import { fetchHealth, fetchSports, type ApiSport } from '../api/sports';

export type BackendState =
  | { status: 'checking' }
  | { status: 'online'; sports: ApiSport[] }
  | { status: 'offline' };

const REFRESH_INTERVAL_MS = 30000;

/** Vérifie la santé de l'API et charge le référentiel de sports, puis revérifie périodiquement. */
export function useBackend(): BackendState {
  const [state, setState] = useState<BackendState>({ status: 'checking' });

  useEffect(() => {
    const controller = new AbortController();

    const refresh = async () => {
      try {
        await fetchHealth(controller.signal);
        const sports = await fetchSports(controller.signal);
        if (!controller.signal.aborted) {
          setState({ status: 'online', sports });
        }
      } catch {
        if (!controller.signal.aborted) {
          setState({ status: 'offline' });
        }
      }
    };

    void refresh();
    const timer = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, []);

  return state;
}