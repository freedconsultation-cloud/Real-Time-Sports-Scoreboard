import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchGames, fetchTeams, fetchTeamProfile, detectEvents, LEAGUES } from './sports.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const POLL_INTERVAL = 30_000; // 30 seconds

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'] },
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// In-memory game cache: { [league]: Game[] }
const gameCache = {};
// Commentary feed per game: { [gameId]: string[] }
const commentaryCache = {};
// Teams cache: Team[] (all leagues combined, loaded once on startup)
let teamsCache = [];

// ── REST API ───────────────────────────────────────────────────

app.get('/api/teams', (_, res) => {
  res.json(teamsCache);
});

app.get('/api/leagues', (_, res) => {
  res.json(Object.entries(LEAGUES).map(([key, val]) => ({ key, ...val })));
});

app.get('/api/games/:league', async (req, res) => {
  const { league } = req.params;
  if (!LEAGUES[league]) return res.status(404).json({ error: 'Unknown league' });
  // Return cache if fresh, otherwise fetch
  if (gameCache[league]) return res.json(gameCache[league]);
  const games = await fetchGames(league);
  gameCache[league] = games;
  res.json(games);
});

app.get('/api/team/:league/:teamId', async (req, res) => {
  const { league, teamId } = req.params;
  if (!LEAGUES[league]) return res.status(404).json({ error: 'Unknown league' });
  try {
    const profile = await fetchTeamProfile(league, teamId);
    if (!profile) return res.status(404).json({ error: 'Team not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/games/:league/:gameId/commentary', (req, res) => {
  const feed = commentaryCache[req.params.gameId] || [];
  res.json(feed);
});

// ── Socket.IO ──────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Client subscribes to a league
  socket.on('subscribe', (league) => {
    socket.join(`league:${league}`);
    // Immediately send current cache
    if (gameCache[league]) {
      socket.emit('games:update', { league, games: gameCache[league] });
    }
  });

  socket.on('unsubscribe', (league) => socket.leave(`league:${league}`));

  socket.on('disconnect', () => console.log(`Client disconnected: ${socket.id}`));
});

// ── Polling loop ───────────────────────────────────────────────

async function pollLeague(league) {
  const fresh = await fetchGames(league);
  if (!fresh.length) return;

  const prev = gameCache[league] || [];
  const events = detectEvents(prev, fresh);

  // Append to commentary cache
  for (const game of fresh) {
    if (game.status === 'live' && game.lastPlay) {
      if (!commentaryCache[game.id]) commentaryCache[game.id] = [];
      const feed = commentaryCache[game.id];
      if (!feed.length || feed[0].text !== game.lastPlay) {
        feed.unshift({ text: game.lastPlay, time: new Date().toISOString(), period: game.periodLabel, clock: game.clock });
        if (feed.length > 50) feed.pop(); // cap at 50 entries
      }
    }
  }

  gameCache[league] = fresh;

  // Broadcast updates
  io.to(`league:${league}`).emit('games:update', { league, games: fresh });

  // Broadcast key events
  for (const event of events) {
    io.emit('key:event', event);
  }
}

async function pollAll() {
  await Promise.allSettled(Object.keys(LEAGUES).map(pollLeague));
}

// Load all teams once on startup (non-blocking)
async function loadTeams() {
  const results = await Promise.allSettled(Object.keys(LEAGUES).map(fetchTeams));
  teamsCache = results.flatMap((r) => r.status === 'fulfilled' ? r.value : []);
  console.log(`Loaded ${teamsCache.length} teams across all leagues`);
}

// Initial fetch + recurring poll
loadTeams();
pollAll();
setInterval(pollAll, POLL_INTERVAL);

// ── Static client in production ────────────────────────────────

const CLIENT_DIST = path.join(__dirname, '../../client/dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (_, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

httpServer.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
