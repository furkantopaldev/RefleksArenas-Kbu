export type RoomState = 'LOBBY' | 'COUNTDOWN' | 'PLAYING' | 'ENDED';
export type GamePhase = 1 | 2 | 3;

export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  combo: number;
  maxCombo: number;
  correctCount: number;
  wrongCount: number;
  reactionTimes: number[];
  isBot?: boolean;
  ready: boolean;
  connected: boolean;
}

export type ShapeType = 'star' | 'circle' | 'square' | 'triangle' | 'diamond' | 'heart';

export interface CardItem {
  id: string;
  label?: string; // Text to display (e.g. 'KIRMIZI', 'MAVİ', 'YEŞİL', 'SARI')
  textColor?: string; // CSS color or hex
  bgColor: string; // CSS color or hex
  shape?: ShapeType;
  iconName?: string;
  isTrap?: boolean;
  isBonus?: boolean;
  targetKey: string; // Key used for correctness comparison
}

export type TaskType = 
  | 'COLOR' 
  | 'SHAPE' 
  | 'STROOP_TEXT' 
  | 'STROOP_COLOR' 
  | 'NEGATION';

export interface GameTask {
  id: string;
  phase: GamePhase;
  type: TaskType;
  prompt: string;
  subPrompt?: string;
  badgeText?: string;
  targetKey: string;
  cards: CardItem[];
  createdAt: number;
  durationMs: number;
}

export interface PlayerResultSummary {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  score: number;
  maxCombo: number;
  accuracy: number;
  avgReactionMs: number;
  correctCount: number;
  wrongCount: number;
  isWinner: boolean;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  avatar: string;
  score: number;
  accuracy: number;
  avgReactionMs: number;
  date: string;
}

export interface GameSettings {
  totalDurationSeconds: number; // default 60
  soundEnabled: boolean;
  title: string;
}

export interface ServerToClientEvents {
  roomUpdated: (room: ClientRoomData) => void;
  countdownTick: (seconds: number) => void;
  gameStarted: () => void;
  taskChanged: (task: GameTask) => void;
  timerTick: (remainingSeconds: number, phase: GamePhase) => void;
  playerTappedFeedback: (data: { playerId: string; isCorrect: boolean; pointsDelta: number; newScore: number; combo: number }) => void;
  gameEnded: (results: PlayerResultSummary[], leaderboard: LeaderboardEntry[]) => void;
  roomReset: () => void;
  errorNotification: (message: string) => void;
}

export interface NetworkInterfaceInfo {
  name: string;
  ip: string;
  isWifi: boolean;
}

export interface ClientToServerEvents {
  joinAsHost: (data: { roomCode?: string }) => void;
  joinAsPlayer: (data: { roomCode: string; name: string; avatar: string }) => void;
  playerReady: (data: { roomCode: string }) => void;
  hostStartGame: (data: { roomCode: string }) => void;
  hostResetRoom: (data: { roomCode: string }) => void;
  hostAddBot: (data: { roomCode: string }) => void;
  hostRemovePlayer: (data: { roomCode: string; playerId: string }) => void;
  hostSetJoinUrl: (data: { roomCode: string; customUrl: string }) => void;
  playerTapCard: (data: { roomCode: string; taskId: string; cardId: string; clientTimestamp: number }) => void;
}

export interface ClientRoomData {
  code: string;
  state: RoomState;
  players: Player[];
  currentPhase: GamePhase;
  timeRemaining: number;
  hostIp: string;
  port: number;
  joinUrl: string;
  tunnelUrl?: string | null;
  customUrl?: string | null;
  networkIps: NetworkInterfaceInfo[];
  settings: GameSettings;
}

