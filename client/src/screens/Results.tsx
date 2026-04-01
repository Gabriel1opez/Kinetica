import React from 'react';

const AVATARS = ['🏃', '🏋️', '🤸', '🏊', '⚡', '🔬', '🧪', '🚀'];

const PLANET_INFO: Record<string, { name: string; emoji: string }> = {
  earth: { name: 'Earth', emoji: '🌍' },
  mars: { name: 'Mars', emoji: '🔴' },
  mercury: { name: 'Mercury', emoji: '⚫' },
};

interface Props {
  socket: any;
}

export default function Results({ socket }: Props) {
  const room = socket.roomState;
  if (!room) return null;

  const me = room.players.find((p: any) => p.id === socket.playerId);
  const isHost = me?.isHost;
  const planet = PLANET_INFO[room.currentPlanet] || { name: 'Unknown', emoji: '?' };

  // Sort players by latest race time
  const sorted = [...room.players].sort((a: any, b: any) => {
    const aTime = a.raceResults?.[a.raceResults.length - 1]?.totalTime ?? Infinity;
    const bTime = b.raceResults?.[b.raceResults.length - 1]?.totalTime ?? Infinity;
    return aTime - bTime;
  });

  // Get my latest race result for feedback
  const myLatestResult = me?.raceResults?.[me.raceResults.length - 1];

  return (
    <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      <h2 className="font-pixel text-xl text-retro-yellow text-center mb-2">
        {planet.emoji} {planet.name} — Results
      </h2>

      {/* Leaderboard */}
      <div className="pixel-card mb-6">
        <h3 className="font-pixel text-xs text-retro-cyan mb-4 text-center">Race Rankings</h3>
        <div className="space-y-3">
          {sorted.map((player: any, i: number) => {
            const latestRace = player.raceResults?.[player.raceResults.length - 1];
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 border-2 ${
                  player.id === socket.playerId ? 'border-retro-yellow' : 'border-white/10'
                } ${i === 0 ? 'bg-retro-yellow/10' : ''}`}
              >
                <span className="font-pixel text-xl w-8 text-center">
                  {medals[i] || `${i + 1}.`}
                </span>
                <span className="text-xl">{AVATARS[player.avatar]}</span>
                <div className="flex-1">
                  <p className="font-pixel text-[10px] text-white">{player.name}</p>
                  <p className="font-pixel text-[7px] text-white/50">
                    Total: {player.totalTime.toFixed(2)}s
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-pixel text-sm text-retro-yellow">
                    {latestRace?.totalTime?.toFixed(2) || '--'}s
                  </p>
                  <p className="font-pixel text-[6px] text-white/40">this race</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Educational Feedback */}
      {myLatestResult?.feedback && (
        <div className="pixel-card mb-8">
          <h3 className="font-pixel text-xs text-retro-pink mb-4">
            📊 Science Review — Why You Got That Time
          </h3>
          <div className="space-y-3">
            {myLatestResult.feedback.map((fb: string, i: number) => (
              <div key={i} className="p-3 border border-white/10 bg-black/20">
                <p className="font-pixel text-[7px] text-white/80 leading-relaxed">{fb}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Planet or Advance */}
      <div className="text-center">
        {isHost ? (
          <button
            onClick={() => socket.setReady(true)}
            className="pixel-btn bg-retro-green text-black"
          >
            {room.currentPlanet === 'mercury' ? 'View Final Results' : 'Next Planet →'}
          </button>
        ) : (
          <button
            onClick={() => socket.setReady(true)}
            className="pixel-btn bg-retro-purple text-white"
          >
            Ready
          </button>
        )}
      </div>
    </div>
  );
}
