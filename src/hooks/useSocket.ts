import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ClientRoomData,
  ClientToServerEvents,
  GamePhase,
  GameTask,
  LeaderboardEntry,
  PlayerResultSummary,
  ServerToClientEvents,
} from '../types';
import { soundEffects } from '../audio/soundEffects';

export function useSocket() {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomData, setRoomData] = useState<ClientRoomData | null>(null);
  const [currentTask, setCurrentTask] = useState<GameTask | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [results, setResults] = useState<PlayerResultSummary[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lastTapFeedback, setLastTapFeedback] = useState<{
    isCorrect: boolean;
    pointsDelta: number;
    newScore: number;
    combo: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Socket URL: connect to backend server on port 3001 or current host
    const socketHost = window.location.hostname || 'localhost';
    const isDev = window.location.port === '5173';
    const socketUrl = isDev ? `http://${socketHost}:3001` : window.location.origin;

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Automatically request host room data upon connect
      socket.emit('joinAsHost', {});
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('roomUpdated', (data: ClientRoomData) => {
      setRoomData(data);
    });

    socket.on('countdownTick', (seconds: number) => {
      setCountdown(seconds);
      soundEffects.playCountdown(false);
    });

    socket.on('gameStarted', () => {
      setCountdown(null);
      setResults([]);
      soundEffects.playCountdown(true);
    });

    socket.on('taskChanged', (task: GameTask) => {
      setCurrentTask(task);
      setLastTapFeedback(null);
    });

    socket.on('timerTick', (remainingSeconds: number, phase: GamePhase) => {
      setRoomData((prev) =>
        prev ? { ...prev, timeRemaining: remainingSeconds, currentPhase: phase } : null
      );
    });

    socket.on(
      'playerTappedFeedback',
      (feedback: {
        playerId: string;
        isCorrect: boolean;
        pointsDelta: number;
        newScore: number;
        combo: number;
      }) => {
        setLastTapFeedback(feedback);
        if (feedback.isCorrect) {
          soundEffects.playSuccess(feedback.combo);
        } else {
          soundEffects.playError();
        }
      }
    );

    socket.on(
      'gameEnded',
      (finalResults: PlayerResultSummary[], topLeaderboard: LeaderboardEntry[]) => {
        setResults(finalResults);
        setLeaderboard(topLeaderboard);
        setCurrentTask(null);
        soundEffects.playVictory();
      }
    );

    socket.on('roomReset', () => {
      setCountdown(null);
      setCurrentTask(null);
      setResults([]);
      setLastTapFeedback(null);
    });

    socket.on('playerKicked', () => {
      setCountdown(null);
      setCurrentTask(null);
      setResults([]);
      setLastTapFeedback(null);
    });

    socket.on('errorNotification', (msg: string) => {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinAsHost = useCallback(() => {
    socketRef.current?.emit('joinAsHost', {});
  }, []);

  const joinAsPlayer = useCallback((name: string, avatar: string) => {
    socketRef.current?.emit('joinAsPlayer', { roomCode: 'ARENA', name, avatar });
  }, []);

  const hostStartGame = useCallback(() => {
    socketRef.current?.emit('hostStartGame', { roomCode: 'ARENA' });
  }, []);

  const hostResetRoom = useCallback(() => {
    socketRef.current?.emit('hostResetRoom', { roomCode: 'ARENA' });
  }, []);

  const hostAddBot = useCallback(() => {
    socketRef.current?.emit('hostAddBot', { roomCode: 'ARENA' });
  }, []);

  const hostRemovePlayer = useCallback((playerId: string) => {
    socketRef.current?.emit('hostRemovePlayer', { roomCode: 'ARENA', playerId });
  }, []);

  const hostSetJoinUrl = useCallback((customUrl: string) => {
    socketRef.current?.emit('hostSetJoinUrl', { roomCode: 'ARENA', customUrl });
  }, []);

  const playerTapCard = useCallback((taskId: string, cardId: string) => {
    socketRef.current?.emit('playerTapCard', {
      roomCode: 'ARENA',
      taskId,
      cardId,
      clientTimestamp: Date.now(),
    });
  }, []);

  return {
    socket: socketRef.current,
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
  };
}
