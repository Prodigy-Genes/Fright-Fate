import "../styles/GameResults.css";

interface GameResultsProps {
  results: any;
  onPlayAgain: () => void;
}

export function GameResults({ results, onPlayAgain }: GameResultsProps) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'rank-winner';
    if (rank <= 3) return 'rank-podium';
    return 'rank-eliminated';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '💀';
  };

  const getRankTitle = (rank: number, totalPlayers: number) => {
    if (totalPlayers === 1) return 'SURVIVAL ANALYSIS';
    if (rank === 1) return 'SOLE SURVIVOR';
    if (rank === totalPlayers) return 'FIRST TO DIE';
    return `DIES ${rank === 2 ? 'SECOND' : rank === 3 ? 'THIRD' : `${rank}TH`}`;
  };

  return (
    <div className="game-results-container">
      <div className="results-header">
        <h1 className="results-title glow-decay spectral">
          {results.rankings.length === 1 ? 'SURVIVAL ANALYSIS' : 'SURVIVOR REPORT'}
        </h1>
        <p className="results-subtitle ghost-text">
          {results.rankings.length === 1 
            ? 'Your horror survival instincts have been analyzed...' 
            : 'The horror has claimed its victims...'
          }
        </p>
      </div>

      {/* Overall Narrative */}
      <div className="narrative-section cobweb-lines">
        <h2 className="narrative-title glow-green">The Story</h2>
        <p className="narrative-text">
          {results.narrative}
        </p>
      </div>

      {/* Player Rankings */}
      <div className="rankings-section">
        <h2 className="rankings-title glow-bone spectral">
          {results.rankings.length === 1 ? 'Your Analysis' : 'Final Rankings'}
        </h2>
        {results.rankings.map((player: any, index: number) => (
          <div
            key={player.playerId}
            className={`player-card ${
              player.rank === 1 
                ? 'winner-card' 
                : player.rank === results.rankings.length
                ? 'eliminated-card'
                : 'standard-card'
            }`}
          >
            <div className="player-header">
              <div className="player-info">
                <div className="rank-icon">{getRankIcon(player.rank)}</div>
                <div className="player-details">
                  <h3 className="player-name glow-bone">{player.playerName}</h3>
                  <p className={`rank-title ${getRankColor(player.rank)}`}>
                    {getRankTitle(player.rank, results.rankings.length)}
                  </p>
                </div>
              </div>
              <div className="player-stats">
                <div className="rank-number glow-green">#{player.rank}</div>
                <div className="survival-score">
                  Survival Score: {player.survivalScore}/100
                </div>
              </div>
            </div>
            
            <div className="commentary-section">
              <p className="commentary-text">{player.commentary}</p>
            </div>

            {player.deathScene && (
              <div className="death-scene">
                <p className="death-text">
                  <strong>Cause of Death:</strong> {player.deathScene}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="action-section">
        <button
          onClick={onPlayAgain}
          className="auth-button play-again-btn"
        >
          Play Another Horror
        </button>
        
        <div className="share-text ghost-text">
          <p>Share your results with friends and see who's the ultimate survivor!</p>
        </div>
      </div>
    </div>
  );
}