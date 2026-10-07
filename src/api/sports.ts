import { apiGet } from './client';

export type ApiSportType = 'FOOTBALL' | 'BASKETBALL' | 'TENNIS' | 'OTHER';

export type ApiSport = {
  id: number;
  name: string;
  code: string;
  type: ApiSportType;
  active: boolean;
};

export type ApiHealth = {
  status: string;
  service: string;
  timestamp: string;
};

export const fetchSports = (signal?: AbortSignal) => apiGet<ApiSport[]>('/api/sports', signal);

export const fetchHealth = (signal?: AbortSignal) => apiGet<ApiHealth>('/api/health', signal);