import React from 'react';
import { ClientRoomData, GameTask } from '../../types';
import { Clock, Flame, Zap, Sparkles, Target } from 'lucide-react';

interface HostGameProps {
  roomData: ClientRoomData;
  currentTask: GameTask | null;
}

export const HostGame: React.FC<HostGameProps> = ({ roomData, currentTask }) => {
  const { players, timeRemaining, currentPhase } = roomData;

  // Sort players descending by score for live race board
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(1, ...players.map((p) => p.score));

  const getPhaseInfo = () => {
    switch (currentPhase) {
      case 1:
        return {
          title: 'FAZ 1: ISINMA TURU',
          color: 'from-emerald-500 to-teal-600',
          desc: 'Temel renk ve şekil avı!',
        };
      case 2:
        return {
          title: 'FAZ 2: STROOP & ZİHİN ÇELİŞKİSİ',
          color: 'from-amber-500 to-orange-600',
          desc: 'Kelime anlamı ve yazı rengine dikkat et!',
        };
      case 3:
        return {
          title: 'FAZ 3: ÇILGIN KOMBO & HIZ',
          color: 'from-red-500 to-pink-600',
          desc: '2X Altın hedefler ve süper kombo puanları!',
        };
      default:
        return { title: 'ARENA', color: 'from-blue-500 to-purple-600', desc: '' };
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full justify-between">
      {/* Top Info: Timer and Phase Banner */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
        {/* Phase Indicator */}
        <div className="flex items-center gap-4">
          <div
            className={`px-5 py-2.5 rounded-2xl bg-gradient-to-r ${phaseInfo.color} font-black text-white text-base tracking-wider uppercase shadow-lg`}
          >
            {phaseInfo.title}
          </div>
          <span className="text-sm font-semibold text-white/70 hidden sm:inline">
            {phaseInfo.desc}
          </span>
        </div>

        {/* Large Timer */}
        <div className="flex items-center gap-3 bg-black/40 px-6 py-2.5 rounded-2xl border-2 border-party-yellow/50 glow-yellow">
          <Clock className="w-7 h-7 text-party-yellow animate-pulse-fast" />
          <span className="font-black text-4xl text-party-yellow tracking-tighter">
            {timeRemaining}s
          </span>
        </div>
      </div>

      {/* Center: Spectator Task Prompt View */}
      {currentTask && (
        <div className="my-6 text-center bg-gradient-to-b from-purple-900/60 to-indigo-950/80 border-2 border-party-yellow/40 rounded-3xl p-6 shadow-2xl backdrop-blur-md animate-pop">
          <span className="text-xs font-black uppercase tracking-widest text-party-yellow px-3 py-1 bg-yellow-400/20 rounded-full inline-block mb-2">
            {currentTask.badgeText || 'AKTİF GÖREV'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-wide drop-shadow-md">
            {currentTask.prompt}
          </h2>
          {currentTask.subPrompt && (
            <p className="text-base sm:text-xl font-bold text-sky-300 mt-2">
              {currentTask.subPrompt}
            </p>
          )}
        </div>
      )}

      {/* Bottom: Live Scoreboard Progress Race */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <h3 className="font-black text-lg text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-party-yellow fill-party-yellow" />
            Canlı Sıralama & Puan Durumu
          </h3>
          <span className="text-xs text-white/50 font-bold uppercase tracking-wider">
            {players.length} Oyuncu Yarışıyor
          </span>
        </div>

        <div className="space-y-3">
          {sortedPlayers.map((player, index) => {
            const scorePercentage = Math.max(8, Math.round((player.score / maxScore) * 100));
            const isLeading = index === 0 && player.score > 0;

            return (
              <div
                key={player.id}
                className={`relative p-3.5 rounded-2xl border transition-all duration-300 ${
                  isLeading
                    ? 'bg-yellow-400/15 border-yellow-400/50 glow-yellow'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                        isLeading
                          ? 'bg-party-yellow text-purple-950 shadow-md'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-2xl">{player.avatar}</span>
                    <span className="font-black text-base text-white">{player.name}</span>

                    {/* Combo streak flame */}
                    {player.combo >= 3 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/30 text-red-300 border border-red-400/40 text-xs font-black animate-bounce-short">
                        <Flame className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                        {player.combo}x KOMBO!
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-2xl text-party-yellow tracking-tight">
                      {player.score.toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden p-0.5">
                  <div
                    style={{ width: `${scorePercentage}%` }}
                    className={`h-full rounded-full transition-all duration-300 ${
                      isLeading
                        ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500'
                        : 'bg-gradient-to-r from-blue-400 to-purple-500'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
