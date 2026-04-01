import React, { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import MainMenu from './screens/MainMenu';
import Lobby from './screens/Lobby';
import Configuration from './screens/Configuration';
import PotionCrafting from './screens/PotionCrafting';
import CatapultLaunch from './screens/CatapultLaunch';
import Racing from './screens/Racing';
import Results from './screens/Results';
import FinalResults from './screens/FinalResults';
import StarField from './components/StarField';

export default function App() {
  const socket = useSocket();
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');

  const phase = socket.roomState?.phase || 'lobby';

  const handleJoinedGame = () => setScreen('game');
  const handleBackToMenu = () => {
    setScreen('menu');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <StarField />
      <div className="scanline-overlay" />
      <div className="crt-vignette" />

      <div className="relative z-10">
        {screen === 'menu' ? (
          <MainMenu socket={socket} onJoined={handleJoinedGame} />
        ) : (
          <>
            {phase === 'lobby' && <Lobby socket={socket} />}
            {phase === 'configuration' && <Configuration socket={socket} />}
            {phase === 'potion-crafting' && <PotionCrafting socket={socket} />}
            {phase === 'catapult' && <CatapultLaunch socket={socket} />}
            {phase === 'racing' && <Racing socket={socket} />}
            {phase === 'results' && <Results socket={socket} />}
            {phase === 'final-results' && <FinalResults socket={socket} onBackToMenu={handleBackToMenu} />}
          </>
        )}
      </div>
    </div>
  );
}
