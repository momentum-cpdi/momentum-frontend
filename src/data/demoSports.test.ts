import { demoMatches, fantasyPlayers, matchStatusLabels, standings } from './demoSports';

describe('demo data', () => {
  it('has unique match ids and a label for every status', () => {
    const ids = demoMatches.map((match) => match.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const match of demoMatches) {
      expect(matchStatusLabels[match.status]).toBeTruthy();
    }
  });

  it('only gives scores to live and finished matches', () => {
    for (const match of demoMatches) {
      const hasScore = match.homeScore !== undefined && match.awayScore !== undefined;
      expect(hasScore).toBe(match.status !== 'upcoming');
    }
  });

  it('keeps standings sorted by points', () => {
    for (const table of Object.values(standings)) {
      const points = table.map((row) => row.points);
      expect(points).toEqual([...points].sort((a, b) => b - a));
    }
  });

  it('has unique fantasy players', () => {
    const ids = fantasyPlayers.map((player) => player.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});