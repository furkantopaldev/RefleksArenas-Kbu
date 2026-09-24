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

const BOT_NAMES = ['⚡ Şimşek Bot', '🚀 Roket Can', '🎯 Refleks Kralı', '🔥 Alev Ayşe'];
const BOT_AVATARS = ['🦊', '🐯', '⚡', '🤖', '🐼', '🦁'];

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

  // Socket Connections
  public handleConnection(socket: Socket<ClientToServerEvents, ServerToClientEvents>) {
    // Join As Host
    socket.on('joinAsHost', () => {
      this.hostSocketId = socket.id;
      socket.join(this.roomCode);
      socket.emit('roomUpdated', this.getClientRoomData());
    });

    // Join As Player
    socket.on('joinAsPlayer', ({ name, avatar }) => {
      // Check if already in lobby and full (max 4 players)
      const humanCount = Array.from(this.players.values()).filter(p => !p.isBot).length;
      if (this.players.size >= 4 && !this.players.has(socket.id)) {
        socket.emit('errorNotification', 'Oda dolu! Maksimum 4 oyuncu katılabilir.');
        return;
      }

      if (this.state === 'PLAYING' || this.state === 'COUNTDOWN') {
        socket.emit('errorNotification', 'Oyun şu an devam ediyor. Lütfen turun bitmesini bekleyin.');
        return;
      }

      const cleanName = (name || 'Oyuncu ' + (this.players.size + 1)).trim().substring(0, 15);
      const player: Player = {
        id: socket.id,
        name: cleanName,
        avatar: avatar || '⚡',
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
      socket.join(this.roomCode);
      this.broadcastRoomUpdate();

      // Auto start if 4 players join
      if (this.players.size === 4 && this.state === 'LOBBY') {
        this.startCountdown();
      }
    });

    // Host manually starts game
    socket.on('hostStartGame', () => {
      if (this.state === 'LOBBY') {
        this.startCountdown();
      }
    });

    // Host resets room
    socket.on('hostResetRoom', () => {
      this.resetGame();
    });

    // Host adds a bot for testing / empty slots
    socket.on('hostAddBot', () => {
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

    // Host sets custom join URL
    socket.on('hostSetJoinUrl', ({ customUrl }) => {
      this.setCustomUrl(customUrl);
    });

    // Player taps a card
    socket.on('playerTapCard', ({ taskId, cardId, clientTimestamp }) => {
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

      const tappedCard = this.currentTask.cards.find(c => c.id === cardId);
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

        // Base points
        let basePoints = tappedCard.isBonus ? 150 : 100;
        
        // Speed bonus
        let speedBonus = 0;
        if (reactionTimeMs < 400) speedBonus = 50;
        else if (reactionTimeMs < 800) speedBonus = 25;

        // Combo bonus
        let comboBonus = 0;
        if (player.combo >= 8) comboBonus = 100;
        else if (player.combo >= 5) comboBonus = 50;
        else if (player.combo >= 3) comboBonus = 25;

        pointsDelta = basePoints + speedBonus + comboBonus;
        player.score += pointsDelta;
      } else {
        player.wrongCount += 1;
        player.combo = 0;
        pointsDelta = -25; // Balanced fair penalty
        player.score = Math.max(0, player.score + pointsDelta);
        // Player is NOT added to playerTappedForCurrentTask, allowing them to retry!
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

      // If all active players have solved correctly, advance to next task quickly
      if (this.playerTappedForCurrentTask.size >= this.players.size) {
        if (this.taskTimeout) clearTimeout(this.taskTimeout);
        setTimeout(() => this.nextTask(), 250);
      }
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
      if (socket.id === this.hostSocketId) {
        this.hostSocketId = null;
      }
      if (this.players.has(socket.id)) {
        if (this.state === 'LOBBY') {
          this.players.delete(socket.id);
        } else {
          const p = this.players.get(socket.id)!;
          p.connected = false;
        }
        this.broadcastRoomUpdate();
      }
    });
  }

  // Start 3-2-1 Countdown
  private startCountdown() {
    if (this.state !== 'LOBBY') return;
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
    if (this.taskTimeout) clearTimeout(this.taskTimeout);
    this.taskTimeout = setTimeout(() => {
      if (this.state === 'PLAYING') {
        this.nextTask();
      }
    }, task.durationMs);
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
          const speedBonus = delay < 600 ? 40 : 20;
          pointsDelta = (targetCard!.isBonus ? 150 : 100) + speedBonus;
          bot.score += pointsDelta;
        } else {
          bot.wrongCount += 1;
          bot.combo = 0;
          bot.score = Math.max(0, bot.score - 50);
        }

        this.broadcastRoomUpdate();

        if (this.playerTappedForCurrentTask.size >= this.players.size) {
          if (this.taskTimeout) clearTimeout(this.taskTimeout);
          setTimeout(() => this.nextTask(), 250);
        }
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

    const topLeaderboard = leaderboardManager.getTopEntries(10);
    this.io.to(this.roomCode).emit('gameEnded', results, topLeaderboard);
    this.broadcastRoomUpdate();
  }

  // Reset Game back to Lobby
  public resetGame() {
    if (this.gameInterval) clearInterval(this.gameInterval);
    if (this.taskTimeout) clearTimeout(this.taskTimeout);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.botIntervals.forEach(t => clearTimeout(t));

    this.state = 'LOBBY';
    this.currentTask = null;
    this.currentPhase = 1;
    this.timeRemaining = this.settings.totalDurationSeconds;

    // Reset player scores
    for (const player of this.players.values()) {
      player.score = 0;
      player.combo = 0;
      player.maxCombo = 0;
      player.correctCount = 0;
      player.wrongCount = 0;
      player.reactionTimes = [];
    }

    this.io.to(this.roomCode).emit('roomReset');
    this.broadcastRoomUpdate();
  }

  // Task Generator: Dynamic Stroop & Refleks generator
  private generateTask(phase: GamePhase): GameTask {
    const taskId = 'task_' + Math.random().toString(36).substring(2, 9);
    const shuffledColors = [...COLOR_PALETTE].sort(() => Math.random() - 0.5);
    const shuffledShapes = [...SHAPES].sort(() => Math.random() - 0.5);

    // Phase 1: Isınma (4 cards, Color or Shape)
    if (phase === 1) {
      const isColorTask = Math.random() > 0.4;

      if (isColorTask) {
        const targetColor = shuffledColors[0];
        const cardColors = shuffledColors.slice(0, 4).sort(() => Math.random() - 0.5);
        
        const cards: CardItem[] = cardColors.map((c, idx) => ({
          id: `c_${idx}_${c.name}`,
          bgColor: c.hex,
          targetKey: c.name,
        }));

        return {
          id: taskId,
          phase: 1,
          type: 'COLOR',
          prompt: `👉 ${targetColor.name} KARTA DOKUN!`,
          badgeText: '🟢 FAZ 1: ISINMA',
          targetKey: targetColor.name,
          cards,
          createdAt: Date.now(),
          durationMs: 3200,
        };
      } else {
        const targetShape = shuffledShapes[0];
        const cardShapes = shuffledShapes.slice(0, 4).sort(() => Math.random() - 0.5);

        const cards: CardItem[] = cardShapes.map((s, idx) => ({
          id: `s_${idx}_${s.type}`,
          bgColor: shuffledColors[idx % shuffledColors.length].hex,
          shape: s.type,
          targetKey: s.type,
        }));

        return {
          id: taskId,
          phase: 1,
          type: 'SHAPE',
          prompt: `✨ ${targetShape.name} ŞEKLİNE DOKUN!`,
          badgeText: '🟢 FAZ 1: ISINMA',
          targetKey: targetShape.type,
          cards,
          createdAt: Date.now(),
          durationMs: 3200,
        };
      }
    }

    // Phase 2: Stroop Zihin Çelişkisi & Dikkat (6 cards)
    if (phase === 2) {
      const taskVariety = Math.random();

      // Mode A: Stroop Yazı Rengine Dokun (Font Color Conflict)
      if (taskVariety < 0.5) {
        const colorA = shuffledColors[0]; // Text meaning
        const colorB = shuffledColors[1]; // Actual ink color (target)
        
        const cards: CardItem[] = shuffledColors.slice(0, 6).map((c, idx) => ({
          id: `stroop_ink_${idx}_${c.name}`,
          bgColor: c.hex,
          targetKey: c.name,
        }));

        return {
          id: taskId,
          phase: 2,
          type: 'STROOP_COLOR',
          prompt: `🎨 YAZI RENGİNE DOKUN!`,
          subPrompt: `"${colorA.name}" (Yazının rengi neyse ona bas)`,
          badgeText: '⚡ FAZ 2: STROOP ETKİSİ',
          targetKey: colorB.name,
          cards,
          createdAt: Date.now(),
          durationMs: 2700,
        };
      } 
      // Mode B: Stroop Kelimenin Anlamına Dokun (Word Meaning)
      else if (taskVariety < 0.8) {
        const colorA = shuffledColors[0]; // Target meaning
        const colorB = shuffledColors[1]; // Ink color distraction

        const cards: CardItem[] = shuffledColors.slice(0, 6).map((c, idx) => {
          const decoyInk = shuffledColors[(idx + 2) % shuffledColors.length].hex;
          return {
            id: `stroop_word_${idx}_${c.name}`,
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
          subPrompt: `"${colorA.name}" yazan kartı bul`,
          badgeText: '⚡ FAZ 2: KELİME TUZAĞI',
          targetKey: colorA.name,
          cards,
          createdAt: Date.now(),
          durationMs: 2700,
        };
      } 
      // Mode C: Negatif / Olmayan Renk
      else {
        const forbiddenColor = shuffledColors[0];
        const validColor = shuffledColors[1];

        // 6 cards: 5 forbidden colors, 1 valid color
        const cards: CardItem[] = [
          { id: 'c_valid', bgColor: validColor.hex, targetKey: validColor.name },
          { id: 'c_f1', bgColor: forbiddenColor.hex, targetKey: forbiddenColor.name },
          { id: 'c_f2', bgColor: forbiddenColor.hex, targetKey: forbiddenColor.name },
          { id: 'c_f3', bgColor: forbiddenColor.hex, targetKey: forbiddenColor.name },
          { id: 'c_f4', bgColor: forbiddenColor.hex, targetKey: forbiddenColor.name },
          { id: 'c_f5', bgColor: forbiddenColor.hex, targetKey: forbiddenColor.name },
        ].sort(() => Math.random() - 0.5);

        return {
          id: taskId,
          phase: 2,
          type: 'NEGATION',
          prompt: `🚫 ${forbiddenColor.name} OLMAYANA DOKUN!`,
          subPrompt: `Farklı olan tek kartı yakala!`,
          badgeText: '⚡ FAZ 2: DİKKAT TESTİ',
          targetKey: validColor.name,
          cards,
          createdAt: Date.now(),
          durationMs: 2500,
        };
      }
    }

    // Phase 3: Çılgın Kombo & Altın Hız Fazı (6 cards, 1.8s duration, bonus cards)
    const targetColor = shuffledColors[0];
    const isBonusTarget = Math.random() > 0.4;

    const cards: CardItem[] = shuffledColors.slice(0, 6).map((c, idx) => {
      const isTarget = c.name === targetColor.name;
      return {
        id: `p3_${idx}_${c.name}`,
        bgColor: c.hex,
        shape: shuffledShapes[idx % shuffledShapes.length].type,
        isBonus: isTarget && isBonusTarget,
        targetKey: c.name,
      };
    });

    return {
      id: taskId,
      phase: 3,
      type: 'COLOR',
      prompt: isBonusTarget ? `🔥 2X ALTIN HEDEF: ${targetColor.name}!` : `⚡ HIZLI BAS: ${targetColor.name}!`,
      subPrompt: 'Seri bas, kombo çarpanını patlat!',
      badgeText: '🔥 FAZ 3: ÇILGIN HIZ',
      targetKey: targetColor.name,
      cards,
      createdAt: Date.now(),
      durationMs: 2000,
    };
  }
}
