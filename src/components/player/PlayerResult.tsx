import React from 'react';
import { PlayerResultSummary } from '../../types';
import { Trophy, Target, Clock, Flame, Zap, Award } from 'lucide-react';

interface PlayerResultProps {
  myResult: PlayerResultSummary | null;
  playerId: string;
}

export const PlayerResult: React.FC<PlayerResultProps> = ({ myResult }) => {
  if (!myResult) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white">
        <h2 className="text-2xl font-black">Sonuçlar Hesaplanıyor...</h2>
      </div>
    );
  }

  const isWinner = myResult.rank === 1;

  return (
    <div className="flex-1 flex flex-col justify-center p-6 max-w-md mx-auto w-full animate-pop">
      <div className="text-center mb-6">
        <div className="relative inline-block mb-2">
          <span className="text-7xl">{myResult.avatar}</span>
          {isWinner && <span className="absolute -top-3 -right-2 text-3xl animate-bounce-short">👑</span>}
        </div>

        <h1 className="text-3xl font-black text-white">{myResult.name}</h1>

        <div className="mt-2 inline-flex items-center gap-2 px-5 py-2 rounded-full font-black text-sm uppercase tracking-wider shadow-lg bg-yellow-400 text-purple-950">
          <Trophy className="w-4 h-4 fill-current" />
          {isWinner ? '🏆 1. SIRA - ŞAMPİYON!' : `${myResult.rank}. Sıra`}
        </div>
      </div>

      {/* Main Score Box */}
      <div className="bg-white/5 border-2 border-party-yellow/40 rounded-3xl p-6 backdrop-blur-md shadow-2xl text-center mb-6">
        <span className="text-xs font-bold text-white/70 uppercase tracking-widest">
          Toplam Puanın
        </span>
        <div className="text-5xl font-black text-party-yellow tracking-tight flex items-center justify-center gap-2 my-2">
          <Zap className="w-8 h-8 fill-party-yellow" />
          {myResult.score.toLocaleString('tr-TR')}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 text-center">
          <div className="p-2 rounded-2xl bg-white/5">
            <Target className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <span className="text-xs text-white/60 block font-semibold">İsabet</span>
            <span className="text-base font-black text-white">%{myResult.accuracy}</span>
          </div>

          <div className="p-2 rounded-2xl bg-white/5">
            <Clock className="w-5 h-5 text-sky-400 mx-auto mb-1" />
            <span className="text-xs text-white/60 block font-semibold">Hız</span>
            <span className="text-base font-black text-white">{myResult.avgReactionMs}ms</span>
          </div>

          <div className="p-2 rounded-2xl bg-white/5">
            <Flame className="w-5 h-5 text-red-400 mx-auto mb-1 fill-red-400" />
            <span className="text-xs text-white/60 block font-semibold">En İyi Kombo</span>
            <span className="text-base font-black text-white">{myResult.maxCombo}x</span>
          </div>
        </div>
      </div>

      {/* Next Round Info */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-white/70 font-semibold">
        Stand ekranındaki podyumu inceleyin. Görevli yeni turu başlattığında ekranınız otomatik
        yenilenecektir!
      </div>
    </div>
  );
};
