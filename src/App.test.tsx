import { vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Home from './pages/Home';

const jsonResponse = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);

test('falls back to demo mode when the API is unreachable', async () => {
  render(<Home />);

  expect(await screen.findAllByText(/API indisponible · mode démo/)).not.toHaveLength(0);
  expect(screen.getByRole('button', { name: 'Football' })).toBeInTheDocument();
});

test('shows the connected status and the sports provided by the API', async () => {
  vi.stubGlobal('fetch', vi.fn((url: string) => url.endsWith('/api/health')
    ? jsonResponse({ status: 'UP', service: 'momentum-backend', timestamp: '2026-10-07T00:00:00Z' })
    : jsonResponse([
      { id: 1, name: 'Foot (API)', code: 'FOOT', type: 'FOOTBALL', active: true },
      { id: 2, name: 'Basket (API)', code: 'BASKET', type: 'BASKETBALL', active: false },
    ])));
  render(<Home />);

  expect(await screen.findByRole('status')).toHaveTextContent('API connectée');
  expect(screen.getByRole('button', { name: 'Foot (API)' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Basket/ })).not.toBeInTheDocument();
});

test('shows the accessible sports dashboard and its demo notice', async () => {
  render(<Home />);

  expect(await screen.findByRole('heading', { name: /toute l’émotion/i })).toBeInTheDocument();
  expect(screen.getByText('Scores de démonstration')).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Sections de Momentum' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Aller au contenu principal' })).toHaveAttribute('href', '#main-content');
});

test('searches match fixtures and navigates the upcoming schedule by day', () => {
  render(<Home />);

  fireEvent.click(screen.getByRole('button', { name: 'Jour suivant' }));
  expect(screen.getByText('Demain')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Jour précédent' }));
  expect(screen.getByText('Aujourd’hui')).toBeInTheDocument();

  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Lyon' } });
  expect(screen.getByRole('heading', { name: 'Résultats de recherche' })).toBeInTheDocument();
  expect(screen.getByText('Olympique Lyonnais')).toBeInTheDocument();
});

test('filters scores and supports following favorite matches', async () => {
  render(<Home />);

  fireEvent.click(screen.getAllByRole('button', { name: /^Matchs/ })[0]);
  expect(await screen.findByRole('heading', { name: 'Tous les matchs' })).toBeInTheDocument();
  expect(screen.getAllByRole('article')).toHaveLength(5);

  fireEvent.click(screen.getByRole('button', { name: 'Basketball' }));
  expect(screen.getAllByRole('article')).toHaveLength(2);

  fireEvent.click(screen.getByRole('button', { name: 'En direct' }));
  expect(screen.getAllByRole('article')).toHaveLength(1);

  const favoriteButton = screen.getByRole('button', {
    name: /ajouter .*lakers.*warriors.*favoris/i,
  });
  fireEvent.click(favoriteButton);
  expect(favoriteButton).toHaveAttribute('aria-pressed', 'true');

  fireEvent.click(screen.getByRole('button', { name: /mes favoris/i }));
  expect(screen.getAllByRole('article')).toHaveLength(1);
  expect(within(screen.getByRole('article')).getByText('Los Angeles Lakers')).toBeInTheDocument();
});

test('changes the standings sport and assembles a demo fantasy team', async () => {
  render(<Home />);

  fireEvent.click(screen.getAllByRole('button', { name: 'Classements' })[0]);
  expect(await screen.findByRole('heading', { name: 'Ligue 1' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'NBA' }));
  expect(screen.getByRole('heading', { name: 'NBA · Conférence Est' })).toBeInTheDocument();

  fireEvent.click(screen.getAllByRole('button', { name: 'Fantasy' })[0]);
  expect(await screen.findByRole('heading', { name: /la passion du jeu/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /ajouter bukayo saka à mon équipe/i }));
  fireEvent.click(screen.getByRole('button', { name: /créer mon équipe de démo/i }));
  expect(screen.getByText('Votre équipe de démonstration est prête avec 2 joueurs.')).toBeInTheDocument();
});
