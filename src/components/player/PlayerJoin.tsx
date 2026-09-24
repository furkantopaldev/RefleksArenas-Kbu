import React, { useState } from 'react';
import { Sparkles, Dice5, UserCheck, ShieldAlert } from 'lucide-react';

const AVATAR_OPTIONS = ['🦊', '⚡', '🐯', '🚀', '🔥', '🐼', '🦁', '🎯', '👑', '🐺', '🐉', '🌪️'];

const FUN_NICKNAMES = [
  'Hızlı Şimşek',
  'Roket Ali',
  'Refleks Can',
  'Alev Ayşe',
  'Süper Efe',
  'Turbo Zeynep',
  'Yıldırım Kaan',
  'Usta Oyuncu',
  'Kartal Göz',
  'Atom Burak',
];

interface PlayerJoinProps {
  onJoin: (name: string, avatar: string) => void;
  isJoined: boolean;
  playerName: string;
  playerAvatar: string;
  errorMessage: string | null;
}

export const PlayerJoin: React.FC<PlayerJoinProps> = ({
  onJoin,
  isJoined,
  playerName: currentName,
  playerAvatar: currentAvatar,
  errorMessage,
}) => {
  const [name, setName] = useState(
    FUN_NICKNAMES[Math.floor(Math.random() * FUN_NICKNAMES.length)]
  );
  const [avatar, setAvatar] = useState(
    AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)]
  );

  const randomizeNick = () => {
    const randomNick = FUN_NICKNAMES[Math.floor(Math.random() * FUN_NICKNAMES.length)];
    const randomAv = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
    setName(randomNick);
    setAvatar(randomAv);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim(), avatar);
    }
  };

  if (isJoined) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-pop max-w-md mx-auto">
        <div className="w-24 h-24 rounded-3xl bg-party-purple/30 border-4 border-party-yellow flex items-center justify-center text-6xl shadow-2xl animate-bounce-short mb-6">
          {currentAvatar || avatar}
        </div>

        <h2 className="text-3xl font-black text-white">Hazırsın, {currentName || name}!</h2>
        <div className="mt-4 px-6 py-3 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-sm flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Odaya Katıldın
        </div>

        <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md w-full">
          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-ping mx-auto mb-3" />
          <p className="text-base font-bold text-white">Oyunun Başlaması Bekleniyor...</p>
          <p className="text-xs text-white/60 mt-1">
            Stand ekranını takip edin. 4 kişi dolduğunda veya görevli başlattığında geri sayım
            ekranınıza gelecek!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center p-6 max-w-md mx-auto w-full">
      <div className="text-center mb-6">
        <span className="text-5xl inline-block animate-bounce-short mb-2">⚡</span>
        <h1 className="text-3xl font-black text-party-yellow uppercase tracking-wider">
          Refleks Arenası
        </h1>
        <p className="text-sm font-bold text-sky-300">Hızlı 60s Çok Oyunculu Kapışma</p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-4 rounded-2xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm font-bold flex items-center gap-2 animate-shake">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white/5 border-2 border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-2xl space-y-6"
      >
        {/* Avatar Selection Grid */}
        <div>
          <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
            Avatarını Seç
          </label>
          <div className="grid grid-cols-6 gap-2">
            {AVATAR_OPTIONS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => setAvatar(av)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl transition-all cursor-pointer ${
                  avatar === av
                    ? 'bg-party-yellow border-2 border-white scale-110 shadow-lg'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Nickname Input & Randomizer */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-white/70 uppercase tracking-wider">
              Takma Adın
            </label>
            <button
              type="button"
              onClick={randomizeNick}
              className="text-xs text-party-yellow font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Dice5 className="w-3.5 h-3.5" />
              Rastgele Seç
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              maxLength={15}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Takma adın..."
              className="w-full px-4 py-3.5 rounded-2xl bg-black/40 border-2 border-white/20 text-white font-bold text-lg placeholder:text-white/30 focus:outline-none focus:border-party-yellow"
            />
          </div>
        </div>

        {/* Submit Join Button */}
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-party-yellow to-amber-500 text-purple-950 font-black text-xl uppercase tracking-wider shadow-xl hover:brightness-110 active:scale-95 glow-yellow transition-all cursor-pointer disabled:opacity-50"
        >
          Arenaya Katıl!
        </button>
      </form>
    </div>
  );
};
