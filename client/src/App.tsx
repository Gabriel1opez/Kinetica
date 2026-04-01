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

// Phase display names for transition overlay
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
  const [transitioning, setTransitioning] = useState(false);
  const [transitionLabel, setTransitionLabel] = useState('');
  const [transitionProgress, setTransitionProgress] = useState(0);
  const prevPhaseRef = useRef<string>('');

  const phase = socket.roomState?.phase || 'lobby';

  // SMW-style iris wipe transition when phase changes
  useEffect(() => {
    if (phase !== prevPhaseRef.current && prevPhaseRef.current !== '' && screen === 'game') {
      const label = PHASE_NAMES[phase] || '';
      if (label) {
        setTransitionLabel(label);
        setTransitioning(true);
        setTransitionProgress(0);

        // Animate: close iris (0→1), hold, open iris (1→0)
        let frame = 0;
        const totalFrames = 45; // ~0.75s
        const holdFrames = 20;

        const animate = () => {
          frame++;
          if (frame <= totalFrames) {
            setTransitionProgress(frame / totalFrames);
            requestAnimationFrame(animate);
          } else if (frame <= totalFrames + holdFrames) {
            setTransitionProgress(1);
            requestAnimationFrame(animate);
          } else if (frame <= totalFrames * 2 + holdFrames) {
            setTransitionProgress(1 - (frame - totalFrames - holdFrames) / totalFrames);
            requestAnimationFrame(animate);
          } else {
            setTransitioning(false);
            setTransitionProgress(0);
          }
        };
        requestAnimationFrame(animate);
      }
    }
    prevPhaseRef.current = phase;
  }, [phase, screen]);

  const handleJoinedGame = () => setScreen('game');
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

      {/* SMW-style iris wipe transition */}
      {transitioning && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          style={{
            background: transitionProgress > 0.3
              ? `radial-gradient(circle at 50% 50%, transparent ${(1 - transitionProgress) * 120}%, #050514 ${(1 - transitionProgress) * 120 + 2}%)`
              : 'transparent',
          }}>
          {transitionProgress > 0.7 && (
            <p className="font-pixel text-lg text-retro-yellow glow-text-gold animate-pixel-pulse">
              {transitionLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
