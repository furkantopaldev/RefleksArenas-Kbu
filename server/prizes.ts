import fs from 'fs';
import path from 'path';
import { PrizeResult } from './types';

// Daily prize pool with score tiers. A player gets the highest tier whose score threshold they reached
// and that still has stock today. Thresholds and stock can be changed live from the private /stats page.
const PRIZES_FILE = path.join(process.env.DATA_DIR || process.cwd(), 'prizes.json');
const TIME_ZONE = 'Europe/Istanbul';
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
const ONE_PRIZE_PER_DEVICE_PER_DAY = true; // stops one phone draining the stock by replaying

export interface PrizeTier {
  id: string;
  prize: string; // shown to the player
  minScore: number; // round score needed
  limit: number; // available per day
}

// Defaults for ~300 players/day and 15 prizes (top ~5%): thresholds come from the pacing model
const DEFAULT_TIERS: PrizeTier[] = [
  { id: 'top', prize: 'Defter + Kalem', minScore: 6100, limit: 5 },
  { id: 'mid', prize: 'Kupa Bardağı', minScore: 5800, limit: 5 },
  { id: 'low', prize: 'Kolonya', minScore: 5500, limit: 5 },
];

export interface Award {
  code: string;
  tierId: string;
  date: string; // YYYY-MM-DD (Istanbul)
  time: string; // HH:MM
  name: string;
  avatar: string;
  score: number;
  prize: string;
  claimed: boolean;
  device: string;
}

export interface PrizeCandidate {
  id: string;
  name: string;
  avatar: string;
  score: number;
  device: string;
}

function dateKey(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TIME_ZONE });
}
function timeKey(): string {
  return new Date().toLocaleTimeString('tr-TR', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' });
}

export class PrizeManager {
  private tiers: PrizeTier[] = DEFAULT_TIERS.map((t) => ({ ...t }));
  private awards: Award[] = [];

  constructor() {
    try {
      if (fs.existsSync(PRIZES_FILE)) {
        const raw = JSON.parse(fs.readFileSync(PRIZES_FILE, 'utf-8'));
        if (raw && typeof raw === 'object') {
          if (Array.isArray(raw.tiers) && raw.tiers.length > 0) this.tiers = raw.tiers;
          if (Array.isArray(raw.awards)) this.awards = raw.awards;
        }
      }
    } catch (err) {
      console.warn('Prizes file could not be read, using defaults:', err);
    }
  }

  private save() {
    try {
      fs.writeFileSync(PRIZES_FILE, JSON.stringify({ tiers: this.tiers, awards: this.awards.slice(-2000) }), 'utf-8');
    } catch (err) {
      console.warn('Prizes file could not be saved:', err);
    }
  }

  private awardsToday(): Award[] {
    const today = dateKey();
    return this.awards.filter((a) => a.date === today);
  }

  private newCode(): string {
    const used = new Set(this.awards.map((a) => a.code));
    for (let i = 0; i < 50; i++) {
      let code = '';
      for (let k = 0; k < 4; k++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
      if (!used.has(code)) return code;
    }
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  // Candidates must be sorted best first so limited stock goes to the highest scores
  public evaluate(candidates: PrizeCandidate[]): Map<string, PrizeResult> {
    const out = new Map<string, PrizeResult>();
    const byMinDesc = [...this.tiers].sort((a, b) => b.minScore - a.minScore);
    const lowestMin = byMinDesc.length ? byMinDesc[byMinDesc.length - 1].minScore : Infinity;

    for (const c of candidates) {
      if (c.score < lowestMin) continue;
      const today = this.awardsToday();

      const had = ONE_PRIZE_PER_DEVICE_PER_DAY ? today.find((a) => a.device === c.device) : undefined;
      if (had) {
        out.set(c.id, { status: 'AGAIN', prize: had.prize, code: had.code });
        continue;
      }

      // Highest tier the score qualifies for that still has stock (falls through to lower tiers)
      const tier = byMinDesc.find(
        (t) => c.score >= t.minScore && today.filter((a) => a.tierId === t.id).length < t.limit
      );
      if (!tier) {
        out.set(c.id, { status: 'SOLD_OUT', prize: byMinDesc.find((t) => c.score >= t.minScore)!.prize });
        continue;
      }

      const award: Award = {
        code: this.newCode(),
        tierId: tier.id,
        date: dateKey(),
        time: timeKey(),
        name: c.name,
        avatar: c.avatar,
        score: c.score,
        prize: tier.prize,
        claimed: false,
        device: c.device,
      };
      this.awards.push(award);
      out.set(c.id, { status: 'WON', prize: award.prize, code: award.code });
    }
    if (out.size > 0) this.save();
    return out;
  }

  // Patch tiers by id: { id, minScore?, limit?, prize? }
  public setTiers(patch: Array<Partial<PrizeTier> & { id: string }>) {
    for (const p of patch) {
      const t = this.tiers.find((x) => x.id === p.id);
      if (!t) continue;
      if (typeof p.minScore === 'number' && p.minScore >= 0 && p.minScore <= 100000) t.minScore = Math.round(p.minScore);
      if (typeof p.limit === 'number' && p.limit >= 0 && p.limit <= 10000) t.limit = Math.round(p.limit);
      if (typeof p.prize === 'string' && p.prize.trim()) t.prize = p.prize.trim().slice(0, 40);
    }
    this.save();
  }

  public setClaimed(code: string, claimed: boolean): boolean {
    const a = this.awards.find((x) => x.code === code);
    if (!a) return false;
    a.claimed = claimed;
    this.save();
    return true;
  }

  public snapshot() {
    const today = this.awardsToday();
    const tiers = [...this.tiers]
      .sort((a, b) => b.minScore - a.minScore)
      .map((t) => ({ ...t, remaining: Math.max(0, t.limit - today.filter((a) => a.tierId === t.id).length) }));
    return {
      tiers,
      totalLimit: tiers.reduce((s, t) => s + t.limit, 0),
      remaining: tiers.reduce((s, t) => s + t.remaining, 0),
      awardsToday: today.map(({ device, ...rest }) => rest).reverse(),
    };
  }
}

export const prizeManager = new PrizeManager();
