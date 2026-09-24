import React from 'react';
import { LeaderboardEntry } from '../../types';
import { Trophy, X, Zap, Target, Clock } from 'lucide-react';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ entries, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-pop">
      <div className="bg-[#1E1B4B] border-4 border-party-yellow/50 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400/20 flex items-center justify-center text-yellow-400">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-wide">Günün En İyileri</h3>
              <p className="text-xs text-yellow-300/80 font-bold">Stand Günlük Liderlik Tablosu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto mt-4 space-y-2.5 pr-1 flex-1">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <Trophy className="w-16 h-16 mx-auto mb-2 opacity-30 text-yellow-300" />
              <p className="font-bold">Henüz kaydedilmiş skor yok.</p>
              <p className="text-xs mt-1">İlk şampiyon sen ol!</p>
            </div>
          ) : (
            entries.map((entry, index) => {
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;

              let rankBadge = `${index + 1}.`;
              let badgeColor = 'bg-white/10 text-white';
              if (isFirst) {
                rankBadge = '🥇 1.';
                badgeColor = 'bg-yellow-400 text-purple-950 font-black';
              } else if (isSecond) {
                rankBadge = '🥈 2.';
                badgeColor = 'bg-slate-300 text-purple-950 font-black';
              } else if (isThird) {
                rankBadge = '🥉 3.';
                badgeColor = 'bg-amber-600 text-white font-black';
              }

              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isFirst
                      ? 'bg-yellow-400/10 border-yellow-400/40 glow-yellow'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-xl text-xs ${badgeColor}`}>
                      {rankBadge}
                    </span>
                    <span className="text-2xl">{entry.avatar}</span>
                    <div>
                      <span className="font-bold text-white text-base block leading-tight">
                        {entry.playerName}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-white/60 font-semibold mt-0.5">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-emerald-400" />
                          %{entry.accuracy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-400" />
                          {entry.avgReactionMs}ms
                        </span>
                        <span>{entry.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-xl text-party-yellow flex items-center gap-1">
                      <Zap className="w-4 h-4 fill-party-yellow" />
                      {entry.score.toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
