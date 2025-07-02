import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { GameLobby } from "./components/GameLobby";
import { GameSession } from "./components/GameSession";
import { GameResults } from "./components/GameResults";
import "./styles/App.css";
import { useEffect} from "react";
import creepyAudio from './assets/creepy-weird.mp3';

export default function App() {
  useEffect(() => {
  console.log('Audio path:', creepyAudio);
  
  const audio = new Audio(creepyAudio);
  audio.loop = true;
  audio.volume = 0.1;
  
  audio.addEventListener('error', (e) => {
    console.error('Audio error:', e);
  });
  
  audio.addEventListener('loadstart', () => {
    console.log('Audio loading started');
  });
  
  const playAudio = () => {
    audio.play().catch(console.error);
    document.removeEventListener('click', playAudio);
  };
  
  document.addEventListener('click', playAudio);
  
  return () => {
    audio.pause();
    document.removeEventListener('click', playAudio);
  };
}, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h2 className="app-title glow-cyan">Fright-Fate</h2>
        <Authenticated>
          <SignOutButton />
        </Authenticated>
      </header>
      <main className="app-main">
        <div className="content-wrapper">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  if (loggedInUser === undefined) {
    return (
      <div className="loading-container">
        <div className="horror-spinner"></div>
        <p className="loading-text glow-red matrix-text">INITIALIZING...</p>
      </div>
    );
  }

  return (
    <div className="content-layout">
      <Unauthenticated>
        <div className="hero-section">
          <h1 className="hero-title holographic">
            Fright-Fate
          </h1>
          <h2 className="hero-subtitle glow-pink">
            Who Dies First?
          </h2>
          <p className="hero-description">
            Face 10 terrifying scenarios. Make your choices. Discover who survives the horror.
          </p>
          <div className="glitch-overlay"></div>
        </div>
        <div className="auth-container scan-lines">
          <SignInForm />
        </div>
      </Unauthenticated>

      <Authenticated>
        {!currentSessionId ? (
          <GameLobby onJoinSession={setCurrentSessionId} />
        ) : (
          <GameSessionManager 
            sessionId={currentSessionId} 
            onLeaveSession={() => setCurrentSessionId(null)}
          />
        )}
      </Authenticated>
    </div>
  );
}

function GameSessionManager({ sessionId, onLeaveSession }: { 
  sessionId: string; 
  onLeaveSession: () => void;
}) {
  const session = useQuery(api.game.getGameSession, { sessionId: sessionId as any });
  const results = useQuery(api.game.getGameResults, { sessionId: sessionId as any });

  if (!session) {
    return (
      <div className="error-container">
        <div className="error-content">
          <p className="error-message glow-red">SESSION NOT FOUND</p>
          <p className="error-submessage">The horror has claimed this session...</p>
          <button 
            onClick={onLeaveSession}
            className="error-button"
          >
            <span>RETURN TO LOBBY</span>
          </button>
        </div>
      </div>
    );
  }

  if (session.status === "completed" && results) {
    return <GameResults results={results} onPlayAgain={onLeaveSession} />;
  }

  if (session.status === "active") {
    return <GameSession session={session} onLeaveSession={onLeaveSession} />;
  }

  return <GameSession session={session} onLeaveSession={onLeaveSession} />;
}