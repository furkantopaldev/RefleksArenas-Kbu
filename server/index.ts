import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';
import path from 'path';
import { GameManager } from './gameEngine';
import { leaderboardManager } from './leaderboard';
import { statsManager } from './stats';
import { prizeManager } from './prizes';
import { STATS_PAGE } from './statsPage';
import { ClientToServerEvents, NetworkInterfaceInfo, ServerToClientEvents } from './types';

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '4kb' }));

// Determine all valid local network IPv4 addresses
export function getAllNetworkInterfaces(): NetworkInterfaceInfo[] {
  const interfaces = os.networkInterfaces();
  const results: NetworkInterfaceInfo[] = [];

  for (const name of Object.keys(interfaces)) {
    const lowerName = name.toLowerCase();
    // Skip virtual/bridge adapters
    if (
      lowerName.includes('docker') ||
      lowerName.includes('wsl') ||
      lowerName.includes('vethernet') ||
      lowerName.includes('virtual') ||
      lowerName.includes('vmware') ||
      lowerName.includes('bluetooth')
    ) {
      continue;
    }

    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const isWifi =
          lowerName.includes('wi-fi') ||
          lowerName.includes('wireless') ||
          lowerName.includes('wlan');
        results.push({
          name,
          ip: iface.address,
          isWifi,
        });
      }
    }
  }

  // Sort Wi-Fi first
  results.sort((a, b) => (b.isWifi ? 1 : 0) - (a.isWifi ? 1 : 0));
  return results;
}

const networkIps = getAllNetworkInterfaces();
const primaryHostIp = networkIps.length > 0 ? networkIps[0].ip : 'localhost';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const CLIENT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;

console.log('==================================================');
console.log('🎮 REFLEKS ARENASI BAŞLATILIYOR...');
console.log(`🚀 Sunucu Portu: ${PORT}`);
console.log(`🌐 Birincil IP: ${primaryHostIp}`);
console.log('==================================================');

// Socket.io initialization with CORS
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 8 * 1024, // game payloads are tiny; reject anything bigger
  pingInterval: 10000, // detect dead mobile connections quickly
  pingTimeout: 20000,
});

const gameManager = new GameManager(io, primaryHostIp, CLIENT_PORT);
gameManager.setNetworkIps(networkIps);

// Auto-detect Render external URL or environment domain
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL;
if (RENDER_EXTERNAL_URL) {
  console.log(`🌐 Render Canlı Domain Otomatik Bağlandı: ${RENDER_EXTERNAL_URL}`);
  gameManager.setCustomUrl(RENDER_EXTERNAL_URL);
}

// Keep the process alive on unexpected errors (a crash drops every player in the room)
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));
process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));

// Health check (Render / uptime monitors)
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// REST API Endpoints
app.get('/api/info', (req, res) => {
  res.json({
    hostIp: primaryHostIp,
    clientPort: CLIENT_PORT,
    serverPort: PORT,
    joinUrl: gameManager.getEffectiveJoinUrl(),
  });
});

// Private play counters: protected by HOST_KEY when it is set
const STATS_KEY = process.env.HOST_KEY || '';
app.get('/api/stats', (req, res) => {
  if (STATS_KEY && req.query.key !== STATS_KEY) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  res.set('Cache-Control', 'no-store');
  res.json({ ...statsManager.snapshot(), prizes: prizeManager.snapshot() });
});

// Changing prize settings needs the key (refused outright when no HOST_KEY is configured)
function adminAllowed(req: express.Request, res: express.Response): boolean {
  if (!STATS_KEY || req.body?.key !== STATS_KEY) {
    res.status(403).json({ error: 'forbidden' });
    return false;
  }
  return true;
}
app.post('/api/prizes/config', (req, res) => {
  if (!adminAllowed(req, res)) return;
  const tiers = Array.isArray(req.body?.tiers) ? req.body.tiers.slice(0, 10) : [];
  prizeManager.setTiers(
    tiers
      .filter((t: any) => t && typeof t.id === 'string')
      .map((t: any) => ({
        id: t.id,
        minScore: typeof t.minScore === 'number' ? t.minScore : undefined,
        limit: typeof t.limit === 'number' ? t.limit : undefined,
        prize: typeof t.prize === 'string' ? t.prize : undefined,
      }))
  );
  res.json(prizeManager.snapshot());
});
app.post('/api/prizes/claim', (req, res) => {
  if (!adminAllowed(req, res)) return;
  const { code, claimed } = req.body || {};
  if (typeof code !== 'string') {
    res.status(400).json({ error: 'bad request' });
    return;
  }
  res.json({ ok: prizeManager.setClaimed(code.toUpperCase().slice(0, 8), claimed !== false) });
});
app.get('/stats', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.type('html').send(STATS_PAGE);
});

app.get('/api/leaderboard', (req, res) => {
  res.json(leaderboardManager.getTopEntries(10));
});

// Serve frontend dist in production (when built on Render/Cloud)
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// Fallback to index.html for client-side routing (/play, /host, etc.)
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/socket.io')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      next();
    }
  });
});

// Socket connection
io.on('connection', (socket) => {
  gameManager.handleConnection(socket);
});

// A failed listen (port in use) must stop the process, not be swallowed by the handlers above
server.on('error', (err) => {
  console.error('[server] listen error:', err);
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Refleks Arenası 0.0.0.0:${PORT} adresinde yayında!`);
});
