import { IonIcon } from '@ionic/react';
import { basketballOutline, footballOutline, star, starOutline } from 'ionicons/icons';
import { matchStatusLabels, type Match, type Sport } from '../data/demoSports';

function SportIcon({ sport }: { sport: Sport }) {
  return (
    <IonIcon
      aria-hidden="true"
      className="sport-icon"
      icon={sport === 'football' ? footballOutline : basketballOutline}
    />
  );
}

function MatchCard({
  match,
  isFavorite,
  onToggleFavorite,
}: {
  match: Match;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <article className={`match-card${match.status === 'live' ? ' match-card--live' : ''}`}>
      <div className="match-card__topline">
        <span className="competition">
          <SportIcon sport={match.sport} />
          {match.competition}
        </span>
        <button
          aria-label={`${isFavorite ? 'Retirer' : 'Ajouter'} ${match.home} contre ${match.away} ${isFavorite ? 'des' : 'aux'} favoris`}
          aria-pressed={isFavorite}
          className="icon-button favorite-button"
          onClick={() => onToggleFavorite(match.id)}
          type="button"
        >
          <IonIcon aria-hidden="true" icon={isFavorite ? star : starOutline} />
        </button>
      </div>

      <div className="match-card__body">
        <div className="match-team">
          <span aria-hidden="true" className={`team-badge team-badge--${match.sport}`}>
            {match.home.slice(0, 2).toUpperCase()}
          </span>
          <span className="match-team__name">{match.home}</span>
          {match.homeScore !== undefined && (
            <span aria-label={`Score : ${match.homeScore} ${match.sport === 'football' ? 'buts' : 'points'}`} className="match-score">
              {match.homeScore}
            </span>
          )}
        </div>
        <div className="match-team">
          <span aria-hidden="true" className={`team-badge team-badge--${match.sport}`}>
            {match.away.slice(0, 2).toUpperCase()}
          </span>
          <span className="match-team__name">{match.away}</span>
          {match.awayScore !== undefined && (
            <span aria-label={`Score : ${match.awayScore} ${match.sport === 'football' ? 'buts' : 'points'}`} className="match-score">
              {match.awayScore}
            </span>
          )}
        </div>
      </div>

      <div className="match-card__footer">
        <span className={`status status--${match.status}`}>
          {match.status === 'live' && <span aria-hidden="true" className="live-dot" />}
          {match.status === 'live' && <span className="visually-hidden">Match en direct. </span>}
          {matchStatusLabels[match.status]}
          <span className="status__detail">
            {match.status === 'upcoming' ? match.startTime : match.detail}
          </span>
        </span>
        <span className="match-card__demo">Démo</span>
      </div>
    </article>
  );
}

export default MatchCard;
