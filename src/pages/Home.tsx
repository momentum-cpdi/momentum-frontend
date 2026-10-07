import { useMemo, useState } from 'react';
import {
  IonContent,
  IonIcon,
  IonPage,
} from '@ionic/react';
import {
  addOutline,
  arrowForwardOutline,
  basketballOutline,
  chevronBackOutline,
  chevronForwardOutline,
  footballOutline,
  searchOutline,
  star,
  starOutline,
  trophyOutline,
} from 'ionicons/icons';
import MatchCard from '../components/MatchCard';
import { demoMatches, fantasyPlayers, standings, type MatchStatus, type Sport } from '../data/demoSports';
import './Home.css';

type Page = 'home' | 'matches' | 'standings' | 'fantasy';

const pageLabels: Record<Page, string> = {
  home: 'Accueil',
  matches: 'Matchs',
  standings: 'Classements',
  fantasy: 'Fantasy',
};

function SportIcon({ sport }: { sport: Sport }) {
  return (
    <IonIcon
      aria-hidden="true"
      className="sport-icon"
      icon={sport === 'football' ? footballOutline : basketballOutline}
    />
  );
}

const Home: React.FC = () => {
  const [page, setPage] = useState<Page>('home');
  const [selectedDay, setSelectedDay] = useState(0);
  const [sportFilter, setSportFilter] = useState<Sport | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<MatchStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [standingsSport, setStandingsSport] = useState<Sport>('football');
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(
    () => new Set(['mbappe']),
  );
  const [teamCreated, setTeamCreated] = useState(false);

  const filteredMatches = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr');
    return demoMatches.filter((match) => {
      const matchesSport = sportFilter === 'all' || match.sport === sportFilter;
      const matchesStatus = statusFilter === 'all' || match.status === statusFilter;
      const matchesFavorite = !favoritesOnly || favorites.has(match.id);
      const matchesSearch = !query
        || `${match.home} ${match.away} ${match.competition}`
          .toLocaleLowerCase('fr')
          .includes(query);
      return matchesSport && matchesStatus && matchesFavorite && matchesSearch;
    });
  }, [favorites, favoritesOnly, search, sportFilter, statusFilter]);

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const togglePlayer = (id: string) => {
    setTeamCreated(false);
    setSelectedPlayers((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < fantasyPlayers.length) {
        next.add(id);
      }
      return next;
    });
  };

  const visibleMatches = page === 'home' && !search.trim()
    ? filteredMatches.filter((match) => match.status === 'live')
    : filteredMatches;
  const upcomingMatches = filteredMatches.filter(
    (match) => match.status === 'upcoming' && match.dayOffset === selectedDay,
  );

  return (
    <IonPage>
      <IonContent fullscreen className="momentum-content">
        <a className="skip-link" href="#main-content">Aller au contenu principal</a>
        <div className="app-shell">
          <div className="sidebar">
            <a aria-label="Momentum, accueil" className="brand" href="#main-content" onClick={() => setPage('home')}>
              <span aria-hidden="true" className="brand__mark">M</span>
              <span className="brand__word">momentum<span>.</span></span>
            </a>

            <p className="sidebar__label">Menu</p>
            <nav aria-label="Sections de Momentum" className="primary-nav">
              {(Object.keys(pageLabels) as Page[]).map((item) => (
                <button
                  aria-current={page === item ? 'page' : undefined}
                  className={`nav-link${page === item ? ' nav-link--active' : ''}`}
                  key={item}
                  onClick={() => setPage(item)}
                  type="button"
                >
                  <IonIcon
                    aria-hidden="true"
                    icon={item === 'standings' ? trophyOutline : item === 'fantasy' ? starOutline : footballOutline}
                  />
                  <span>{pageLabels[item]}</span>
                  {item === 'matches' && <span className="nav-link__count">2</span>}
                </button>
              ))}
            </nav>

            <section aria-labelledby="sidebar-live-title" className="sidebar-live">
              <h2 id="sidebar-live-title">En ce moment</h2>
              <p><span aria-hidden="true" className="live-dot" /> 2 rencontres en direct</p>
              <button className="text-link" onClick={() => setPage('matches')} type="button">
                Voir les matchs <IonIcon aria-hidden="true" icon={arrowForwardOutline} />
              </button>
            </section>

            <div className="sidebar__footer">
              <span aria-hidden="true" className="avatar">M</span>
              <span><strong>Mode découverte</strong><small>Compte bientôt disponible</small></span>
            </div>
          </div>

          <div className="workspace">
            <header className="topbar">
              <a aria-label="Momentum, accueil" className="brand brand--mobile" href="#main-content" onClick={() => setPage('home')}>
                <span aria-hidden="true" className="brand__mark">M</span>
                <span className="brand__word">momentum<span>.</span></span>
              </a>
              <label className="search-box">
                <IonIcon aria-hidden="true" icon={searchOutline} />
                <span className="visually-hidden">Rechercher une équipe ou une compétition</span>
                <input
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher une équipe, une compétition…"
                  type="search"
                  value={search}
                />
              </label>
              <div aria-label="Application en mode démonstration" className="demo-indicator">
                <span aria-hidden="true" className="demo-indicator__dot" />
                Mode démo
              </div>
            </header>

            <main id="main-content" className="main-content" tabIndex={-1}>
              {page === 'home' && (
                <div className="mobile-page-title">
                  <span className="eyebrow">MARDI 6 OCTOBRE 2026</span>
                  <p>Bonjour, passionné·e de sport</p>
                </div>
              )}

              <section aria-label="Filtrer les rencontres" className="filter-bar">
                <div aria-label="Filtrer par sport" className="sport-filters" role="group">
                  {([
                    ['all', 'Tous les sports'],
                    ['football', 'Football'],
                    ['basketball', 'Basketball'],
                  ] as const).map(([value, label]) => (
                    <button
                      aria-pressed={sportFilter === value}
                      className={`filter-chip${sportFilter === value ? ' filter-chip--active' : ''}`}
                      key={value}
                      onClick={() => setSportFilter(value)}
                      type="button"
                    >
                      {value !== 'all' && <SportIcon sport={value} />}
                      {label}
                    </button>
                  ))}
                </div>
                <p className="data-notice">
                  <span aria-hidden="true">i</span> Scores de démonstration
                </p>
              </section>

              {page === 'home' && (
                <div className="dashboard-grid">
                  <div className="dashboard-main">
                    <section aria-labelledby="welcome-title" className="welcome-panel">
                      <div className="welcome-panel__content">
                        <span className="eyebrow eyebrow--light">MARDI 6 OCTOBRE 2026</span>
                        <h1 id="welcome-title">Toute l’émotion<br />du sport, au même endroit.</h1>
                        <p>Suivez vos équipes, découvrez les résultats et ne manquez aucun temps fort.</p>
                        <button className="welcome-panel__action" onClick={() => setPage('matches')} type="button">
                          Explorer les matchs <IonIcon aria-hidden="true" icon={arrowForwardOutline} />
                        </button>
                      </div>
                      <div aria-hidden="true" className="welcome-art">
                        <span className="welcome-art__ball">M</span>
                        <span className="welcome-art__orbit welcome-art__orbit--one" />
                        <span className="welcome-art__orbit welcome-art__orbit--two" />
                      </div>
                      <span className="welcome-panel__caption">Le jeu ne s’arrête jamais.</span>
                    </section>

                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">À NE PAS MANQUER</span>
                        <h2>
                          {search.trim() ? 'Résultats de recherche' : 'En direct'}
                          {!search.trim() && <span className="heading-count">{visibleMatches.length}</span>}
                        </h2>
                      </div>
                      <button className="text-link" onClick={() => setPage('matches')} type="button">
                        Tous les matchs <IonIcon aria-hidden="true" icon={arrowForwardOutline} />
                      </button>
                    </div>

                    <div aria-live="polite" className="match-list">
                      {visibleMatches.length > 0 ? visibleMatches.map((match) => (
                        <MatchCard
                          isFavorite={favorites.has(match.id)}
                          key={match.id}
                          match={match}
                          onToggleFavorite={toggleFavorite}
                        />
                      )) : (
                        <p className="empty-state">Aucun match ne correspond à votre recherche ou à ces filtres.</p>
                      )}
                    </div>

                    {!search.trim() && (
                    <section aria-labelledby="upcoming-title" className="upcoming-section">
                      <div className="section-heading">
                        <div>
                          <span className="eyebrow">LE PROGRAMME</span>
                          <h2 id="upcoming-title">Prochainement</h2>
                        </div>
                        <button
                          aria-label="Jour précédent"
                          className="icon-button"
                          disabled={selectedDay === 0}
                          onClick={() => setSelectedDay((day) => Math.max(0, day - 1))}
                          type="button"
                        >
                          <IonIcon aria-hidden="true" icon={chevronBackOutline} />
                        </button>
                        <span aria-live="polite" className="selected-day">
                          {selectedDay === 0 ? 'Aujourd’hui' : 'Demain'}
                        </span>
                        <button
                          aria-label="Jour suivant"
                          className="icon-button"
                          disabled={selectedDay === 1}
                          onClick={() => setSelectedDay((day) => Math.min(1, day + 1))}
                          type="button"
                        >
                          <IonIcon aria-hidden="true" icon={chevronForwardOutline} />
                        </button>
                      </div>
                      <div className="upcoming-row">
                        {upcomingMatches.map((match) => (
                          <MatchCard
                            isFavorite={favorites.has(match.id)}
                            key={match.id}
                            match={match}
                            onToggleFavorite={toggleFavorite}
                          />
                        ))}
                        {upcomingMatches.length === 0 && (
                          <p className="empty-state">Aucune rencontre prévue ce jour pour ces filtres.</p>
                        )}
                      </div>
                    </section>
                    )}
                  </div>

                  <aside aria-label="À suivre" className="dashboard-aside">
                    <section className="aside-card">
                      <div className="aside-card__heading">
                        <div>
                          <span className="eyebrow">LIGUE 1</span>
                          <h2>Le classement</h2>
                        </div>
                        <span aria-hidden="true" className="league-mark">L1</span>
                      </div>
                      <ol aria-label="Classement Ligue 1, aperçu" className="mini-table">
                        {standings.football.slice(0, 4).map((team, index) => (
                          <li key={team.team}>
                            <span className="mini-table__rank">{String(index + 1).padStart(2, '0')}</span>
                            <span className="mini-table__team">{team.team}</span>
                            <strong>{team.points}</strong>
                          </li>
                        ))}
                      </ol>
                      <button className="text-link" onClick={() => setPage('standings')} type="button">
                        Voir le classement <IonIcon aria-hidden="true" icon={arrowForwardOutline} />
                      </button>
                    </section>

                    <section aria-labelledby="fantasy-teaser-title" className="fantasy-teaser">
                      <span aria-hidden="true" className="fantasy-teaser__icon">
                        <IonIcon aria-hidden="true" icon={trophyOutline} />
                      </span>
                      <span className="eyebrow">À VOUS DE JOUER</span>
                      <h2 id="fantasy-teaser-title">Votre équipe.<br />Vos règles.</h2>
                      <p>Composez votre équipe Fantasy et défiez vos amis.</p>
                      <button className="text-link" onClick={() => setPage('fantasy')} type="button">
                        Découvrir Fantasy <IonIcon aria-hidden="true" icon={arrowForwardOutline} />
                      </button>
                    </section>
                  </aside>
                </div>
              )}

              {page === 'matches' && (
                <section aria-labelledby="matches-title" className="page-section">
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">LE SPORT EN DIRECT</span>
                      <h1 id="matches-title">Tous les matchs</h1>
                      <p>Retrouvez les rencontres à suivre et leurs résultats.</p>
                    </div>
                    <button
                      aria-pressed={favoritesOnly}
                      className={`filter-chip${favoritesOnly ? ' filter-chip--active' : ''}`}
                      onClick={() => setFavoritesOnly((value) => !value)}
                      type="button"
                    >
                      <IonIcon aria-hidden="true" icon={favoritesOnly ? star : starOutline} />
                      Mes favoris
                    </button>
                  </div>
                  <div aria-label="Filtrer par statut" className="status-filters" role="group">
                    {([
                      ['all', 'Tous'],
                      ['live', 'En direct'],
                      ['upcoming', 'À venir'],
                      ['finished', 'Terminés'],
                    ] as const).map(([value, label]) => (
                      <button
                        aria-pressed={statusFilter === value}
                        className={`status-filter${statusFilter === value ? ' status-filter--active' : ''}`}
                        key={value}
                        onClick={() => setStatusFilter(value)}
                        type="button"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div aria-live="polite" className="matches-grid">
                    {filteredMatches.length > 0 ? filteredMatches.map((match) => (
                      <MatchCard
                        isFavorite={favorites.has(match.id)}
                        key={match.id}
                        match={match}
                        onToggleFavorite={toggleFavorite}
                      />
                    )) : (
                      <p className="empty-state">Aucun match trouvé. Modifiez vos filtres ou votre recherche.</p>
                    )}
                  </div>
                </section>
              )}

              {page === 'standings' && (
                <section aria-labelledby="standings-title" className="page-section">
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">LES CHIFFRES DE LA SAISON</span>
                      <h1 id="standings-title">Classements</h1>
                      <p>Les équipes en tête de leur championnat.</p>
                    </div>
                  </div>
                  <div aria-label="Choisir un sport" className="sport-filters" role="group">
                    {(['football', 'basketball'] as const).map((sport) => (
                      <button
                        aria-pressed={standingsSport === sport}
                        className={`filter-chip${standingsSport === sport ? ' filter-chip--active' : ''}`}
                        key={sport}
                        onClick={() => setStandingsSport(sport)}
                        type="button"
                      >
                        <SportIcon sport={sport} />
                        {sport === 'football' ? 'Ligue 1' : 'NBA'}
                      </button>
                    ))}
                  </div>
                  <div className="standings-card">
                    <div className="standings-card__heading">
                      <div>
                        <span className="eyebrow">{standingsSport === 'football' ? 'FRANCE' : 'ÉTATS-UNIS'}</span>
                        <h2>{standingsSport === 'football' ? 'Ligue 1' : 'NBA · Conférence Est'}</h2>
                      </div>
                      <span className="data-badge">Données de démo</span>
                    </div>
                    <div
                      aria-label="Tableau du classement, faites défiler horizontalement pour consulter toutes les colonnes"
                      className="table-scroll"
                      role="region"
                      tabIndex={0}
                    >
                      <table>
                        <caption className="visually-hidden">
                          {standingsSport === 'football' ? 'Classement de Ligue 1' : 'Classement NBA de la Conférence Est'}
                        </caption>
                        <thead>
                          <tr>
                            <th scope="col">Pos.</th>
                            <th scope="col">Équipe</th>
                            <th scope="col">Joués</th>
                            <th scope="col">Victoires</th>
                            <th scope="col">{standingsSport === 'football' ? 'Nuls' : 'Défaites'}</th>
                            <th scope="col">Points</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings[standingsSport].map((team, index) => (
                            <tr key={team.team}>
                              <td><span className={`rank rank--${index + 1}`}>{index + 1}</span></td>
                              <th scope="row">{team.team}</th>
                              <td>{team.played}</td>
                              <td>{team.wins}</td>
                              <td>{team.tiesOrLosses}</td>
                              <td><strong>{team.points}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              )}

              {page === 'fantasy' && (
                <section aria-labelledby="fantasy-title" className="page-section">
                  <div className="fantasy-banner">
                    <span className="eyebrow eyebrow--light">FANTASY MOMENTUM</span>
                    <h1 id="fantasy-title">La passion du jeu,<br />à vous de la composer.</h1>
                    <p>Choisissez vos joueurs préférés. Cette équipe de démonstration est enregistrée pour cette session uniquement.</p>
                    <span className="fantasy-banner__score">{selectedPlayers.size}<small> / 3 joueurs</small></span>
                  </div>
                  <section aria-labelledby="players-title" className="player-section">
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">VOTRE SÉLECTION</span>
                        <h2 id="players-title">Joueurs à suivre</h2>
                      </div>
                      <span className="data-badge">Points fictifs</span>
                    </div>
                    <div className="player-list">
                      {fantasyPlayers.map((player) => {
                        const selected = selectedPlayers.has(player.id);
                        return (
                          <article className="player-card" key={player.id}>
                            <span aria-hidden="true" className="player-avatar">{player.name.split(' ').map((part) => part[0]).join('')}</span>
                            <span className="player-card__identity"><strong>{player.name}</strong><small>{player.club}</small></span>
                            <span className="player-card__points"><strong>{player.points}</strong><small>pts</small></span>
                            <button
                              aria-label={`${selected ? 'Retirer' : 'Ajouter'} ${player.name} ${selected ? 'de' : 'à'} mon équipe`}
                              aria-pressed={selected}
                              className={`player-toggle${selected ? ' player-toggle--selected' : ''}`}
                              onClick={() => togglePlayer(player.id)}
                              type="button"
                            >
                              <IonIcon aria-hidden="true" icon={selected ? star : addOutline} />
                              <span>{selected ? 'Dans mon équipe' : 'Ajouter'}</span>
                            </button>
                          </article>
                        );
                      })}
                    </div>
                    <p aria-live="polite" className="form-feedback">
                      {teamCreated
                        ? `Votre équipe de démonstration est prête avec ${selectedPlayers.size} joueur${selectedPlayers.size > 1 ? 's' : ''}.`
                        : selectedPlayers.size >= fantasyPlayers.length
                          ? 'Votre équipe est complète.'
                          : `${fantasyPlayers.length - selectedPlayers.size} place${fantasyPlayers.length - selectedPlayers.size > 1 ? 's' : ''} disponible${fantasyPlayers.length - selectedPlayers.size > 1 ? 's' : ''} dans votre équipe.`}
                    </p>
                    <button
                      className="primary-button"
                      disabled={selectedPlayers.size === 0}
                      onClick={() => setTeamCreated(true)}
                      type="button"
                    >
                      Créer mon équipe de démo <IonIcon aria-hidden="true" icon={arrowForwardOutline} />
                    </button>
                  </section>
                </section>
              )}
            </main>

            <nav aria-label="Navigation mobile" className="mobile-nav">
              {(Object.keys(pageLabels) as Page[]).map((item) => (
                <button
                  aria-current={page === item ? 'page' : undefined}
                  className={`mobile-nav__item${page === item ? ' mobile-nav__item--active' : ''}`}
                  key={item}
                  onClick={() => setPage(item)}
                  type="button"
                >
                  <IonIcon
                    aria-hidden="true"
                    icon={item === 'standings' ? trophyOutline : item === 'fantasy' ? starOutline : footballOutline}
                  />
                  <span>{pageLabels[item]}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
