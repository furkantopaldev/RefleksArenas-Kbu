import fs from 'fs';
import path from 'path';
import { LeaderboardEntry } from './types';

const LEADERBOARD_FILE = path.join(process.cwd(), 'leaderboard.json');

export class LeaderboardManager {
  private entries: LeaderboardEntry[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(LEADERBOARD_FILE)) {
        const raw = fs.readFileSync(LEADERBOARD_FILE, 'utf-8');
        this.entries = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Leaderboard file could not be read, starting fresh:', err);
      this.entries = [];
    }
  }

  private save() {
    try {
      fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(this.entries, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Leaderboard file could not be saved:', err);
    }
  }

  public getTopEntries(limit: number = 10): LeaderboardEntry[] {
    return [...this.entries]
      .sort((a, b) => b.score - a.score || b.accuracy - a.accuracy || a.avgReactionMs - b.avgReactionMs)
      .slice(0, limit);
  }

  public addEntry(entry: Omit<LeaderboardEntry, 'id' | 'date'>): LeaderboardEntry {
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: 'lb_' + Math.random().toString(36).substring(2, 9),
      date: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };

    this.entries.push(newEntry);
    this.entries.sort((a, b) => b.score - a.score || b.accuracy - a.accuracy || a.avgReactionMs - b.avgReactionMs);
    
    // Keep max 50 entries
    if (this.entries.length > 50) {
      this.entries = this.entries.slice(0, 50);
    }

    this.save();
    return newEntry;
  }

  public clear() {
    this.entries = [];
    this.save();
  }
}

export const leaderboardManager = new LeaderboardManager();
