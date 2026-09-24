import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { LeaderboardEntry, PlayerResultSummary } from '../../types';
import { Trophy, RotateCcw, Target, Clock, Flame, Zap, Award } from 'lucide-react';

interface HostPodiumProps {
  results: PlayerResultSummary[];
  leaderboard: LeaderboardEntry[];
  onResetRoom: () => void;
}

export const HostPodium: React.FC<HostPodiumProps> = ({ results, leaderboard, onResetRoom }) => {
  // Fire celebratory confetti on mount
  useEffect(() => {
    const end = Date.now() + 3.5 * 1000;
    const colors = ['#FFDE59', '#3B82F6', '#8B5CF6', '#10B981', '#FF4081'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const first = results[0];
  const second = results[1];
  const third = results[2];
  const fourth = results[3];

  return (
    <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full justify-between animate-pop">
      {/* Header */}
      <div className="text-center my-2">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-yellow-400 text-purple-950 font-black text-sm uppercase tracking-wider mb-2 shadow-lg animate-bounce-short">
          <Trophy className="w-5 h-5 fill-purple-950" />
          ARENA ŞAMPİYONU
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-white tracking-wide drop-shadow-lg">
          {first ? `${first.name} Kazandı!` : 'Maç Tamamlandı!'}
        </h2>
      </div>

      {/* Podium Display */}
      <div className="grid grid-cols-3 gap-3 md:gap-6 items-end max-w-3xl mx-auto w-full my-6">
        {/* 2nd Place */}
        <div className="flex flex-col items-center">
          {second ? (
            <div className="flex flex-col items-center mb-2 text-center animate-pop">
              <span className="text-4xl md:text-5xl">{second.avatar}</span>
              <span className="font-bold text-white text-sm md:text-base mt-1 truncate max-w-[100px] md:max-w-[140px]">
                {second.name}
              </span>
              <span className="text-xs font-black text-party-yellow">{second.score} P</span>
            </div>
          ) : (
            <div className="h-16" />
          )}
          <div className="w-full bg-slate-700/80 border-t-4 border-slate-300 rounded-t-3xl h-36 md:h-44 flex flex-col items-center justify-center p-2 shadow-xl">
            <span className="font-black text-3xl md:text-4xl text-slate-200">2</span>
            <span className="text-xs font-bold text-slate-300 uppercase mt-1">Gümüş</span>
          </div>
        </div>

        {/* 1st Place (Champion) */}
        <div className="flex flex-col items-center">
          {first && (
            <div className="flex flex-col items-center mb-2 text-center animate-pop">
              <div className="relative">
                <span className="text-6xl md:text-7xl">{first.avatar}</span>
                <span className="absolute -top-4 -right-2 text-2xl animate-bounce-short">👑</span>
              </div>
              <span className="font-black text-white text-base md:text-xl mt-1 truncate max-w-[120px] md:max-w-[180px]">
                {first.name}
              </span>
              <span className="text-sm md:text-lg font-black text-party-yellow flex items-center gap-1">
                <Zap className="w-4 h-4 fill-party-yellow" />
                {first.score.toLocaleString('tr-TR')} Puan
              </span>
            </div>
          )}
          <div className="w-full bg-gradient-to-b from-yellow-500 to-amber-600 border-t-4 border-yellow-200 rounded-t-3xl h-48 md:h-60 flex flex-col items-center justify-center p-2 shadow-2xl glow-yellow">
            <span className="font-black text-4xl md:text-6xl text-purple-950">1</span>
            <span className="text-xs md:text-sm font-black text-purple-950 uppercase mt-1">
              🏆 Şampiyon
            </span>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="flex flex-col items-center">
          {third ? (
            <div className="flex flex-col items-center mb-2 text-center animate-pop">
              <span className="text-4xl md:text-5xl">{third.avatar}</span>
              <span className="font-bold text-white text-sm md:text-base mt-1 truncate max-w-[100px] md:max-w-[140px]">
                {third.name}
              </span>
              <span className="text-xs font-black text-party-yellow">{third.score} P</span>
            </div>
          ) : (
            <div className="h-16" />
          )}
          <div className="w-full bg-amber-900/80 border-t-4 border-amber-600 rounded-t-3xl h-28 md:h-32 flex flex-col items-center justify-center p-2 shadow-xl">
            <span className="font-black text-2xl md:text-3xl text-amber-200">3</span>
            <span className="text-xs font-bold text-amber-300 uppercase mt-1">Bronz</span>
          </div>
        </div>
      </div>

      {/* Match Statistics & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto w-full mb-6">
        {results.map((p) => (
          <div
            key={p.id}
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              p.rank === 1
                ? 'bg-yellow-400/15 border-yellow-400/50 glow-yellow'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{p.avatar}</span>
              <div>
                <span className="font-bold text-white text-sm block leading-tight">
                  {p.rank}. {p.name}
                </span>
                <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                  <span className="flex items-center gap-0.5">
                    <Target className="w-3 h-3 text-emerald-400" />
                    %{p.accuracy}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3 text-sky-400" />
                    {p.avgReactionMs}ms
                  </span>
                  {p.maxCombo > 0 && (
                    <span className="flex items-center gap-0.5 text-red-400">
                      <Flame className="w-3 h-3 fill-red-400" />
                      {p.maxCombo}x
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span className="font-black text-lg text-party-yellow">{p.score} P</span>
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-center">
        <button
          onClick={onResetRoom}
          className="flex items-center gap-3 px-10 py-4 rounded-3xl bg-gradient-to-r from-party-yellow to-amber-500 text-purple-950 font-black text-xl uppercase tracking-wider shadow-2xl hover:brightness-110 active:scale-95 glow-yellow cursor-pointer"
        >
          <RotateCcw className="w-6 h-6" />
          Yeni Tur Başlat (Lobiye Dön)
        </button>
      </div>
    </div>
  );
};
