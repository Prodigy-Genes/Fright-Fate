import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface GameSessionProps {
  session: any;
  onLeaveSession: () => void;
}

export function GameSession({ session, onLeaveSession }: GameSessionProps) {
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const toggleReady = useMutation(api.game.togglePlayerReady);
  const startGame = useMutation(api.game.startGame);
  const submitAnswer = useMutation(api.game.submitAnswer);
  const playerAnswers = useQuery(api.game.getPlayerAnswers, { sessionId: session._id });

  const currentUser = useQuery(api.auth.loggedInUser);
  const currentPlayer = session.players.find((p: any) => p.userId === currentUser?._id);
  const isHost = session.hostId === currentUser?._id;
  const allPlayersReady = session.players.every((p: any) => p.isReady);

  // Get current answer if it exists
  useEffect(() => {
    if (playerAnswers && session.status === "active") {
      const existingAnswer = playerAnswers.find(
        (a: any) => a.sceneNumber === session.currentScene
      );
      if (existingAnswer) {
        setCurrentAnswer(existingAnswer.answer);
      } else {
        setCurrentAnswer("");
      }
    }
  }, [playerAnswers, session.currentScene, session.status]);

  const handleToggleReady = async () => {
    try {
      await toggleReady({ sessionId: session._id });
    } catch (error) {
      toast.error("Failed to update ready status");
    }
  };

  const handleStartGame = async () => {
    try {
      await startGame({ sessionId: session._id });
      toast.success("Game started!");
    } catch (error) {
      toast.error("Failed to start game");
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) {
      toast.error("Please enter your response");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAnswer({ 
        sessionId: session._id, 
        answer: currentAnswer.trim() 
      });
      toast.success("Response submitted!");
    } catch (error) {
      toast.error("Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (session.status === "waiting") {
    return (
      <div className="game-session-container">
        <div className="lobby-card cobweb-lines">
          <div className="lobby-header">
            <h2 className="lobby-title glow-decay spectral">Game Lobby</h2>
            <div className="session-code glow-bone">
              {session.sessionCode}
            </div>
            <p className="lobby-subtitle ghost-text">Share this code with your friends</p>
          </div>

          <div className="players-section">
            <h3 className="players-title glow-green">
              Players ({session.players.length})
            </h3>
            <div className="players-list">
              {session.players.map((player: any) => (
                <div key={player._id} className="player-item">
                  <span className="player-name">
                    {player.name}
                    {player.userId === session.hostId && (
                      <span className="host-badge">HOST</span>
                    )}
                  </span>
                  <span className={`ready-status ${player.isReady ? 'ready' : 'not-ready'}`}>
                    {player.isReady ? '✓ Ready' : '⏳ Not Ready'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lobby-actions">
            <button
              onClick={() => { handleToggleReady(); }}
              className={`auth-button ready-button ${
                currentPlayer?.isReady ? 'ready-active' : 'ready-inactive'
              }`}
            >
              {currentPlayer?.isReady ? 'Ready ✓' : 'Mark as Ready'}
            </button>

            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={!allPlayersReady || session.players.length < 2}
                className="auth-button start-game-button"
              >
                {!allPlayersReady 
                  ? 'Waiting for all players to be ready...'
                  : session.players.length < 2
                  ? 'Need at least 2 players'
                  : 'Start Horror Game'
                }
              </button>
            )}

            <button
              onClick={onLeaveSession}
              className="auth-button leave-button"
            >
              Leave Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (session.status === "active" && session.currentScenario) {
    const hasSubmitted = playerAnswers?.some(
      (a: any) => a.sceneNumber === session.currentScene
    );

    return (
      <div className="game-session-container active-game">
        <div className="game-card cobweb-lines">
          <div className="game-progress">
            <div className="scene-indicator glow-decay">
              Scene {session.currentScene + 1} of {session.totalScenes}
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar"
                style={{ width: `${((session.currentScene + 1) / session.totalScenes) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="scenario-section">
            <h2 className="scenario-title glow-green spectral">
              {session.currentScenario.title}
            </h2>
            <div className="scenario-description">
              <p className="scenario-text">
                {session.currentScenario.scene}
              </p>
            </div>
            <h3 className="scenario-question glow-bone">
              {session.currentScenario.question}
            </h3>
          </div>

          <div className="answer-section">
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Describe what you would do in this situation..."
              rows={4}
              className="answer-textarea auth-input-field"
              disabled={hasSubmitted}
            />

            <button
              onClick={handleSubmitAnswer}
              disabled={isSubmitting || !currentAnswer.trim() || hasSubmitted}
              className="auth-button submit-answer-button"
            >
              {isSubmitting 
                ? 'Submitting...' 
                : hasSubmitted 
                ? 'Response Submitted - Waiting for others...'
                : 'Submit Response'
              }
            </button>

            <div className="response-counter">
              <p className="counter-text ghost-text">
                {session.players.filter((p: any) => 
                  playerAnswers?.some((a: any) => 
                    a.playerId === p._id && a.sceneNumber === session.currentScene
                  )
                ).length} of {session.players.length} players have responded
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (session.status === "completed") {
    return (
      <div className="game-session-container">
        <div className="completion-card cobweb-lines">
          <h2 className="completion-title glow-decay spectral">Game Complete!</h2>
          <p className="completion-text glow-bone">Analyzing your survival chances...</p>
          <div className="medieval-spinner"></div>
        </div>
      </div>
    );
  }

  return null;
}