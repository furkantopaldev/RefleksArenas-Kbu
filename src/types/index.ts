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
  label?: string;
  textColor?: string;
  bgColor: string;
  shape?: ShapeType;
  iconName?: string;
  isTrap?: boolean;
  isBonus?: boolean;
  targetKey: string;
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
  totalDurationSeconds: number;
  soundEnabled: boolean;
  title: string;
}

export interface NetworkInterfaceInfo {
  name: string;
  ip: string;
  isWifi: boolean;
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
