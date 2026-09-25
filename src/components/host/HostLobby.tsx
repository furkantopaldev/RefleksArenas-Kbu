import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ClientRoomData } from '../../types';
import {
  Play,
  Bot,
  Users,
  QrCode,
  Sparkles,
  X,
  Wifi,
  Globe,
  Settings,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface HostLobbyProps {
  roomData: ClientRoomData;
  onStartGame: () => void;
  onAddBot: () => void;
  onRemovePlayer: (id: string) => void;
  onSetJoinUrl: (url: string) => void;
}

export const HostLobby: React.FC<HostLobbyProps> = ({
  roomData,
  onStartGame,
  onAddBot,
  onRemovePlayer,
  onSetJoinUrl,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showNetworkSettings, setShowNetworkSettings] = useState(false);
  const [customInputUrl, setCustomInputUrl] = useState(roomData.customUrl || '');
  const [copied, setCopied] = useState(false);

  // Determine live join URL (prioritizes active cloud origin if hosted online)
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.startsWith('172.');

  const liveOriginUrl = !isLocal ? `${window.location.origin}/play` : null;

  const activeJoinUrl =
    liveOriginUrl ||
    (roomData.customUrl
      ? (roomData.customUrl.endsWith('/play') ? roomData.customUrl : `${roomData.customUrl}/play`)
      : null) ||
    (roomData.tunnelUrl ? `${roomData.tunnelUrl.replace(/\/+$/, '')}/play` : null) ||
    (roomData.joinUrl && !roomData.joinUrl.includes('10.30.') && !roomData.joinUrl.includes(':10000')
      ? roomData.joinUrl
      : null) ||
    `${window.location.protocol}//${roomData.hostIp}:${roomData.port}/play`;
  const isHttps = activeJoinUrl.startsWith('https://');

  // Generate QR Code dynamically whenever activeJoinUrl changes
  useEffect(() => {
    if (!activeJoinUrl) return;

    QRCode.toDataURL(activeJoinUrl, {
      width: 450,
      margin: 2,
      color: {
        dark: '#1E1B4B',
        light: '#FFDE59',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [activeJoinUrl]);

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(activeJoinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInputUrl.trim()) {
      onSetJoinUrl(customInputUrl.trim());
      setShowNetworkSettings(false);
    }
  };

  const handleSelectNetworkIp = (ip: string) => {
    const newUrl = `http://${ip}:${roomData.port}/play`;
    onSetJoinUrl(newUrl);
  };

  const handleSelectTunnel = () => {
    if (roomData.tunnelUrl) {
      onSetJoinUrl(`${roomData.tunnelUrl}/play`);
    }
  };

  const slots = [0, 1, 2, 3];
  const playerCount = roomData.players.length;
  const canStart = playerCount >= 1;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-center">
        {/* Left: Big QR Code Panel */}
        <div className="lg:col-span-5 flex flex-col items-center text-center bg-white/5 border-2 border-party-yellow/40 rounded-3xl p-6 backdrop-blur-md shadow-2xl relative overflow-hidden">
          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-xs uppercase tracking-wider shadow-md ${
                !isLocal || isHttps
                  ? 'bg-emerald-400 text-purple-950 glow-yellow'
                  : 'bg-party-yellow text-purple-950'
              }`}
            >
              {!isLocal || isHttps ? <Globe className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              {!isLocal || isHttps ? '🌐 Genel İnternet (Canlı Domain)' : '📶 Yerel Ağ (Wi-Fi)'}
            </span>

            <button
              onClick={() => setShowNetworkSettings(!showNetworkSettings)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer"
              title="Ağ / Tünel Ayarlarını Değiştir"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* QR Container */}
          <div className="p-3 bg-party-yellow rounded-3xl shadow-2xl border-4 border-white transform transition-transform hover:scale-105">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Oyun Katılım QR Kodu"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-2xl"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-purple-950 font-bold">
                QR Üretiliyor...
              </div>
            )}
          </div>

          {/* Direct URL & Copy Button */}
          <div className="mt-3 w-full flex items-center justify-between gap-2 px-3.5 py-2 bg-black/50 rounded-2xl border border-white/15 text-white font-mono text-xs max-w-sm">
            <span className="text-yellow-300 font-bold truncate">{activeJoinUrl}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={copyUrlToClipboard}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Linki Kopyala"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <a
                href={activeJoinUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                title="Yeni Sekmede Aç"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <p className="text-xs text-white/70 mt-2 max-w-xs font-semibold">
            Telefonunuzun kamerasından QR kodu okutarak odaya katılın!
          </p>

          {/* Expandable Network Settings Panel */}
          {showNetworkSettings && (
            <div className="mt-4 p-4 rounded-2xl bg-black/70 border border-party-yellow/40 w-full text-left space-y-3 animate-pop">
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <span className="text-xs font-black text-yellow-300 uppercase">
                  Bağlantı Kaynağı Seç
                </span>
                <button
                  onClick={() => setShowNetworkSettings(false)}
                  className="text-white/60 hover:text-white text-xs"
                >
                  Kapat
                </button>
              </div>

              {/* Live Cloud Domain Option if on live domain */}
              {!isLocal && (
                <button
                  onClick={() => onSetJoinUrl(`${window.location.origin}/play`)}
                  className="w-full text-left px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center justify-between cursor-pointer"
                >
                  <span>🌐 Render Bulut Sunucusu (Genel İnternet)</span>
                  <span className="text-[10px] text-emerald-200">Aktif</span>
                </button>
              )}

              {/* Tunnel Option if available */}
              {roomData.tunnelUrl && (
                <button
                  onClick={handleSelectTunnel}
                  className="w-full text-left px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-300 text-xs font-bold flex items-center justify-between cursor-pointer"
                >
                  <span>🌐 Alternatif Bulut Tüneli</span>
                </button>
              )}

              {/* Detected Wi-Fi / Local IPs */}
              {roomData.networkIps && roomData.networkIps.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] text-white/50 font-bold block">
                    Yerel Ağ Adaptörleri:
                  </span>
                  {roomData.networkIps.map((net) => (
                    <button
                      key={net.ip}
                      onClick={() => handleSelectNetworkIp(net.ip)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 text-xs font-mono flex items-center justify-between cursor-pointer"
                    >
                      <span>
                        {net.isWifi ? '📶 ' : '🔌 '}
                        {net.ip}
                      </span>
                      <span className="text-[10px] text-white/40">{net.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Custom URL Input */}
              <form onSubmit={handleApplyCustomUrl} className="pt-2 border-t border-white/10">
                <label className="text-[10px] text-white/60 font-bold block mb-1">
                  Özel Domain / Link Yapıştır (Vercel/Render vb.):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customInputUrl}
                    onChange={(e) => setCustomInputUrl(e.target.value)}
                    placeholder="https://refleks-arena.vercel.app"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-black/50 border border-white/20 text-xs text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-party-yellow"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-party-yellow text-purple-950 font-bold text-xs cursor-pointer hover:brightness-110"
                  >
                    Uygula
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right: Player Slots & Match Launch */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-party-yellow" />
                <h2 className="text-2xl font-black text-white">
                  Oyuncu Slotları ({playerCount}/4)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {playerCount > 0 && (
                  <button
                    onClick={() => roomData.players.forEach((p) => onRemovePlayer(p.id))}
                    className="text-xs px-2.5 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg font-bold transition-all cursor-pointer"
                    title="Tüm Oyuncuları Odadan Çıkar"
                  >
                    Tümünü Temizle
                  </button>
                )}
                <span className="text-xs px-3 py-1 bg-white/10 rounded-full font-bold text-sky-300">
                  {playerCount === 4 ? 'Oda Doldu! Otomatik Başlıyor...' : 'Katılımcılar Bekleniyor'}
                </span>
              </div>
            </div>

            {/* 4 Player Slots Grid */}
            <div className="grid grid-cols-2 gap-4">
              {slots.map((idx) => {
                const player = roomData.players[idx];

                if (player) {
                  return (
                    <div
                      key={player.id}
                      className="relative flex items-center justify-between p-4 rounded-3xl bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border-2 border-purple-400/50 shadow-lg animate-pop"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-4xl filter drop-shadow">{player.avatar}</span>
                        <div>
                          <div className="font-black text-lg text-white truncate max-w-[110px] sm:max-w-[140px]">
                            {player.name}
                          </div>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              player.isBot
                                ? 'bg-sky-400/20 text-sky-300'
                                : 'bg-emerald-400/20 text-emerald-300'
                            }`}
                          >
                            {player.isBot ? '🤖 Bot' : '✅ Hazır'}
                          </span>
                        </div>
                      </div>

                      {/* Prominent Remove Button for Host */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemovePlayer(player.id);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-red-500/30 hover:bg-red-600 text-red-200 hover:text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow"
                        title="Bu oyuncuyu lobiden çıkar"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Çıkar</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={`empty_${idx}`}
                    className="flex items-center justify-center p-6 rounded-3xl bg-white/5 border-2 border-dashed border-white/20 text-white/40"
                  >
                    <span className="font-bold text-sm tracking-wide">
                      Slot #{idx + 1} Boş
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/10">
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-3xl font-black text-xl uppercase tracking-wider transition-all shadow-xl cursor-pointer ${
                canStart
                  ? 'bg-gradient-to-r from-party-yellow to-amber-500 text-purple-950 hover:brightness-110 active:scale-95 glow-yellow'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <Play className="w-6 h-6 fill-current" />
              Oyunu Başlat ({playerCount} Kişi)
            </button>

            <button
              onClick={onAddBot}
              disabled={playerCount >= 4}
              className={`flex items-center justify-center gap-2 py-4 px-6 rounded-3xl bg-white/10 hover:bg-white/20 text-sky-300 font-bold text-base border border-sky-400/30 transition-all cursor-pointer active:scale-95 ${
                playerCount >= 4 ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              title="Test için Yapay Zeka Botu Ekle"
            >
              <Bot className="w-5 h-5" />
              Bot Ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
