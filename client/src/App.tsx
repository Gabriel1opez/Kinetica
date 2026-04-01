import React, { useState, useEffect, useRef } from 'react';
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

const PHASE_NAMES: Record<string, string> = {
  configuration: 'RUNNER CONFIG',
  'potion-crafting': 'POTION LAB',
  catapult: 'CATAPULT LAUNCH',
  racing: 'RACE START',
  results: 'RESULTS',
  'final-results': 'FINAL RESULTS',
};

export default function App() {
  const socket = useSocket();
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');

  // Transition system: delay content swap until iris closes
  const [displayPhase, setDisplayPhase] = useState('lobby');
  const [transitioning, setTransitioning] = useState(false);
  const [transitionLabel, setTransitionLabel] = useState('');
  const [transitionProgress, setTransitionProgress] = useState(0);
  const prevPhaseRef = useRef<string>('');

  const phase = socket.roomState?.phase || 'lobby';

  useEffect(() => {
    if (phase !== prevPhaseRef.current && screen === 'game') {
      const label = PHASE_NAMES[phase] || '';

      if (label && prevPhaseRef.current !== '') {
        // Start transition — keep showing OLD content
        setTransitionLabel(label);
        setTransitioning(true);
        setTransitionProgress(0);

        let frame = 0;
        const closeFrames = 30;  // iris close
        const holdFrames = 25;   // hold closed (swap content here)
        const openFrames = 30;   // iris open
        let swapped = false;

        const animate = () => {
          frame++;
          if (frame <= closeFrames) {
            // Closing
            setTransitionProgress(frame / closeFrames);
            requestAnimationFrame(animate);
          } else if (frame <= closeFrames + holdFrames) {
            // Holding closed — swap content midway
            if (!swapped) {
              setDisplayPhase(phase);
              swapped = true;
            }
            setTransitionProgress(1);
            requestAnimationFrame(animate);
          } else if (frame <= closeFrames + holdFrames + openFrames) {
            // Opening
            setTransitionProgress(1 - (frame - closeFrames - holdFrames) / openFrames);
            requestAnimationFrame(animate);
          } else {
            setTransitioning(false);
            setTransitionProgress(0);
          }
        };
        requestAnimationFrame(animate);
      } else {
        // No transition for first phase or lobby
        setDisplayPhase(phase);
      }
    }
    prevPhaseRef.current = phase;
  }, [phase, screen]);

  const handleJoinedGame = () => {
    setScreen('game');
    setDisplayPhase(socket.roomState?.phase || 'lobby');
  };
  const handleBackToMenu = () => setScreen('menu');

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
            {displayPhase === 'lobby' && <Lobby socket={socket} />}
            {displayPhase === 'configuration' && <Configuration socket={socket} />}
            {displayPhase === 'potion-crafting' && <PotionCrafting socket={socket} />}
            {displayPhase === 'catapult' && <CatapultLaunch socket={socket} />}
            {displayPhase === 'racing' && <Racing socket={socket} />}
            {displayPhase === 'results' && <Results socket={socket} />}
            {displayPhase === 'final-results' && <FinalResults socket={socket} onBackToMenu={handleBackToMenu} />}
          </>
        )}
      </div>

      {/* Iris wipe transition overlay */}
      {transitioning && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          style={{
            background: transitionProgress > 0.1
              ? `radial-gradient(circle at 50% 50%, transparent ${Math.max(0, (1 - transitionProgress) * 110)}%, #050514 ${Math.max(0, (1 - transitionProgress) * 110) + 3}%)`
              : 'transparent',
          }}>
          {transitionProgress > 0.85 && (
            <div className="text-center">
              <p className="font-pixel text-lg text-retro-yellow glow-text-gold animate-pixel-pulse">
                {transitionLabel}
              </p>
              {socket.roomState?.currentPlanet && (
                <p className="font-retro text-xl text-retro-cyan mt-2">
                  {socket.roomState.currentPlanet.toUpperCase()}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
