import fs from 'fs';
import path from 'path';

// Private play counters (how many people / rounds per day). Only exposed through the keyed /stats page.
const STATS_FILE = path.join(process.env.DATA_DIR || process.cwd(), 'stats.json');
const TIME_ZONE = 'Europe/Istanbul';
const KEEP_DAYS = 60;

export interface DayStats {
  date: string; // YYYY-MM-DD (Istanbul time)
  players: number;
  rounds: number;
}

function todayKey(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TIME_ZONE });
}

export class StatsManager {
  private days: DayStats[] = [];

  constructor() {
    try {
      if (fs.existsSync(STATS_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
        if (Array.isArray(parsed)) this.days = parsed;
      }
    } catch (err) {
      console.warn('Stats file could not be read, starting fresh:', err);
    }
  }

  private save() {
    try {
      fs.writeFileSync(STATS_FILE, JSON.stringify(this.days), 'utf-8');
    } catch (err) {
      console.warn('Stats file could not be saved:', err);
    }
  }

  // Called when a round actually starts; humans = real (non-bot) players in it
  public recordRound(humans: number) {
    const key = todayKey();
    let day = this.days.find((d) => d.date === key);
    if (!day) {
      day = { date: key, players: 0, rounds: 0 };
      this.days.push(day);
      if (this.days.length > KEEP_DAYS) this.days = this.days.slice(-KEEP_DAYS);
    }
    day.players += humans;
    day.rounds += 1;
    this.save();
  }

  public snapshot() {
    const key = todayKey();
    const today = this.days.find((d) => d.date === key) || { date: key, players: 0, rounds: 0 };
    return {
      today,
      totalPlayers: this.days.reduce((s, d) => s + d.players, 0),
      totalRounds: this.days.reduce((s, d) => s + d.rounds, 0),
      days: [...this.days].reverse().slice(0, 14),
    };
  }
}

export const statsManager = new StatsManager();
