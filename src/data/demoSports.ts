export type Sport = 'football' | 'basketball';
export type MatchStatus = 'live' | 'upcoming' | 'finished';
export type Standing = {
  team: string;
  played: number;
  wins: number;
  tiesOrLosses: number;
  points: number;
};

export type Match = {
  id: string;
  sport: Sport;
  competition: string;
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  status: MatchStatus;
  detail: string;
  startTime: string;
  dayOffset?: number;
};

export const demoMatches: Match[] = [
  {
    id: 'psg-marseille',
    sport: 'football',
    competition: 'Ligue 1 · 8e journée',
    home: 'Paris Saint-Germain',
    away: 'Olympique de Marseille',
    homeScore: 2,
    awayScore: 1,
    status: 'live',
    detail: '67e',
    startTime: '20:45',
  },
  {
    id: 'lakers-warriors',
    sport: 'basketball',
    competition: 'NBA · Saison régulière',
    home: 'Los Angeles Lakers',
    away: 'Golden State Warriors',
    homeScore: 84,
    awayScore: 79,
    status: 'live',
    detail: '3e quart-temps',
    startTime: '21:00',
  },
  {
    id: 'lyon-monaco',
    sport: 'football',
    competition: 'Ligue 1 · 8e journée',
    home: 'Olympique Lyonnais',
    away: 'AS Monaco',
    status: 'upcoming',
    detail: 'Aujourd’hui',
    startTime: '21:00',
    dayOffset: 0,
  },
  {
    id: 'celtics-bulls',
    sport: 'basketball',
    competition: 'NBA · Saison régulière',
    home: 'Boston Celtics',
    away: 'Chicago Bulls',
    status: 'upcoming',
    detail: 'Demain',
    startTime: '01:30',
    dayOffset: 1,
  },
  {
    id: 'lille-rennes',
    sport: 'football',
    competition: 'Ligue 1 · 8e journée',
    home: 'LOSC Lille',
    away: 'Stade Rennais',
    homeScore: 1,
    awayScore: 1,
    status: 'finished',
    detail: 'Terminé',
    startTime: '18:00',
  },
];

export const standings: Record<Sport, Standing[]> = {
  football: [
    { team: 'Paris Saint-Germain', played: 8, wins: 6, tiesOrLosses: 1, points: 19 },
    { team: 'AS Monaco', played: 8, wins: 5, tiesOrLosses: 2, points: 17 },
    { team: 'Olympique de Marseille', played: 8, wins: 5, tiesOrLosses: 1, points: 16 },
    { team: 'LOSC Lille', played: 8, wins: 4, tiesOrLosses: 2, points: 14 },
  ],
  basketball: [
    { team: 'Boston Celtics', played: 4, wins: 3, tiesOrLosses: 1, points: 6 },
    { team: 'New York Knicks', played: 4, wins: 3, tiesOrLosses: 1, points: 6 },
    { team: 'Milwaukee Bucks', played: 4, wins: 2, tiesOrLosses: 2, points: 4 },
    { team: 'Chicago Bulls', played: 4, wins: 1, tiesOrLosses: 3, points: 2 },
  ],
};

export const fantasyPlayers = [
  { id: 'mbappe', name: 'Kylian Mbappé', club: 'Real Madrid', points: 18 },
  { id: 'saka', name: 'Bukayo Saka', club: 'Arsenal', points: 14 },
  { id: 'wembanyama', name: 'Victor Wembanyama', club: 'San Antonio', points: 22 },
];

export const matchStatusLabels: Record<MatchStatus, string> = {
  live: 'En direct',
  upcoming: 'À venir',
  finished: 'Terminé',
};
