import React, { useState } from 'react';
import { Volume2, VolumeX, Maximize, RotateCcw, Trophy } from 'lucide-react';
import { soundEffects } from '../../audio/soundEffects';

interface HostControlsProps {
  onReset: () => void;
  onOpenLeaderboard: () => void;
}

export const HostControls: React.FC<HostControlsProps> = ({ onReset, onOpenLeaderboard }) => {
  const [soundOn, setSoundOn] = useState(soundEffects.enabled);

  const toggleSound = () => {
    soundEffects.enabled = !soundOn;
    setSoundOn(!soundOn);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-white/5 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center gap-3">
        <span className="text-3xl animate-bounce-short">⚡</span>
        <div>
          <h1 className="text-2xl font-black tracking-wider text-party-yellow uppercase drop-shadow-md">
            Refleks Arenası
          </h1>
          <span className="text-xs font-bold text-sky-400 tracking-widest uppercase">
            Stand & Büyük Ekran Modu
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Leaderboard Button */}
        <button
          onClick={onOpenLeaderboard}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-300 font-bold text-sm border border-yellow-400/40 transition-all cursor-pointer active:scale-95"
        >
          <Trophy className="w-4 h-4" />
          <span className="hidden sm:inline">Günün Skorları</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
          title={soundOn ? 'Sesi Kapat' : 'Sesi Aç'}
        >
          {soundOn ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-red-400" />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
          title="Tam Ekran"
        >
          <Maximize className="w-5 h-5" />
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-sm border border-red-500/30 transition-all cursor-pointer active:scale-95"
          title="Turu Sıfırla"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Sıfırla</span>
        </button>
      </div>
    </header>
  );
};
