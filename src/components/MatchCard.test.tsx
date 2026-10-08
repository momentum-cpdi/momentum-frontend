import { vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MatchCard from './MatchCard';
import { demoMatches } from '../data/demoSports';

const byId = (id: string) => demoMatches.find((match) => match.id === id)!;

describe('MatchCard', () => {
  it('announces a live match and its scores accessibly', () => {
    render(<MatchCard isFavorite={false} match={byId('psg-marseille')} onToggleFavorite={vi.fn()} />);

    expect(screen.getByText(/Match en direct/)).toBeInTheDocument();
    expect(screen.getByLabelText('Score : 2 buts')).toBeInTheDocument();
    expect(screen.getByLabelText('Score : 1 buts')).toBeInTheDocument();
  });

  it('uses "points" for basketball scores', () => {
    render(<MatchCard isFavorite={false} match={byId('lakers-warriors')} onToggleFavorite={vi.fn()} />);
    expect(screen.getByLabelText('Score : 84 points')).toBeInTheDocument();
  });

  it('shows the start time and no score for an upcoming match', () => {
    render(<MatchCard isFavorite={false} match={byId('lyon-monaco')} onToggleFavorite={vi.fn()} />);

    expect(screen.getByText('21:00')).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Score/)).not.toBeInTheDocument();
  });

  it('toggles the favorite with the right accessible name and pressed state', () => {
    const onToggle = vi.fn();
    const { rerender } = render(<MatchCard isFavorite={false} match={byId('lille-rennes')} onToggleFavorite={onToggle} />);

    const add = screen.getByRole('button', { name: /ajouter .* aux favoris/i });
    expect(add).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(add);
    expect(onToggle).toHaveBeenCalledWith('lille-rennes');

    rerender(<MatchCard isFavorite match={byId('lille-rennes')} onToggleFavorite={onToggle} />);
    expect(screen.getByRole('button', { name: /retirer .* des favoris/i })).toHaveAttribute('aria-pressed', 'true');
  });
});