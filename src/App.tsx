import React, { useState, useEffect, useMemo } from 'react';
import { useSocket } from './hooks/useSocket';
import { HostLobby } from './components/host/HostLobby';
import { HostGame } from './components/host/HostGame';
import { HostPodium } from './components/host/HostPodium';
import { HostControls } from './components/host/HostControls';
import { PlayerJoin } from './components/player/PlayerJoin';
import { PlayerGame } from './components/player/PlayerGame';
import { PlayerResult } from './components/player/PlayerResult';
import { Countdown } from './components/ui/Countdown';
import { LeaderboardModal } from './components/ui/LeaderboardModal';
import { Smartphone, Monitor, Loader2 } from 'lucide-react';
import { ClientRoomData } from './types';

export function App() {
  const {
    socket,
    connected,
    roomData,
    currentTask,
    countdown,
    results,
    leaderboard,
    lastTapFeedback,
    errorMessage,
    joinAsHost,
    joinAsPlayer,
    hostStartGame,
    hostResetRoom,
    hostAddBot,
    hostRemovePlayer,
    hostSetJoinUrl,
    playerTapCard,
  } = useSocket();

  // Mode detection based on URL: /play is mobile player, / or /host is Stand PC screen
  const [isPlayerMode, setIsPlayerMode] = useState<boolean>(
    window.location.pathname.startsWith('/play') ||
      window.location.search.includes('mode=player')
  );

  const [hasJoinedPlayer, setHasJoinedPlayer] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerAvatar, setPlayerAvatar] = useState('');
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Initialize Host connection if in host mode
  useEffect(() => {
    if (connected && !isPlayerMode) {
      joinAsHost();
    }
  }, [connected, isPlayerMode, joinAsHost]);

  // Fallback initial room data so screen is NEVER blank
  const activeRoomData: ClientRoomData = useMemo(() => {
    if (roomData) return roomData;
    const host = window.location.hostname || 'localhost';
    const port = window.location.port ? parseInt(window.location.port, 10) : 5173;
    return {
      code: 'ARENA',
      state: 'LOBBY',
      players: [],
      currentPhase: 1,
      timeRemaining: 60,
      hostIp: host,
      port: port,
      joinUrl: `${window.location.protocol}//${host}${window.location.port ? ':' + window.location.port : ''}/play`,
      networkIps: [{ name: 'Wi-Fi / Yerel', ip: host, isWifi: true }],
      settings: {
        totalDurationSeconds: 60,
        soundEnabled: true,
        title: 'Refleks Arenası',
      },
    };
  }, [roomData]);

  // Handle Player Join
  const handlePlayerJoin = (name: string, avatar: string) => {
    setPlayerName(name);
    setPlayerAvatar(avatar);
    joinAsPlayer(name, avatar);
    setHasJoinedPlayer(true);
  };

  // Auto-reset player join state when kicked, room is reset, or not in lobby players list
  useEffect(() => {
    if (!socket) return;
    const handleResetOrKick = () => {
      setHasJoinedPlayer(false);
    };
    socket.on('roomReset', handleResetOrKick);
    socket.on('playerKicked', handleResetOrKick);
    return () => {
      socket.off('roomReset', handleResetOrKick);
      socket.off('playerKicked', handleResetOrKick);
    };
  }, [socket]);

  useEffect(() => {
    if (roomData && roomData.state === 'LOBBY') {
      const isStillInRoom = roomData.players.some((p) => p.id === socket?.id);
      if (!isStillInRoom && hasJoinedPlayer) {
        setHasJoinedPlayer(false);
      }
    }
  }, [roomData, socket?.id, hasJoinedPlayer]);

  // Find current player in room data
  const myPlayer =
    roomData?.players.find((p) => p.id === socket?.id) ||
    (hasJoinedPlayer
      ? {
          id: socket?.id || '',
          name: playerName,
          avatar: playerAvatar,
          score: 0,
          combo: 0,
          maxCombo: 0,
          correctCount: 0,
          wrongCount: 0,
          reactionTimes: [],
          ready: true,
          connected: true,
        }
      : null);

  const myResult = results.find((r) => r.id === socket?.id) || null;

  // View switch handler
  const toggleMode = (targetMode: boolean) => {
    setIsPlayerMode(targetMode);
    if (targetMode) {
      window.history.pushState({}, '', '/play');
    } else {
      window.history.pushState({}, '', '/');
      joinAsHost();
    }
  };

  const roomState = activeRoomData.state || 'LOBBY';

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-hidden">
      {/* Synchronized 3-2-1 Countdown Overlay */}
      {countdown !== null && <Countdown count={countdown} />}

      {/* Leaderboard Modal */}
      <LeaderboardModal
        entries={leaderboard}
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      {/* ========================================================================= */}
      {/* PLAYER MOBILE VIEW */}
      {/* ========================================================================= */}
      {isPlayerMode ? (
        <main className="flex-1 flex flex-col">
          {roomState === 'LOBBY' && (
            <PlayerJoin
              onJoin={handlePlayerJoin}
              isJoined={hasJoinedPlayer}
              playerName={playerName}
              playerAvatar={playerAvatar}
              errorMessage={errorMessage}
            />
          )}

          {roomState === 'PLAYING' && (
            <PlayerGame
              player={myPlayer}
              currentTask={currentTask}
              timeRemaining={activeRoomData.timeRemaining ?? 60}
              lastTapFeedback={lastTapFeedback}
              onTapCard={playerTapCard}
            />
          )}

          {roomState === 'ENDED' && (
            <PlayerResult myResult={myResult} playerId={socket?.id || ''} />
          )}
        </main>
      ) : (
        /* ========================================================================= */
        /* HOST / PC STAND VIEW */
        /* ========================================================================= */
        <main className="flex-1 flex flex-col">
          <HostControls
            onReset={hostResetRoom}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          />

          {roomState === 'LOBBY' && (
            <HostLobby
              roomData={activeRoomData}
              onStartGame={hostStartGame}
              onAddBot={hostAddBot}
              onRemovePlayer={hostRemovePlayer}
              onSetJoinUrl={hostSetJoinUrl}
            />
          )}

          {roomState === 'PLAYING' && (
            <HostGame roomData={activeRoomData} currentTask={currentTask} />
          )}

          {roomState === 'ENDED' && (
            <HostPodium
              results={results}
              leaderboard={leaderboard}
              onResetRoom={hostResetRoom}
            />
          )}
        </main>
      )}

      {/* Bottom Switcher / Mode Bar */}
      <footer className="w-full py-2 px-4 bg-black/50 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
            }`}
          />
          <span>{connected ? 'Sunucuya Bağlı' : 'Bağlanıyor...'}</span>
        </div>

        {/* Quick view switch for demo/testing */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleMode(false)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              !isPlayerMode ? 'bg-party-yellow text-purple-950 font-bold' : 'hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            PC / Stand
          </button>
          <button
            onClick={() => toggleMode(true)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              isPlayerMode ? 'bg-party-yellow text-purple-950 font-bold' : 'hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Telefon Modu
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
