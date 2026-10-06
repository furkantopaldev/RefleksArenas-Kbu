import { Server, Socket } from 'socket.io';
import {
  CardItem,
  ClientRoomData,
  ClientToServerEvents,
  GamePhase,
  GameSettings,
  GameTask,
  LeaderboardEntry,
  NetworkInterfaceInfo,
  Player,
  PlayerResultSummary,
  RoomState,
  ServerToClientEvents,
  ShapeType,
  TaskType,
} from './types';
import { leaderboardManager } from './leaderboard';
import { statsManager } from './stats';

// Turkish color names and hex values
export const COLOR_PALETTE = [
  { name: 'KIRMIZI', hex: '#EF4444', bgClass: 'bg-red-500' },
  { name: 'MAVİ', hex: '#3B82F6', bgClass: 'bg-blue-500' },
  { name: 'YEŞİL', hex: '#10B981', bgClass: 'bg-emerald-500' },
  { name: 'SARI', hex: '#FACC15', bgClass: 'bg-yellow-400' },
  { name: 'MOR', hex: '#8B5CF6', bgClass: 'bg-purple-500' },
  { name: 'TURUNCU', hex: '#F97316', bgClass: 'bg-orange-500' },
];

export const SHAPES: { name: string; type: ShapeType }[] = [
  { name: 'YILDIZ', type: 'star' },
  { name: 'DAİRE', type: 'circle' },
  { name: 'KARE', type: 'square' },
  { name: 'ÜÇGEN', type: 'triangle' },
  { name: 'ELMAS', type: 'diamond' },
  { name: 'KALP', type: 'heart' },
];

// Optional: when set, only a host screen opened with this key may control the room
const HOST_KEY = process.env.HOST_KEY || '';
const RECONNECT_GRACE_MS = 30000;

// Scoring: speed matters most, streaks give a small capped bonus, mistakes cost a little
const BASE_POINTS = 100;
const BONUS_ROUND_MULTIPLIER = 2; // '2X' rounds double the base points only
const MAX_SPEED_BONUS = 100;
const SPEED_FULL_MS = 400; // answers this fast (network latency included) earn the full speed bonus
const COMBO_STEP = 10; // +10 per consecutive correct answer after the first...
const MAX_COMBO_BONUS = 50; // ...capped at +50
const WRONG_PENALTY = 25;

const BOT_NAMES =['🤖 Refleks Bot 1', '🤖 Refleks Bot 2', '🤖 Refleks Bot 3', '🤖 Refleks Bot 4'];
const BOT_AVATARS = ['🤖', '⚡', '🎯', '🔥', '🦁', '🦊'];

// Fisher-Yates pure array shuffle to guarantee uniform random distribution
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export class GameManager {
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private hostIp: string;
  private port: number;
  private tunnelUrl: string | null = null;
  private customUrl: string | null = null;
  private networkIps: NetworkInterfaceInfo[] = [];

  // Single active arena room or map of rooms
  private roomCode: string = 'ARENA';
  private state: RoomState = 'LOBBY';
  private hostSocketId: string | null = null;
  private players: Map<string, Player> = new Map();
  private currentTask: GameTask | null = null;
  private currentPhase: GamePhase = 1;
  private timeRemaining: number = 60;
  private settings: GameSettings = {
    totalDurationSeconds: 60,
    soundEnabled: true,
    title: 'Refleks Arenası',
  };

  private gameInterval: NodeJS.Timeout | null = null;
  private taskTimeout: NodeJS.Timeout | null = null;
  private countdownInterval: NodeJS.Timeout | null = null;
  private botIntervals: NodeJS.Timeout[] = [];
  private playerTappedForCurrentTask: Set<string> = new Set();
  private playerLastTapTimestamp: Map<string, number> = new Map();

  // Reconnect support: tokens never leave the server (Player objects are broadcast to everyone)
  private tokenToId: Map<string, string> = new Map();
  private idToToken: Map<string, string> = new Map();
  private graceTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastResults: PlayerResultSummary[] | null = null;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>, hostIp: string, port: number) {
    this.io = io;
    this.hostIp = hostIp;
    this.port = port;
  }

  public setHostIp(ip: string) {
    this.hostIp = ip;
    this.broadcastRoomUpdate();
  }

  public setTunnelUrl(url: string | null) {
    this.tunnelUrl = url;
    this.broadcastRoomUpdate();
  }

  public setCustomUrl(url: string | null) {
    this.customUrl = url;
    this.broadcastRoomUpdate();
  }

  public setNetworkIps(ips: NetworkInterfaceInfo[]) {
    this.networkIps = ips;
    this.broadcastRoomUpdate();
  }

  public getEffectiveJoinUrl(): string {
    if (this.customUrl && this.customUrl.trim()) {
      const url = this.customUrl.trim().replace(/\/+$/, '');
      return url.endsWith('/play') ? url : `${url}/play`;
    }
    if (this.tunnelUrl && this.tunnelUrl.trim()) {
      const url = this.tunnelUrl.trim().replace(/\/+$/, '');
      return url.endsWith('/play') ? url : `${url}/play`;
    }
    return `http://${this.hostIp}:${this.port}/play`;
  }

  public getClientRoomData(): ClientRoomData {
    return {
      code: this.roomCode,
      state: this.state,
      players: Array.from(this.players.values()),
      currentPhase: this.currentPhase,
      timeRemaining: this.timeRemaining,
      hostIp: this.hostIp,
      port: this.port,
      joinUrl: this.getEffectiveJoinUrl(),
      tunnelUrl: this.tunnelUrl,
      customUrl: this.customUrl,
      networkIps: this.networkIps,
      settings: this.settings,
    };
  }

  public broadcastRoomUpdate() {
    this.io.to(this.roomCode).emit('roomUpdated', this.getClientRoomData());
  }

  // Re-key a player to a new socket id after a reconnect (mobile network switch, screen lock...)
  private rebindPlayer(oldId: string, newId: string) {
    const p = this.players.get(oldId);
    if (!p) return;
    this.players.delete(oldId);
    p.id = newId;
    p.connected = true;
    this.players.set(newId, p);

    const token = this.idToToken.get(oldId);
    if (token) {
      this.idToToken.delete(oldId);
      this.idToToken.set(newId, token);
      this.tokenToId.set(token, newId);
    }
    if (this.playerTappedForCurrentTask.delete(oldId)) this.playerTappedForCurrentTask.add(newId);
    this.playerLastTapTimestamp.delete(oldId);
    const grace = this.graceTimers.get(oldId);
    if (grace) {
      clearTimeout(grace);
      this.graceTimers.delete(oldId);
    }
  }

  private dropPlayer(id: string) {
    this.players.delete(id);
    const token = this.idToToken.get(id);
    if (token) this.tokenToId.delete(token);
    this.idToToken.delete(id);
    this.playerLastTapTimestamp.delete(id);
    this.playerTappedForCurrentTask.delete(id);
    const grace = this.graceTimers.get(id);
    if (grace) clearTimeout(grace);
    this.graceTimers.delete(id);
  }

  // Points for a correct answer: base + speed bonus (linear over the task window) + capped streak bonus
  private scoreCorrect(task: GameTask, reactionMs: number, comboAfterHit: number): number {
    const base = BASE_POINTS * (task.badgeText?.includes('2X') ? BONUS_ROUND_MULTIPLIER : 1);
    const window = Math.max(1, task.durationMs - SPEED_FULL_MS);
    const speedRatio = Math.min(1, Math.max(0, 1 - (reactionMs - SPEED_FULL_MS) / window));
    const speedBonus = Math.round(MAX_SPEED_BONUS * speedRatio);
    const comboBonus = Math.min(MAX_COMBO_BONUS, Math.max(0, comboAfterHit - 1) * COMBO_STEP);
    return base + speedBonus + comboBonus;
  }

  // Everyone who is still connected has answered correctly
  private allConnectedSolved(): boolean {
    for (const p of this.players.values()) {
      if (p.connected && !this.playerTappedForCurrentTask.has(p.id)) return false;
    }
    return true;
  }

  private scheduleAdvance(delayMs: number) {
    if (this.taskTimeout) clearTimeout(this.taskTimeout);
    this.taskTimeout = setTimeout(() => {
      if (this.state === 'PLAYING') this.nextTask();
    }, delayMs);
  }

  // Socket Connections
  public handleConnection(socket: Socket<ClientToServerEvents, ServerToClientEvents>) {
    // Flood protection: drop clients sending more than 40 events per second
    let windowStart = Date.now();
    let windowCount = 0;
    socket.use((_packet, next) => {
      const now = Date.now();
      if (now - windowStart > 1000) {
        windowStart = now;
        windowCount = 0;
      }
      windowCount += 1;
      if (windowCount > 40) return; // silently drop
      next();
    });

    // Wrap every handler: malformed payloads must never crash the process
    const on = <E extends keyof ClientToServerEvents>(event: E, handler: (data: any, ack?: any) => void) => {
      (socket as any).on(event, (data: unknown, ack?: unknown) => {
        try {
          const payload = data && typeof data === 'object' ? data : {};
          handler(payload, typeof ack === 'function' ? ack : undefined);
        } catch (err) {
          console.error(`[socket] handler error in ${String(event)}:`, err);
        }
      });
    };
    const isHost = () => socket.data.isHost === true;

    // Join As Host
    on('joinAsHost', (data: { key?: string }) => {
      if (HOST_KEY && data.key !== HOST_KEY) {
        socket.emit('errorNotification', 'Görevli anahtarı hatalı.');
        return;
      }
      socket.data.isHost = true;
      this.hostSocketId = socket.id;
      socket.join(this.roomCode);
      socket.emit('roomUpdated', this.getClientRoomData());
    });

    // Reconnect: a phone that lost its socket reclaims its seat with its token
    on('rejoinPlayer', (data: { token?: string }, ack?: (ok: boolean) => void) => {
      const token = typeof data.token === 'string' ? data.token.slice(0, 64) : '';
      const oldId = token ? this.tokenToId.get(token) : undefined;
      if (!oldId || !this.players.has(oldId)) {
        ack?.(false);
        return;
      }
      this.rebindPlayer(oldId, socket.id);
      socket.join(this.roomCode);
      ack?.(true);
      socket.emit('roomUpdated', this.getClientRoomData());
      if (this.state === 'PLAYING' && this.currentTask) socket.emit('taskChanged', this.currentTask);
      if (this.state === 'ENDED' && this.lastResults) {
        socket.emit('gameEnded', this.lastResults, leaderboardManager.getTopEntries(10));
      }
      this.broadcastRoomUpdate();
    });

    // Join As Player
    on('joinAsPlayer', (data: { name?: unknown; avatar?: unknown; token?: unknown }) => {
      const existing = this.players.get(socket.id);
      if (this.players.size >= 4 && !existing) {
        socket.emit('errorNotification', 'Oda dolu! Maksimum 4 oyuncu katılabilir.');
        return;
      }

      if (this.state !== 'LOBBY') {
        socket.emit(
          'errorNotification',
          this.state === 'ENDED'
            ? 'Tur bitti. Görevli yeni turu başlatınca tekrar katılabilirsiniz.'
            : 'Oyun şu an devam ediyor. Lütfen turun bitmesini bekleyin.'
        );
        return;
      }

      // Names: max 15 chars, no markup / control characters
      const rawName = typeof data.name === 'string' ? data.name : '';
      const cleanName =
        rawName.replace(/[<>\u0000-\u001F\u007F]/g, '').trim().substring(0, 15) ||
        'Oyuncu ' + (this.players.size + 1);
      // Avatars: at most 2 characters (one emoji)
      const rawAvatar = typeof data.avatar === 'string' ? data.avatar : '';
      const cleanAvatar = Array.from(rawAvatar).slice(0, 8).join('') || '⚡';
      const token = typeof data.token === 'string' ? data.token.slice(0, 64) : '';

      const player: Player = {
        id: socket.id,
        name: cleanName,
        avatar: cleanAvatar,
        score: 0,
        combo: 0,
        maxCombo: 0,
        correctCount: 0,
        wrongCount: 0,
        reactionTimes: [],
        ready: true,
        connected: true,
      };

      this.players.set(socket.id, player);
      if (token) {
        this.idToToken.set(socket.id, token);
        this.tokenToId.set(token, socket.id);
      }
      socket.join(this.roomCode);
      this.broadcastRoomUpdate();

      // Auto start if 4 players join
      if (this.players.size === 4 && this.state === 'LOBBY') {
        this.startCountdown();
      }
    });

    // Host manually starts game
    on('hostStartGame', () => {
      if (!isHost()) return;
      if (this.state === 'LOBBY') {
        this.startCountdown();
      }
    });

    // Host resets room
    on('hostResetRoom', () => {
      if (!isHost()) return;
      this.resetGame();
    });

    // Host adds a bot for testing / empty slots
    on('hostAddBot', () => {
      if (!isHost()) return;
      if (this.state !== 'LOBBY' || this.players.size >= 4) return;
      const botId = 'bot_' + Math.random().toString(36).substring(2, 7);
      const botIndex = Array.from(this.players.values()).filter(p => p.isBot).length;
      const botName = BOT_NAMES[botIndex % BOT_NAMES.length];
      const botAvatar = BOT_AVATARS[botIndex % BOT_AVATARS.length];

      const botPlayer: Player = {
        id: botId,
        name: botName,
        avatar: botAvatar,
        score: 0,
        combo: 0,
        maxCombo: 0,
        correctCount: 0,
        wrongCount: 0,
        reactionTimes: [],
        isBot: true,
        ready: true,
        connected: true,
      };

      this.players.set(botId, botPlayer);
      this.broadcastRoomUpdate();

      if (this.players.size === 4) {
        this.startCountdown();
      }
    });

    // Host removes a player
    on('hostRemovePlayer', ({ playerId }: { playerId?: unknown }) => {
      if (!isHost() || typeof playerId !== 'string') return;
      if (this.players.has(playerId)) {
        this.dropPlayer(playerId);
        this.io.to(playerId).emit('playerKicked');
        this.io.to(playerId).emit('errorNotification', 'Görevli tarafından lobiden çıkarıldınız.');
        this.broadcastRoomUpdate();
      }
    });

    // Host sets custom join URL
    on('hostSetJoinUrl', ({ customUrl }: { customUrl?: unknown }) => {
      if (!isHost() || typeof customUrl !== 'string') return;
      const trimmed = customUrl.trim().slice(0, 300);
      if (trimmed && !/^https?:\/\//i.test(trimmed)) return;
      this.setCustomUrl(trimmed || null);
    });

    // Player taps a card
    on('playerTapCard', ({ taskId, cardId }: { taskId?: unknown; cardId?: unknown }) => {
      if (typeof taskId !== 'string' || typeof cardId !== 'string') return;
      if (this.state !== 'PLAYING' || !this.currentTask || this.currentTask.id !== taskId) {
        return;
      }

      const player = this.players.get(socket.id);
      if (!player) return;

      // If already correctly solved this task, ignore
      if (this.playerTappedForCurrentTask.has(socket.id)) {
        return;
      }

      // Minimal anti-spam cooldown: 180ms
      const lastTap = this.playerLastTapTimestamp.get(socket.id) || 0;
      const now = Date.now();
      if (now - lastTap < 180) {
        return;
      }
      this.playerLastTapTimestamp.set(socket.id, now);

      const tappedCard = this.currentTask.cards.find((c) => c.id === cardId);
      if (!tappedCard) return;

      const reactionTimeMs = Math.max(50, now - this.currentTask.createdAt);
      player.reactionTimes.push(reactionTimeMs);

      const isCorrect = tappedCard.targetKey === this.currentTask.targetKey;
      let pointsDelta = 0;

      if (isCorrect) {
        this.playerTappedForCurrentTask.add(socket.id);
        player.correctCount += 1;
        player.combo += 1;
        if (player.combo > player.maxCombo) {
          player.maxCombo = player.combo;
        }

        pointsDelta = this.scoreCorrect(this.currentTask, reactionTimeMs, player.combo);
        player.score += pointsDelta;
      } else {
        player.wrongCount += 1;
        player.combo = 0;
        pointsDelta = -WRONG_PENALTY;
        player.score = Math.max(0, player.score + pointsDelta);
        // Player is NOT locked out; they can retry after 220ms!
      }

      // Send feedback to specific player and update room
      socket.emit('playerTappedFeedback', {
        playerId: player.id,
        isCorrect,
        pointsDelta,
        newScore: player.score,
        combo: player.combo,
      });

      this.broadcastRoomUpdate();

      // If all connected players have solved correctly, advance to next task quickly
      if (this.allConnectedSolved()) this.scheduleAdvance(150);
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
      if (socket.id === this.hostSocketId) {
        this.hostSocketId = null;
      }
      this.playerLastTapTimestamp.delete(socket.id);
      const p = this.players.get(socket.id);
      if (!p) return;
      p.connected = false;
      if (this.state === 'LOBBY') {
        // Grace period: a phone that switches network / locks its screen can reclaim its seat
        const id = socket.id;
        this.graceTimers.set(
          id,
          setTimeout(() => {
            const cur = this.players.get(id);
            if (cur && !cur.connected && this.state === 'LOBBY') {
              this.dropPlayer(id);
              this.broadcastRoomUpdate();
            }
          }, RECONNECT_GRACE_MS)
        );
      } else if (this.state === 'PLAYING' && this.allConnectedSolved()) {
        this.scheduleAdvance(150);
      }
      this.broadcastRoomUpdate();
    });
  }

  // Start 3-2-1 Countdown
  private startCountdown() {
    if (this.state !== 'LOBBY') return;
    // Seats whose phone never came back should not play
    for (const p of Array.from(this.players.values())) {
      if (!p.connected) this.dropPlayer(p.id);
    }
    if (this.players.size === 0) {
      this.broadcastRoomUpdate();
      return;
    }
    this.state = 'COUNTDOWN';
    let count = 3;
    this.io.to(this.roomCode).emit('countdownTick', count);
    this.broadcastRoomUpdate();

    if (this.countdownInterval) clearInterval(this.countdownInterval);

    this.countdownInterval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        this.io.to(this.roomCode).emit('countdownTick', count);
      } else {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        this.startGame();
      }
    }, 1000);
  }

  // Start Game
  private startGame() {
    this.state = 'PLAYING';
    this.timeRemaining = this.settings.totalDurationSeconds; // 60s
    this.currentPhase = 1;

    // Reset player scores
    for (const player of this.players.values()) {
      player.score = 0;
      player.combo = 0;
      player.maxCombo = 0;
      player.correctCount = 0;
      player.wrongCount = 0;
      player.reactionTimes = [];
    }

    statsManager.recordRound(Array.from(this.players.values()).filter((p) => !p.isBot).length);

    this.io.to(this.roomCode).emit('gameStarted');
    this.broadcastRoomUpdate();

    // Start 1s Game Timer
    if (this.gameInterval) clearInterval(this.gameInterval);
    this.gameInterval = setInterval(() => {
      this.timeRemaining -= 1;

      // Phase changes
      // 0 - 15s elapsed (timeRemaining 60 to 45) -> Phase 1
      // 15 - 40s elapsed (timeRemaining 45 to 20) -> Phase 2 (Stroop & Traps)
      // 40 - 60s elapsed (timeRemaining 20 to 0) -> Phase 3 (Frenzy & Combo)
      if (this.timeRemaining > 45) {
        this.currentPhase = 1;
      } else if (this.timeRemaining > 20) {
        this.currentPhase = 2;
      } else {
        this.currentPhase = 3;
      }

      this.io.to(this.roomCode).emit('timerTick', this.timeRemaining, this.currentPhase);

      if (this.timeRemaining <= 0) {
        this.endGame();
      }
    }, 1000);

    // Start generating tasks
    this.nextTask();
  }

  // Generate and broadcast next task
  private nextTask() {
    if (this.state !== 'PLAYING') return;
    this.playerTappedForCurrentTask.clear();

    const task = this.generateTask(this.currentPhase);
    this.currentTask = task;
    this.io.to(this.roomCode).emit('taskChanged', task);

    // Schedule bots if any
    this.simulateBotsForTask(task);

    // Schedule auto advance if nobody taps
    this.scheduleAdvance(task.durationMs);
  }

  // Simulate Bot Responses
  private simulateBotsForTask(task: GameTask) {
    this.botIntervals.forEach(t => clearTimeout(t));
    this.botIntervals = [];

    const bots = Array.from(this.players.values()).filter(p => p.isBot);
    for (const bot of bots) {
      // 80% accuracy for bots
      const willBeCorrect = Math.random() < 0.82;
      let targetCard: CardItem | undefined;

      if (willBeCorrect) {
        targetCard = task.cards.find(c => c.targetKey === task.targetKey);
      } else {
        targetCard = task.cards.find(c => c.targetKey !== task.targetKey);
      }

      if (!targetCard) targetCard = task.cards[0];

      // Reaction time between 450ms and 1500ms
      const delay = Math.floor(450 + Math.random() * (task.phase === 3 ? 650 : 900));

      const timer = setTimeout(() => {
        if (this.state !== 'PLAYING' || !this.currentTask || this.currentTask.id !== task.id) return;
        if (this.playerTappedForCurrentTask.has(bot.id)) return;
        this.playerTappedForCurrentTask.add(bot.id);

        bot.reactionTimes.push(delay);
        const isCorrect = targetCard!.targetKey === task.targetKey;
        let pointsDelta = 0;

        if (isCorrect) {
          bot.correctCount += 1;
          bot.combo += 1;
          if (bot.combo > bot.maxCombo) bot.maxCombo = bot.combo;
          pointsDelta = this.scoreCorrect(task, delay, bot.combo);
          bot.score += pointsDelta;
        } else {
          bot.wrongCount += 1;
          bot.combo = 0;
          bot.score = Math.max(0, bot.score - WRONG_PENALTY);
        }

        this.broadcastRoomUpdate();

        if (this.allConnectedSolved()) this.scheduleAdvance(250);
      }, delay);

      this.botIntervals.push(timer);
    }
  }

  // End Game & Calculate Podium
  private endGame() {
    this.state = 'ENDED';
    if (this.gameInterval) clearInterval(this.gameInterval);
    if (this.taskTimeout) clearTimeout(this.taskTimeout);
    this.botIntervals.forEach(t => clearTimeout(t));

    const playersList = Array.from(this.players.values());
    // Sort by score desc, accuracy desc, avg reaction asc
    const sorted = [...playersList].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const accA = a.correctCount / Math.max(1, a.correctCount + a.wrongCount);
      const accB = b.correctCount / Math.max(1, b.correctCount + b.wrongCount);
      if (accB !== accA) return accB - accA;
      const avgA = a.reactionTimes.length ? a.reactionTimes.reduce((s, r) => s + r, 0) / a.reactionTimes.length : 9999;
      const avgB = b.reactionTimes.length ? b.reactionTimes.reduce((s, r) => s + r, 0) / b.reactionTimes.length : 9999;
      return avgA - avgB;
    });

    const results: PlayerResultSummary[] = sorted.map((p, index) => {
      const totalAttempts = p.correctCount + p.wrongCount;
      const accuracy = totalAttempts > 0 ? Math.round((p.correctCount / totalAttempts) * 100) : 0;
      const avgReactionMs = p.reactionTimes.length > 0 
        ? Math.round(p.reactionTimes.reduce((a, b) => a + b, 0) / p.reactionTimes.length) 
        : 0;

      return {
        rank: index + 1,
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        maxCombo: p.maxCombo,
        accuracy,
        avgReactionMs,
        correctCount: p.correctCount,
        wrongCount: p.wrongCount,
        isWinner: index === 0,
      };
    });

    // Add winner to daily leaderboard
    if (results.length > 0 && results[0].score > 0) {
      const winner = results[0];
      leaderboardManager.addEntry({
        playerName: winner.name,
        avatar: winner.avatar,
        score: winner.score,
        accuracy: winner.accuracy,
        avgReactionMs: winner.avgReactionMs,
      });
    }

    this.lastResults = results;
    const topLeaderboard = leaderboardManager.getTopEntries(10);
    this.io.to(this.roomCode).emit('gameEnded', results, topLeaderboard);
    this.broadcastRoomUpdate();
  }

  // Reset Game back to Lobby & Clear previous players for the next group
  public resetGame() {
    if (this.gameInterval) clearInterval(this.gameInterval);
    if (this.taskTimeout) clearTimeout(this.taskTimeout);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.botIntervals.forEach((t) => clearTimeout(t));

    this.state = 'LOBBY';
    this.currentTask = null;
    this.currentPhase = 1;
    this.timeRemaining = this.settings.totalDurationSeconds;

    // Clear previous players so slots are fresh and empty for the new group standing at the booth!
    this.players.clear();
    this.playerTappedForCurrentTask.clear();
    this.playerLastTapTimestamp.clear();
    this.tokenToId.clear();
    this.idToToken.clear();
    this.graceTimers.forEach((t) => clearTimeout(t));
    this.graceTimers.clear();
    this.lastResults = null;

    this.io.to(this.roomCode).emit('roomReset');
    this.broadcastRoomUpdate();
  }

  // Task Generator: Dynamic Stroop & Refleks generator
  private generateTask(phase: GamePhase): GameTask {
    const taskId = 'task_' + Math.random().toString(36).substring(2, 9);
    const shuffledColors = shuffleArray(COLOR_PALETTE);
    const shuffledShapes = shuffleArray(SHAPES);

    // Warm-up (4 cards, Color or Shape) - 2100ms
    if (phase === 1) {
      const isColorTask = Math.random() > 0.4;

      if (isColorTask) {
        const targetColor = shuffledColors[0];
        const rawCardColors = shuffledColors.slice(0, 4);
        const cardColors = shuffleArray(rawCardColors);

        const cards: CardItem[] = cardColors.map((c, idx) => ({
          id: `c_${idx}_${c.name}_${Math.random().toString(36).substring(2, 5)}`,
          bgColor: c.hex,
          targetKey: c.name,
        }));

        return {
          id: taskId,
          phase: 1,
          type: 'COLOR',
          prompt: `👉 ${targetColor.name} KARTA DOKUN!`,
          badgeText: '🎯 HEDEFİ YAKALA',
          targetKey: targetColor.name,
          cards: shuffleArray(cards),
          createdAt: Date.now(),
          durationMs: 2100,
        };
      } else {
        const targetShape = shuffledShapes[0];
        const rawCardShapes = shuffledShapes.slice(0, 4);
        const cardShapes = shuffleArray(rawCardShapes);

        const cards: CardItem[] = cardShapes.map((s, idx) => ({
          id: `s_${idx}_${s.type}_${Math.random().toString(36).substring(2, 5)}`,
          bgColor: shuffledColors[idx % shuffledColors.length].hex,
          shape: s.type,
          targetKey: s.type,
        }));

        return {
          id: taskId,
          phase: 1,
          type: 'SHAPE',
          prompt: `✨ ${targetShape.name} ŞEKLİNE DOKUN!`,
          badgeText: '🎯 HEDEFİ YAKALA',
          targetKey: targetShape.type,
          cards: shuffleArray(cards),
          createdAt: Date.now(),
          durationMs: 2100,
        };
      }
    }

    // Stroop Zihin Çelişkisi & Dikkat (6 cards) - 2600ms (okuma ve düşünme için artırılmış süre)
    if (phase === 2) {
      const taskVariety = Math.random();

      // Mode A: Stroop Yazı Rengine Dokun (Font Color Conflict)
      if (taskVariety < 0.5) {
        const textMeaningColor = shuffledColors[0]; // Text says e.g. "KIRMIZI"
        const actualInkColor = shuffledColors[1];    // Font ink color is e.g. GREEN (TARGET)

        const rawCards: CardItem[] = shuffledColors.slice(0, 6).map((c, idx) => ({
          id: `stroop_ink_${idx}_${c.name}_${Math.random().toString(36).substring(2, 5)}`,
          bgColor: c.hex,
          targetKey: c.name,
        }));

        return {
          id: taskId,
          phase: 2,
          type: 'STROOP_COLOR',
          prompt: `🎨 YAZI RENGİNE DOKUN!`,
          highlightWord: textMeaningColor.name,
          highlightColor: actualInkColor.hex,
          subPrompt: `(Kelimeye aldanma, harflerin rengi neyse o karta bas!)`,
          badgeText: '🧠 ZİHİN ÇELİŞKİSİ',
          targetKey: actualInkColor.name,
          cards: shuffleArray(rawCards),
          createdAt: Date.now(),
          durationMs: 2600,
        };
      }
      // Mode B: Stroop Kelimenin Anlamına Dokun (Word Meaning)
      else if (taskVariety < 0.8) {
        const targetMeaningColor = shuffledColors[0]; // Target meaning e.g. "SARI"
        const decoyInkColor = shuffledColors[1];      // Distracting font color e.g. Blue

        const rawCards: CardItem[] = shuffledColors.slice(0, 6).map((c, idx) => {
          const decoyInk = shuffledColors[(idx + 2) % shuffledColors.length].hex;
          return {
            id: `stroop_word_${idx}_${c.name}_${Math.random().toString(36).substring(2, 5)}`,
            label: c.name,
            textColor: decoyInk,
            bgColor: '#2A265F',
            targetKey: c.name,
          };
        });

        return {
          id: taskId,
          phase: 2,
          type: 'STROOP_TEXT',
          prompt: `📖 KELİME ANLAMINA DOKUN!`,
          highlightWord: targetMeaningColor.name,
          highlightColor: decoyInkColor.hex,
          subPrompt: `(Renge aldanma, "${targetMeaningColor.name}" yazan kartı bul!)`,
          badgeText: '📖 KELİME TUZAĞI',
          targetKey: targetMeaningColor.name,
          cards: shuffleArray(rawCards),
          createdAt: Date.now(),
          durationMs: 2600,
        };
      }
      // Mode C: Negatif / Olmayan Renk
      else {
        const forbiddenColor = shuffledColors[0];
        const validColor = shuffledColors[1];

        // 6 cards: 5 forbidden colors, 1 valid color (fully shuffled)
        const rawCards: CardItem[] = [
          { id: 'c_valid_' + Math.random().toString(36).substring(2, 5), bgColor: validColor.hex, targetKey: validColor.name },
          { id: 'c_f1_' + Math.random().toString(36).substring(2, 5), bgColor: forbiddenColor.hex, targetKey: forbiddenColor.name },
          { id: 'c_f2_' + Math.random().toString(36).substring(2, 5), bgColor: forbiddenColor.hex, targetKey: forbiddenColor.name },
          { id: 'c_f3_' + Math.random().toString(36).substring(2, 5), bgColor: forbiddenColor.hex, targetKey: forbiddenColor.name },
          { id: 'c_f4_' + Math.random().toString(36).substring(2, 5), bgColor: forbiddenColor.hex, targetKey: forbiddenColor.name },
          { id: 'c_f5_' + Math.random().toString(36).substring(2, 5), bgColor: forbiddenColor.hex, targetKey: forbiddenColor.name },
        ];

        return {
          id: taskId,
          phase: 2,
          type: 'NEGATION',
          prompt: `🚫 ${forbiddenColor.name} OLMAYANA DOKUN!`,
          subPrompt: `Farklı renkteki tek kartı yakala!`,
          badgeText: '⚠️ DİKKAT TESTİ',
          targetKey: validColor.name,
          cards: shuffleArray(rawCards),
          createdAt: Date.now(),
          durationMs: 2400,
        };
      }
    }

    // Çılgın Kombo & Hız (6 cards, 1800ms, hem renk hem şekil avı!)
    const isBonusRound = Math.random() > 0.4;
    const isShapeTask = Math.random() > 0.5;

    // Şekil Sorusu (Kafaları karıştırmak için bazen şekil, bazen renk)
    if (isShapeTask) {
      const targetShape = shuffledShapes[0];
      const rawCards: CardItem[] = shuffledShapes.slice(0, 6).map((s, idx) => ({
        id: `p3_shp_${idx}_${s.type}_${Math.random().toString(36).substring(2, 5)}`,
        bgColor: shuffledColors[idx % shuffledColors.length].hex,
        shape: s.type,
        isBonus: false,
        targetKey: s.type,
      }));

      return {
        id: taskId,
        phase: 3,
        type: 'SHAPE',
        prompt: isBonusRound ? `🔥 2X ALTIN ŞEKİL: ${targetShape.name}!` : `✨ HIZLI ŞEKİL: ${targetShape.name}!`,
        subPrompt: isBonusRound ? `Renge aldanma, 2X puan için ${targetShape.name} şekline bas!` : `Renge aldanma, ${targetShape.name} şekline bas!`,
        badgeText: isBonusRound ? '🔥 2X SÜPER ŞEKİL' : '✨ ŞEKİL REFLEKSİ',
        targetKey: targetShape.type,
        cards: shuffleArray(rawCards),
        createdAt: Date.now(),
        durationMs: 1800,
      };
    } else {
      // Renk Sorusu
      const targetColor = shuffledColors[0];
      const rawCards: CardItem[] = shuffledColors.slice(0, 6).map((c, idx) => ({
        id: `p3_col_${idx}_${c.name}_${Math.random().toString(36).substring(2, 5)}`,
        bgColor: c.hex,
        shape: shuffledShapes[idx % shuffledShapes.length].type,
        isBonus: false,
        targetKey: c.name,
      }));

      return {
        id: taskId,
        phase: 3,
        type: 'COLOR',
        prompt: isBonusRound ? `🔥 2X ALTIN RENK: ${targetColor.name}!` : `⚡ HIZLI RENK: ${targetColor.name}!`,
        subPrompt: isBonusRound ? `Şekle aldanma, 2X puan için ${targetColor.name} renge bas!` : `Şekle aldanma, ${targetColor.name} renge bas!`,
        badgeText: isBonusRound ? '🔥 2X SÜPER RENK' : '⚡ RENK REFLEKSİ',
        targetKey: targetColor.name,
        cards: shuffleArray(rawCards),
        createdAt: Date.now(),
        durationMs: 1800,
      };
    }
  }
}
