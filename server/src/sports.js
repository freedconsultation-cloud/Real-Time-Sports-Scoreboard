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
