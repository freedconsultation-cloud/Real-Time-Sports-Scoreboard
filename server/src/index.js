import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchGames, fetchTeams, fetchTeamProfile, fetchBoxScore, detectEvents, LEAGUES, fetchLeagueStandings, fetchLeaders, fetchHeadToHead, searchPlayers, fetchPlayerStats, fetchWinProbability, fetchGameNews, fetchGameInjuries, fetchTeamRoster } from './sports.js';

// Dynamic import so a missing/broken web-push package can't crash the server
let webpush = null;
try {
  webpush = (await import('web-push')).default;
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:example@example.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );
    console.log('Push notifications enabled');
  }
} catch (e) {
  console.warn('web-push unavailable, push notifications disabled:', e.message);
}

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

// In-memory caches
const gameCache = {};
// Push subscriptions: endpoint -> { subscription, favorites: string[] }
const pushSubscriptions = new Map();
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
  const { date } = req.query;
  if (!LEAGUES[league]) return res.status(404).json({ error: 'Unknown league' });
  if (date) {
    const games = await fetchGames(league, date);
    return res.json(games);
  }
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

app.get('/api/games/:league/:gameId/boxscore', async (req, res) => {
  const { league, gameId } = req.params;
  if (!LEAGUES[league]) return res.status(404).json({ error: 'Unknown league' });
  try {
    const data = await fetchBoxScore(league, gameId);
    if (!data) return res.status(404).json({ error: 'No box score available' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/standings/:league', async (req, res) => {
  const { league } = req.params;
  if (!LEAGUES[league]) return res.status(404).json({ error: 'Unknown league' });
  try {
    const groups = await fetchLeagueStandings(league);
    if (!groups) return res.status(404).json({ error: 'No standings available' });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/leaders/:league', async (req, res) => {
  const { league } = req.params;
  if (!LEAGUES[league]) return res.status(404).json({ error: 'Unknown league' });
  try {
    const leaders = await fetchLeaders(league);
    res.json(leaders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/h2h/:league/:team1Id/:team2Id', async (req, res) => {
  const { league, team1Id, team2Id } = req.params;
  if (!LEAGUES[league]) return res.status(404).json({ error: 'Unknown league' });
  try {
    const meetings = await fetchHeadToHead(league, team1Id, team2Id);
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/players/search', async (req, res) => {
  const { q, league } = req.query;
  if (!q || q.length < 3) return res.json([]);
  if (league && !LEAGUES[league]) return res.status(404).json({ error: 'Unknown league' });
  try {
    if (league) {
      res.json(await searchPlayers(league, q));
    } else {
      const results = await Promise.allSettled(Object.keys(LEAGUES).map((l) => searchPlayers(l, q)));
      const combined = results
        .flatMap((r) => r.status === 'fulfilled' ? r.value : [])
        .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id && x.league === p.league) === i)
        .slice(0, 20);
      res.json(combined);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/players/:league/:athleteId', async (req, res) => {
  const { league, athleteId } = req.params;
  if (!LEAGUES[league]) return res.status(404).json({ error: 'Unknown league' });
  try {
    const profile = await fetchPlayerStats(league, athleteId);
    if (!profile) return res.status(404).json({ error: 'Player not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/games/:league/:gameId/winprob', async (req, res) => {
  const { league, gameId } = req.params;
  if (!LEAGUES[league]) return res.status(404).json({ error: 'Unknown league' });
  try {
    const data = await fetchWinProbability(league, gameId);
    if (!data) return res.status(404).json({ error: 'No win probability data' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/games/:league/:gameId/news', async (req, res) => {
  const { league, gameId } = req.params;
  if (!LEAGUES[league]) return res.status(404).json({ error: 'Unknown league' });
  try {
    res.json(await fetchGameNews(league, gameId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/games/:league/:gameId/injuries', async (req, res) => {
  const { league, gameId } = req.params;
  if (!LEAGUES[league]) return res.status(404).json({ error: 'Unknown league' });
  try {
    res.json(await fetchGameInjuries(league, gameId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/team/:league/:teamId/roster', async (req, res) => {
  const { league, teamId } = req.params;
  if (!LEAGUES[league]) return res.status(404).json({ error: 'Unknown league' });
  try {
    res.json(await fetchTeamRoster(league, teamId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/games/:league/:gameId/commentary', (req, res) => {
  const feed = commentaryCache[req.params.gameId] || [];
  res.json(feed);
});

app.post('/api/push/subscribe', (req, res) => {
  const { subscription, favorites = [] } = req.body;
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Missing subscription' });
  pushSubscriptions.set(subscription.endpoint, { subscription, favorites });
  res.json({ ok: true });
});

app.delete('/api/push/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) pushSubscriptions.delete(endpoint);
  res.json({ ok: true });
});

app.get('/api/push/vapid-public-key', (_, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY || null });
});

async function sendPush(subscription, payload) {
  if (!webpush) return;
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      pushSubscriptions.delete(subscription.endpoint);
    }
  }
}

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

  // Broadcast key events + push notifications
  for (const event of events) {
    io.emit('key:event', event);

    if (event.type === 'score' && webpush && pushSubscriptions.size > 0 && process.env.VAPID_PUBLIC_KEY) {
      const favKey = `${event.league}-${event.teamId}`;
      const emoji = LEAGUES[event.league]?.emoji || '🏆';
      const payload = {
        title: `${emoji} ${event.abbr} scored!`,
        body: `${event.score.replace('-', ' – ')} · ${event.period}${event.clock ? ' ' + event.clock : ''}`,
        icon: '/favicon.ico',
      };
      for (const { subscription, favorites } of pushSubscriptions.values()) {
        if (favorites.includes(favKey)) sendPush(subscription, payload);
      }
    }
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
