import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import "../styles/GameLobby.css"; 
interface GameLobbyProps {
  onJoinSession: (sessionId: string) => void;
}

const HORROR_THEMES = [
  { id: "haunted-house", name: "Haunted House", description: "Explore a cursed Victorian mansion filled with supernatural terrors" },
  { id: "zombie-outbreak", name: "Zombie Outbreak", description: "Survive the undead apocalypse in an infected city" },
];

export function GameLobby({ onJoinSession }: GameLobbyProps) {
  const [selectedTheme, setSelectedTheme] = useState("haunted-house");
  const [selectedSoloTheme, setSelectedSoloTheme] = useState("haunted-house");
  const [sessionCode, setSessionCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const createSession = useMutation(api.game.createGameSession);
  const createSoloSession = useMutation(api.game.createSoloSession);
  const joinSession = useMutation(api.game.joinGameSession);

  const handleCreateSoloSession = async () => {
    setIsCreating(true);
    try {
      const result = await createSoloSession({ theme: selectedSoloTheme });
      toast.success("Solo horror experience started!");
      onJoinSession(result.sessionId);
    } catch (error) {
      toast.error("Failed to start solo game");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateSession = async () => {
    setIsCreating(true);
    try {
      const result = await createSession({ theme: selectedTheme });
      toast.success(`Game created! Code: ${result.sessionCode}`);
      onJoinSession(result.sessionId);
    } catch (error) {
      toast.error("Failed to create game");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSession = async () => {
    if (!sessionCode.trim() || !playerName.trim()) {
      toast.error("Please enter both session code and your name");
      return;
    }

    setIsJoining(true);
    try {
      const result = await joinSession({ 
        sessionCode: sessionCode.toUpperCase(), 
        playerName: playerName.trim() 
      });
      toast.success("Joined game successfully!");
      onJoinSession(result.sessionId);
    } catch (error) {
      toast.error("Failed to join game. Check the session code.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="game-lobby">
      <div className="game-lobby__header">
        <h1 className="game-lobby__title glow-bone">
          Fright-Fate
        </h1>
        <h2 className="game-lobby__subtitle glow-green">
          Who Dies First?
        </h2>
        <p className="game-lobby__description">
          Face 10 terrifying scenarios. Make your choices. Discover who survives the horror.
        </p>
      </div>

      <div className="game-lobby__grid">
        {/* Play Solo */}
        <div className="game-lobby__card game-lobby__card--solo">
          <h3 className="game-lobby__card-title glow-decay">Play Solo</h3>
          <p className="game-lobby__card-description">Test your survival instincts alone</p>
          
          <div className="game-lobby__theme-selector">
            <label className="game-lobby__theme-label">Choose Your Horror:</label>
            <div className="game-lobby__theme-options">
              {HORROR_THEMES.map((theme) => (
                <label key={theme.id} className="game-lobby__theme-option">
                  <input
                    type="radio"
                    name="solo-theme"
                    value={theme.id}
                    checked={selectedSoloTheme === theme.id}
                    onChange={(e) => setSelectedSoloTheme(e.target.value)}
                    className="game-lobby__theme-radio"
                  />
                  <div className="game-lobby__theme-info">
                    <div className="game-lobby__theme-name">{theme.name}</div>
                    <div className="game-lobby__theme-description">{theme.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreateSoloSession}
            disabled={isCreating}
            className="game-lobby__button game-lobby__button--solo"
          >
            {isCreating ? "Starting..." : "Face Horror Alone"}
          </button>
        </div>

        {/* Create Multiplayer Game */}
        <div className="game-lobby__card game-lobby__card--create">
          <h3 className="game-lobby__card-title glow-bone">Create Multiplayer</h3>
          <p className="game-lobby__card-description">Host a game for friends</p>
          
          <div className="game-lobby__theme-selector">
            <label className="game-lobby__theme-label">Choose Your Horror:</label>
            <div className="game-lobby__theme-options">
              {HORROR_THEMES.map((theme) => (
                <label key={theme.id} className="game-lobby__theme-option">
                  <input
                    type="radio"
                    name="theme"
                    value={theme.id}
                    checked={selectedTheme === theme.id}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="game-lobby__theme-radio"
                  />
                  <div className="game-lobby__theme-info">
                    <div className="game-lobby__theme-name">{theme.name}</div>
                    <div className="game-lobby__theme-description">{theme.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreateSession}
            disabled={isCreating}
            className="game-lobby__button game-lobby__button--create"
          >
            {isCreating ? "Creating..." : "Create Horror Game"}
          </button>
        </div>

        {/* Join Game */}
        <div className="game-lobby__card game-lobby__card--join">
          <h3 className="game-lobby__card-title glow-bone">Join Game</h3>
          <p className="game-lobby__card-description">Join a friend's horror session</p>
          
          <div className="game-lobby__input-group">
            <div className="game-lobby__input-field">
              <label className="game-lobby__input-label">Session Code:</label>
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="auth-input-field"
              />
            </div>
            
            <div className="game-lobby__input-field">
              <label className="game-lobby__input-label">Your Name:</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="auth-input-field"
              />
            </div>
          </div>

          <button
            onClick={handleJoinSession}
            disabled={isJoining || !sessionCode.trim() || !playerName.trim()}
            className="game-lobby__button game-lobby__button--join"
          >
            {isJoining ? "Joining..." : "Join Horror Game"}
          </button>
        </div>
      </div>

      <div className="game-lobby__instructions">
        <div className="game-lobby__instructions-content">
          <h4 className="game-lobby__instructions-title glow-green">How to Play:</h4>
          <div className="game-lobby__instructions-list">
            <p>• Play solo or create/join a multiplayer game</p>
            <p>• Face 10 terrifying survival scenarios</p>
            <p>• Describe what you would do in each situation</p>
            <p>• AI analyzes your choices to determine survival chances</p>
            <p>• Get a cinematic report of your horror movie fate</p>
          </div>
        </div>
      </div>
    </div>
  );
}