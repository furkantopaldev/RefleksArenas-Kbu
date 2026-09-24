import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';
import path from 'path';
import { GameManager } from './gameEngine';
import { leaderboardManager } from './leaderboard';
import { ClientToServerEvents, NetworkInterfaceInfo, ServerToClientEvents } from './types';

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: '*' }));
app.use(express.json());

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
const CLIENT_PORT = 5173;

console.log('==================================================');
console.log('🎮 REFLEKS ARENASI BAŞLATILIYOR...');
console.log(`💻 Stand / PC Ekranı: http://localhost:${CLIENT_PORT}`);
console.log(`📶 Yerel IP: http://${primaryHostIp}:${CLIENT_PORT}/play`);
console.log('==================================================');

// Socket.io initialization with CORS
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

const gameManager = new GameManager(io, primaryHostIp, CLIENT_PORT);
gameManager.setNetworkIps(networkIps);

// Cloudflare Quick Tunnel using untun / localtunnel
async function initCloudflareTunnel() {
  // 1. Try Cloudflare Tunnel via untun
  try {
    console.log('⚡ Cloudflare Güvenli Tüneli (HTTPS) başlatılıyor...');
    const { startTunnel } = await import('untun');
    const tunnel = await startTunnel({ port: CLIENT_PORT });
    const tunnelUrl = await tunnel.getURL();

    if (tunnelUrl) {
      console.log('--------------------------------------------------');
      console.log(`🌟 CLOUDFLARE HTTPS TÜNELİ HAZIR:`);
      console.log(`📱 ${tunnelUrl}/play`);
      console.log(`✅ Telefonlar QR'ı okutup 4G/5G dahil her yerden anında bağlanabilir!`);
      console.log('--------------------------------------------------');
      gameManager.setTunnelUrl(tunnelUrl);
      return;
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.log('Cloudflare denendi, alternatif tünel kontrol ediliyor:', error.message);
  }

  // 2. Fallback to localtunnel
  try {
    const ltModule = await import('localtunnel');
    const localtunnelFn = (ltModule as unknown as { default?: typeof ltModule }).default || ltModule;
    if (typeof localtunnelFn === 'function') {
      const lt = await (localtunnelFn as (opts: { port: number }) => Promise<{ url: string }>)({ port: CLIENT_PORT });
      if (lt && lt.url) {
        console.log(`🌐 Alternatif Tünel Aktif: ${lt.url}/play`);
        gameManager.setTunnelUrl(lt.url);
      }
    }
  } catch {
    console.log('ℹ️ Bulut tüneli açılamadı, yerel ağ IP üzerinden çalışılıyor.');
  }
}

// Launch tunnel in background
initCloudflareTunnel();

// REST API Endpoints
app.get('/api/info', (req, res) => {
  res.json({
    hostIp: primaryHostIp,
    clientPort: CLIENT_PORT,
    serverPort: PORT,
    joinUrl: gameManager.getEffectiveJoinUrl(),
  });
});

app.get('/api/leaderboard', (req, res) => {
  res.json(leaderboardManager.getTopEntries(10));
});

// Serve frontend dist in production if built
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Socket Sunucusu 0.0.0.0:${PORT} adresinde dinlemede!`);
});
