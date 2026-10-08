import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('redirects the root path to the home dashboard', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    expect(await screen.findByRole('heading', { name: /toute l’émotion/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/home');
  });

  it('renders the home route directly', async () => {
    window.history.pushState({}, '', '/home');
    render(<App />);

    expect(await screen.findByRole('navigation', { name: 'Sections de Momentum' })).toBeInTheDocument();
  });
});