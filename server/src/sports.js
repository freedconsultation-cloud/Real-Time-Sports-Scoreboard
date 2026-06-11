// ESPN unofficial scoreboard API — no key required
const ESPN_BASE = 'http://site.api.espn.com/apis/site/v2/sports';

export const LEAGUES = {
  nfl:    { sport: 'football',   league: 'nfl',                       label: 'NFL',            emoji: '🏈' },
  nba:    { sport: 'basketball', league: 'nba',                       label: 'NBA',            emoji: '🏀' },
  mlb:    { sport: 'baseball',   league: 'mlb',                       label: 'MLB',            emoji: '⚾' },
  nhl:    { sport: 'hockey',     league: 'nhl',                       label: 'NHL',            emoji: '🏒' },
  soccer: { sport: 'soccer',     league: 'eng.1',                     label: 'Premier League', emoji: '⚽' },
  worldcup: { sport: 'soccer',   league: 'fifa.world',                label: 'World Cup',      emoji: '🏆' },
  ncaaf:  { sport: 'football',   league: 'college-football',          label: 'CFB',            emoji: '🏟️' },
  ncaab:  { sport: 'basketball', league: 'mens-college-basketball',   label: 'NCAAB',          emoji: '🏀' },
  ncaaw:  { sport: 'basketball', league: 'womens-college-basketball', label: 'NCAAW',          emoji: '🏀' },
};

function normalizeStatus(espnStatus) {
  const name = espnStatus?.type?.name || '';
  if (name.includes('FINAL') || name.includes('COMPLETE')) return 'final';
  if (name.includes('IN_PROGRESS') || name.includes('HALFTIME') || name.includes('END_')) return 'live';
  return 'scheduled';
}

function normalizeGame(event, leagueKey) {
  const comp = event.competitions?.[0];
  if (!comp) return null;

  const [c1, c2] = comp.competitors || [];
  const home = c1?.homeAway === 'home' ? c1 : c2;
  const away = c1?.homeAway === 'away' ? c1 : c2;
  if (!home || !away) return null;

  const status = normalizeStatus(event.status);
  const period = event.status?.period || 0;
  const isTimed = LEAGUES[leagueKey]?.sport !== 'baseball';
  const clock = isTimed ? (event.status?.displayClock || '') : '';
  const lastPlay = comp.situation?.lastPlay?.text || comp.notes?.[0]?.headline || '';

  const leagueMeta = LEAGUES[leagueKey];
  const periodLabel = getPeriodLabel(period, leagueMeta?.sport, status, event.status?.type?.description, event.status?.type?.detail);

  return {
    id: event.id,
    league: leagueKey,
    name: event.name,
    status,
    period,
    periodLabel,
    clock,
    lastPlay,
    startTime: event.date,
    venue: comp.venue?.fullName || '',
    odds: extractOdds(comp, home, away),
    broadcasts: extractBroadcasts(comp),
    homeTeam: {
      id: home.team?.id,
      name: home.team?.displayName,
      abbr: home.team?.abbreviation,
      logo: home.team?.logo,
      color: home.team?.color ? `#${home.team.color}` : null,
      score: parseInt(home.score || 0, 10),
      record: home.records?.[0]?.summary || '',
      linescores: (home.linescores || []).map((l) => Math.round(l.value ?? l)),
    },
    awayTeam: {
      id: away.team?.id,
      name: away.team?.displayName,
      abbr: away.team?.abbreviation,
      logo: away.team?.logo,
      color: away.team?.color ? `#${away.team.color}` : null,
      score: parseInt(away.score || 0, 10),
      record: away.records?.[0]?.summary || '',
      linescores: (away.linescores || []).map((l) => Math.round(l.value ?? l)),
    },
    leaders: extractLeaders(comp),
  };
}

function getPeriodLabel(period, sport, status, description, detail) {
  if (status === 'final') return description || 'Final';
  if (status === 'scheduled') return '';
  if (!period) return description || 'Live';
  if (sport === 'football') return `Q${period}`;
  if (sport === 'basketball') return `Q${period}`;
  if (sport === 'hockey') return `P${period}`;
  if (sport === 'soccer') return description || 'Live';
  if (sport === 'baseball') {
    const d = (detail || '').toLowerCase();
    const arrow = d.startsWith('top') ? '▲' : d.startsWith('bottom') ? '▼' : '—';
    return `${arrow} Inning ${period}`;
  }
  return `${period}`;
}

function extractBroadcasts(comp) {
  const geo = comp.geoBroadcasts || [];
  const names = geo
    .filter((b) => b.media?.shortName)
    .map((b) => b.media.shortName)
  // fallback to older broadcasts array
  if (!names.length) {
    (comp.broadcasts || []).forEach((b) => {
      (b.names || []).forEach((n) => { if (n) names.push(n) })
    })
  }
  return [...new Set(names)] // dedupe
}

function extractOdds(comp, home, away) {
  const o = comp.odds?.[0];
  if (!o) return null;

  const spread = o.spread ?? null;
  const overUnder = o.overUnder ?? null;
  const homeML = o.homeTeamOdds?.moneyLine ?? null;
  const awayML = o.awayTeamOdds?.moneyLine ?? null;

  if (spread === null && overUnder === null && homeML === null) return null;

  // Determine which team is favored (negative spread = home favorite)
  const homeFavored = spread !== null ? spread < 0 : null;

  return {
    spread,
    overUnder,
    homeML,
    awayML,
    homeFavored,
  };
}

function extractLeaders(comp) {
  const leaders = [];
  (comp.leaders || []).slice(0, 2).forEach((cat) => {
    const leader = cat.leaders?.[0];
    if (leader) {
      leaders.push({
        category: cat.displayName,
        athlete: leader.athlete?.displayName,
        stat: leader.displayValue,
      });
    }
  });
  return leaders;
}

export async function fetchTeams(leagueKey) {
  const meta = LEAGUES[leagueKey];
  if (!meta) return [];
  try {
    const url = `${ESPN_BASE}/${meta.sport}/${meta.league}/teams?limit=200`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    const raw = data?.sports?.[0]?.leagues?.[0]?.teams || [];
    return raw.map(({ team: t }) => ({
      id: t.id,
      name: t.displayName,
      abbr: t.abbreviation,
      logo: t.logos?.[0]?.href || null,
      league: leagueKey,
      leagueLabel: meta.label,
    })).filter((t) => t.name);
  } catch {
    return [];
  }
}

export async function fetchTeamProfile(leagueKey, teamId) {
  const meta = LEAGUES[leagueKey];
  if (!meta) return null;
  const base = `${ESPN_BASE}/${meta.sport}/${meta.league}`;

  const [teamRes, schedRes, standingsRes] = await Promise.all([
    fetch(`${base}/teams/${teamId}`, { signal: AbortSignal.timeout(8000) }),
    fetch(`${base}/teams/${teamId}/schedule`, { signal: AbortSignal.timeout(8000) }),
    fetch(`${base}/standings`, { signal: AbortSignal.timeout(8000) }),
  ]);

  const teamData = teamRes.ok ? await teamRes.json() : null;
  const schedData = schedRes.ok ? await schedRes.json() : null;
  const standingsData = standingsRes.ok ? await standingsRes.json() : null;

  const t = teamData?.team;
  if (!t) return null;

  const record = t.record?.items?.[0]?.summary || '';

  const events = (schedData?.events || []).map((event) => {
    const comp = event.competitions?.[0];
    if (!comp) return null;
    const us = comp.competitors?.find((c) => c.team?.id === String(teamId));
    const them = comp.competitors?.find((c) => c.team?.id !== String(teamId));
    if (!us || !them) return null;
    const completed = !!comp.status?.type?.completed;
    const broadcasts = (comp.geoBroadcasts || [])
      .map((b) => b.media?.shortName).filter(Boolean);
    return {
      id: event.id,
      date: event.date,
      isHome: us.homeAway === 'home',
      completed,
      winner: completed ? !!us.winner : null,
      score: completed ? us.score : null,
      oppScore: completed ? them.score : null,
      opponent: {
        id: them.team?.id,
        name: them.team?.displayName,
        abbr: them.team?.abbreviation,
        logo: them.team?.logos?.[0]?.href || them.team?.logo || null,
      },
      broadcasts: [...new Set(broadcasts)],
    };
  }).filter(Boolean);

  const past = events.filter((g) => g.completed).reverse();
  const upcoming = events.filter((g) => !g.completed);

  const last10 = past.slice(0, 10);
  const l10W = last10.filter((g) => g.winner).length;
  const l10L = last10.filter((g) => !g.winner).length;

  return {
    id: t.id,
    name: t.displayName,
    abbr: t.abbreviation,
    logo: t.logos?.[0]?.href || null,
    color: t.color ? `#${t.color}` : null,
    record,
    last10: `${l10W}-${l10L}`,
    pastGames: past.slice(0, 10),
    upcomingGames: upcoming.slice(0, 8),
    standings: extractStandingsGroup(standingsData, String(teamId), meta.sport),
  };
}

// Recursively search ESPN's nested standings tree for the group containing teamId
function findStandingsGroup(node, teamId) {
  if (node.standings?.entries) {
    const found = node.standings.entries.some((e) => e.team?.id === teamId);
    if (found) return { name: node.name || node.abbreviation || '', entries: node.standings.entries };
  }
  for (const child of (node.children || [])) {
    const result = findStandingsGroup(child, teamId);
    if (result) return result;
  }
  return null;
}

function extractStandingsGroup(data, teamId, sport) {
  if (!data) return null;
  const group = findStandingsGroup(data, teamId);
  if (!group) return null;

  const usePts = sport === 'hockey' || sport === 'soccer';

  const entries = group.entries.map((entry) => {
    const statsMap = {};
    for (const s of (entry.stats || [])) statsMap[s.name] = s.value;

    const wins = statsMap.wins ?? statsMap.gamesWon ?? 0;
    const losses = statsMap.losses ?? statsMap.gamesLost ?? 0;
    const ties = statsMap.ties ?? statsMap.gamesTied ?? statsMap.overtimeLosses ?? null;
    const pct = statsMap.winPercent != null
      ? Number(statsMap.winPercent).toFixed(3).replace(/^0/, '')
      : null;
    const pts = statsMap.points != null ? Math.round(statsMap.points) : null;
    const gb = statsMap.gamesBehind != null ? statsMap.gamesBehind : null;

    return {
      teamId: entry.team?.id,
      abbr: entry.team?.abbreviation,
      name: entry.team?.displayName,
      logo: entry.team?.logos?.[0]?.href || null,
      wins: Math.round(wins),
      losses: Math.round(losses),
      ties: ties != null ? Math.round(ties) : null,
      pct,
      pts,
      gb,
      usePts,
    };
  });

  return { groupName: group.name, entries };
}

export async function fetchGames(leagueKey) {
  const meta = LEAGUES[leagueKey];
  if (!meta) return [];
  try {
    const url = `${ESPN_BASE}/${meta.sport}/${meta.league}/scoreboard`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.events || []).map((e) => normalizeGame(e, leagueKey)).filter(Boolean);
  } catch {
    return [];
  }
}

// Only show the most useful stat categories per sport — football has 10+ which is too much
const PRIORITY_CATEGORIES = {
  football: ['passing', 'rushing', 'receiving', 'defensive'],
};

export async function fetchBoxScore(leagueKey, gameId) {
  const meta = LEAGUES[leagueKey];
  if (!meta) return null;
  try {
    const url = `${ESPN_BASE}/${meta.sport}/${meta.league}/summary?event=${gameId}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const data = await res.json();

    const priority = PRIORITY_CATEGORIES[meta.sport] || null;

    const teams = (data.boxscore?.players || []).map((teamEntry) => {
      let cats = (teamEntry.statistics || []).map((cat) => {
        const athletes = (cat.athletes || [])
          .filter((a) => !a.didNotPlay && a.active !== false)
          .filter((a) => (a.stats || []).some((s) => s !== '--' && s !== '' && s !== '0:00'))
          .map((a) => ({
            name: a.athlete?.displayName || '',
            jersey: a.athlete?.jersey || '',
            position: a.athlete?.position?.abbreviation || '',
            starter: a.starter ?? true,
            stats: a.stats || [],
          }))
          .slice(0, 12);
        if (!athletes.length) return null;
        return { name: cat.name, displayName: cat.displayName || cat.name, labels: cat.labels || [], athletes };
      }).filter(Boolean);

      if (priority) {
        cats = cats.filter((c) => priority.includes(c.name));
        cats.sort((a, b) => priority.indexOf(a.name) - priority.indexOf(b.name));
      }

      return { teamId: teamEntry.team?.id, teamName: teamEntry.team?.displayName, teamAbbr: teamEntry.team?.abbreviation, categories: cats };
    }).filter((t) => t.categories.length > 0);

    return { teams };
  } catch {
    return null;
  }
}

// ── Full league standings ──────────────────────────────────────

function collectAllGroups(node, usePts, groups) {
  if (node.standings?.entries?.length) {
    groups.push({
      name: node.name || node.abbreviation || '',
      entries: node.standings.entries.map((entry) => {
        const sm = {};
        for (const s of (entry.stats || [])) sm[s.name] = s.value;
        const wins = sm.wins ?? sm.gamesWon ?? 0;
        const losses = sm.losses ?? sm.gamesLost ?? 0;
        const ties = sm.ties ?? sm.gamesTied ?? sm.overtimeLosses ?? null;
        const pct = sm.winPercent != null ? Number(sm.winPercent).toFixed(3).replace(/^0/, '') : null;
        const pts = sm.points != null ? Math.round(sm.points) : null;
        const gb = sm.gamesBehind != null ? sm.gamesBehind : null;
        return {
          teamId: entry.team?.id,
          abbr: entry.team?.abbreviation,
          name: entry.team?.displayName,
          logo: entry.team?.logos?.[0]?.href || null,
          wins: Math.round(wins),
          losses: Math.round(losses),
          ties: ties != null ? Math.round(ties) : null,
          pct, pts, gb, usePts,
        };
      }),
    });
  }
  for (const child of (node.children || [])) collectAllGroups(child, usePts, groups);
}

export async function fetchLeagueStandings(leagueKey) {
  const meta = LEAGUES[leagueKey];
  if (!meta) return null;
  try {
    const url = `${ESPN_BASE}/${meta.sport}/${meta.league}/standings`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const usePts = meta.sport === 'hockey' || meta.sport === 'soccer';
    const groups = [];
    collectAllGroups(data, usePts, groups);
    return groups.length ? groups : null;
  } catch {
    return null;
  }
}

// ── Statistical leaders ────────────────────────────────────────

export async function fetchLeaders(leagueKey) {
  const meta = LEAGUES[leagueKey];
  if (!meta) return [];
  try {
    const url = `${ESPN_BASE}/${meta.sport}/${meta.league}/leaders`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.categories || []).slice(0, 8).map((cat) => ({
      category: cat.displayName || cat.name,
      leaders: (cat.leaders || []).slice(0, 5).map((l) => ({
        name: l.athlete?.displayName,
        teamAbbr: l.team?.abbreviation,
        teamColor: l.team?.color ? `#${l.team.color}` : null,
        logo: l.team?.logos?.[0]?.href || null,
        headshot: l.athlete?.headshot?.href || null,
        value: l.displayValue,
        athleteId: l.athlete?.id,
      })),
    })).filter((c) => c.leaders.length > 0 && c.leaders[0].name);
  } catch {
    return [];
  }
}

// ── Head-to-head history ───────────────────────────────────────

export async function fetchHeadToHead(leagueKey, team1Id, team2Id) {
  const meta = LEAGUES[leagueKey];
  if (!meta) return [];
  try {
    const url = `${ESPN_BASE}/${meta.sport}/${meta.league}/teams/${team1Id}/schedule`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.events || [])
      .filter((event) => {
        const comp = event.competitions?.[0];
        return comp?.status?.type?.completed &&
          comp.competitors?.some((c) => c.team?.id === String(team2Id));
      })
      .reverse()
      .slice(0, 10)
      .map((event) => {
        const comp = event.competitions?.[0];
        const t1 = comp.competitors.find((c) => c.team?.id === String(team1Id));
        const t2 = comp.competitors.find((c) => c.team?.id === String(team2Id));
        return {
          date: event.date,
          season: event.season?.year,
          t1Abbr: t1?.team?.abbreviation,
          t2Abbr: t2?.team?.abbreviation,
          t1Score: Number(t1?.score || 0),
          t2Score: Number(t2?.score || 0),
          t1Won: !!t1?.winner,
          t1Home: t1?.homeAway === 'home',
        };
      });
  } catch {
    return [];
  }
}

// ── Player search & stats ──────────────────────────────────────

export async function searchPlayers(leagueKey, query) {
  const meta = LEAGUES[leagueKey];
  if (!meta) return [];
  try {
    const url = `${ESPN_BASE}/${meta.sport}/${meta.league}/athletes?active=true&limit=20&search=${encodeURIComponent(query)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    const raw = data.athletes || data.items || [];
    return raw.slice(0, 10).map((a) => ({
      id: a.id,
      name: a.displayName || `${a.firstName || ''} ${a.lastName || ''}`.trim(),
      position: a.position?.abbreviation || '',
      team: a.team?.shortDisplayName || a.team?.displayName || '',
      teamAbbr: a.team?.abbreviation || '',
      teamColor: a.team?.color ? `#${a.team.color}` : null,
      logo: a.team?.logos?.[0]?.href || null,
      headshot: a.headshot?.href || null,
      jersey: a.jersey || '',
      league: leagueKey,
    })).filter((a) => a.name);
  } catch {
    return [];
  }
}

export async function fetchPlayerStats(leagueKey, athleteId) {
  const meta = LEAGUES[leagueKey];
  if (!meta) return null;
  try {
    const [bioRes, statsRes] = await Promise.allSettled([
      fetch(`${ESPN_BASE}/${meta.sport}/${meta.league}/athletes/${athleteId}`, { signal: AbortSignal.timeout(8000) }),
      fetch(`${ESPN_BASE}/${meta.sport}/${meta.league}/athletes/${athleteId}/statistics`, { signal: AbortSignal.timeout(8000) }),
    ]);
    const bioData = bioRes.status === 'fulfilled' && bioRes.value.ok ? await bioRes.value.json() : null;
    const statsData = statsRes.status === 'fulfilled' && statsRes.value.ok ? await statsRes.value.json() : null;
    const a = bioData?.athlete;
    if (!a) return null;
    const categories = (statsData?.statistics?.splits?.categories || []).map((cat) => ({
      name: cat.displayName || cat.name,
      stats: (cat.stats || []).map((s, i) => ({
        label: (cat.labels || cat.names || [])[i] || s.name || '',
        value: s.displayValue || String(s.value ?? ''),
      })).filter((s) => s.label && s.value && s.value !== '--'),
    })).filter((c) => c.stats.length > 0);
    return {
      id: a.id,
      name: a.displayName,
      position: a.position?.displayName || '',
      jersey: a.jersey || '',
      team: a.team?.displayName || '',
      teamAbbr: a.team?.abbreviation || '',
      teamColor: a.team?.color ? `#${a.team.color}` : null,
      logo: a.team?.logos?.[0]?.href || null,
      headshot: a.headshot?.href || null,
      height: a.displayHeight || '',
      weight: a.displayWeight || '',
      age: a.age || null,
      experience: a.experience?.displayValue || '',
      categories,
    };
  } catch {
    return null;
  }
}

// ── Win probability ────────────────────────────────────────────

export async function fetchWinProbability(leagueKey, gameId) {
  const meta = LEAGUES[leagueKey];
  if (!meta) return null;
  try {
    const url = `${ESPN_BASE}/${meta.sport}/${meta.league}/summary?event=${gameId}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const wpArr = data.winprobability || data.winProbability || [];
    const latest = wpArr[wpArr.length - 1];
    let homeWinPct = typeof latest?.homeWinPercentage === 'number'
      ? Math.round(latest.homeWinPercentage * 100)
      : null;
    if (homeWinPct === null) {
      const pc = data.pickcenter?.[0];
      const raw = pc?.homeTeamOdds?.winPercentage;
      if (raw != null) {
        const n = Number(raw);
        homeWinPct = Math.round(n > 1 ? n : n * 100);
      }
    }
    return homeWinPct != null ? { homeWinPct, awayWinPct: 100 - homeWinPct } : null;
  } catch {
    return null;
  }
}

// Detect meaningful score changes between two snapshots
export function detectEvents(oldGames, newGames) {
  const events = [];
  const oldMap = Object.fromEntries(oldGames.map((g) => [g.id, g]));

  for (const game of newGames) {
    const prev = oldMap[game.id];
    if (!prev || game.status === 'scheduled') continue;

    const homeScored = game.homeTeam.score - prev.homeTeam.score;
    const awayScored = game.awayTeam.score - prev.awayTeam.score;

    if (homeScored > 0) {
      events.push({
        gameId: game.id,
        type: 'score',
        team: game.homeTeam.name,
        abbr: game.homeTeam.abbr,
        teamId: game.homeTeam.id,
        points: homeScored,
        score: `${game.homeTeam.score}-${game.awayTeam.score}`,
        period: game.periodLabel,
        clock: game.clock,
        league: game.league,
      });
    }
    if (awayScored > 0) {
      events.push({
        gameId: game.id,
        type: 'score',
        team: game.awayTeam.name,
        abbr: game.awayTeam.abbr,
        teamId: game.awayTeam.id,
        points: awayScored,
        score: `${game.awayTeam.score}-${game.homeTeam.score}`,
        period: game.periodLabel,
        clock: game.clock,
        league: game.league,
      });
    }
    if (prev.status !== 'final' && game.status === 'final') {
      events.push({ gameId: game.id, type: 'final', game, league: game.league });
    }
  }
  return events;
}
