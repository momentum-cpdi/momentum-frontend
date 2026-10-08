import { fireEvent, render, screen } from '@testing-library/react';
import Home from './Home';

describe('Home navigation', () => {
  it('moves between pages with the teaser links of the dashboard', async () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: /voir le classement/i }));
    expect(await screen.findByRole('heading', { name: 'Ligue 1' })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Accueil' })[0]);
    fireEvent.click(screen.getByRole('button', { name: /découvrir fantasy/i }));
    expect(await screen.findByRole('heading', { name: /la passion du jeu/i })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Accueil' })[0]);
    fireEvent.click(screen.getByRole('button', { name: /voir les matchs/i }));
    expect(await screen.findByRole('heading', { name: 'Tous les matchs' })).toBeInTheDocument();
  });

  it('marks the active page with aria-current in the mobile navigation', () => {
    render(<Home />);
    const mobileNav = screen.getByRole('navigation', { name: 'Navigation mobile' });

    expect(mobileNav.querySelector('[aria-current="page"]')).toHaveTextContent('Accueil');
    fireEvent.click(mobileNav.querySelectorAll('button')[1]);
    expect(mobileNav.querySelector('[aria-current="page"]')).toHaveTextContent('Matchs');
  });

  it('shows an empty state when no match fits the search', () => {
    render(<Home />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz-inconnu' } });
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });

  it('removes a favorite when toggled twice', async () => {
    render(<Home />);
    fireEvent.click(screen.getAllByRole('button', { name: /^Matchs/ })[0]);

    const add = (await screen.findAllByRole('button', { name: /ajouter .* aux favoris/i }))[0];
    fireEvent.click(add);
    expect(add).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(add);
    expect(add).toHaveAttribute('aria-pressed', 'false');
  });

  it('lets the user remove a player from the demo fantasy team', async () => {
    render(<Home />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Fantasy' })[0]);

    const remove = await screen.findByRole('button', { name: /retirer kylian mbappé/i });
    fireEvent.click(remove);
    expect(screen.getByRole('button', { name: /ajouter kylian mbappé/i })).toBeInTheDocument();
  });
});