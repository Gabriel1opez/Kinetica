import React, { useState } from 'react';

const AVATARS = ['🏃', '🏋️', '🤸', '🏊', '⚡', '🔬', '🧪', '🚀'];

interface Props {
  socket: any;
  onJoined: () => void;
}

export default function MainMenu({ socket, onJoined }: Props) {
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(0);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) { setError('Enter your name!'); return; }
    setLoading(true);
    setError('');
    const result = await socket.createRoom(name.trim(), avatar);
    setLoading(false);
    if (result.success) onJoined();
    else setError('Failed to create room');
  };

  const handleJoin = async () => {
    if (!name.trim()) { setError('Enter your name!'); return; }
    if (!joinCode.trim()) { setError('Enter room code!'); return; }
    setLoading(true);
    setError('');
    const result = await socket.joinRoom(joinCode.trim().toUpperCase(), name.trim(), avatar);
    setLoading(false);
    if (result.success) onJoined();
    else setError(result.error || 'Failed to join');
  };

  if (mode === 'home') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        {/* Retro sunset header */}
        <div className="w-full max-w-2xl mb-8 relative">
          <div className="h-48 rounded-lg overflow-hidden retro-gradient relative">
            {/* Grid lines */}
            <div className="absolute bottom-0 left-0 right-0 h-24" style={{
              background: 'linear-gradient(0deg, rgba(0,0,0,0.4) 0%, transparent 100%)',
              backgroundImage: `
                linear-gradient(rgba(255,107,53,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,107,53,0.3) 1px, transparent 1px)`,
              backgroundSize: '30px 20px',
              transform: 'perspective(200px) rotateX(40deg)',
              transformOrigin: 'bottom',
            }} />
            {/* Sun */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full"
              style={{
                background: 'radial-gradient(circle, #ffd700 0%, #ff6b35 60%, #e91e8c 100%)',
                boxShadow: '0 0 40px rgba(255,215,0,0.6), 0 0 80px rgba(255,107,53,0.3)',
              }}
            />
          </div>
        </div>

        <h1 className="font-pixel text-4xl md:text-5xl text-retro-yellow glow-text mb-2 text-center">
          KINETICA
        </h1>
        <p className="font-pixel text-xs text-retro-cyan mb-12 text-center">
          Engineered to Win
        </p>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => setMode('create')}
            className="pixel-btn bg-retro-pink text-white"
          >
            Create Game
          </button>
          <button
            onClick={() => setMode('join')}
            className="pixel-btn bg-retro-purple text-white"
          >
            Join Game
          </button>
        </div>

        <div className="mt-12 font-pixel text-[8px] text-white/40 text-center">
          {socket.connected ? '● Connected' : '○ Connecting...'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <button
        onClick={() => { setMode('home'); setError(''); }}
        className="font-pixel text-xs text-retro-cyan mb-8 hover:text-white transition-colors cursor-pointer"
      >
        ← Back
      </button>

      <h2 className="font-pixel text-xl text-retro-yellow mb-8">
        {mode === 'create' ? 'Create Game' : 'Join Game'}
      </h2>

      <div className="pixel-card w-full max-w-md space-y-6">
        {/* Name input */}
        <div>
          <label className="font-pixel text-[10px] text-retro-cyan block mb-2">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={16}
            placeholder="Enter name..."
            className="w-full bg-black/50 border-2 border-white/30 px-4 py-3 font-pixel text-sm
              text-white focus:border-retro-cyan focus:outline-none"
          />
        </div>

        {/* Avatar selection */}
        <div>
          <label className="font-pixel text-[10px] text-retro-cyan block mb-2">Choose Avatar</label>
          <div className="flex gap-2 flex-wrap">
            {AVATARS.map((a, i) => (
              <button
                key={i}
                onClick={() => setAvatar(i)}
                className={`w-12 h-12 text-2xl flex items-center justify-center border-2 transition-all cursor-pointer
                  ${avatar === i ? 'border-retro-yellow bg-retro-yellow/20 scale-110' : 'border-white/20 hover:border-white/50'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Join code (only for join mode) */}
        {mode === 'join' && (
          <div>
            <label className="font-pixel text-[10px] text-retro-cyan block mb-2">Room Code</label>
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="XXXXXX"
              className="w-full bg-black/50 border-2 border-white/30 px-4 py-3 font-pixel text-lg
                text-white text-center tracking-[0.5em] uppercase focus:border-retro-cyan focus:outline-none"
            />
          </div>
        )}

        {error && (
          <p className="font-pixel text-[10px] text-retro-red text-center">{error}</p>
        )}

        <button
          onClick={mode === 'create' ? handleCreate : handleJoin}
          disabled={loading}
          className={`pixel-btn w-full ${loading ? 'opacity-50' : ''} bg-retro-green text-black`}
        >
          {loading ? 'Loading...' : mode === 'create' ? 'Create Room' : 'Join Room'}
        </button>
      </div>
    </div>
  );
}
