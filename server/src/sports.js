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
  const clock = event.status?.displayClock || '';
  const lastPlay = comp.situation?.lastPlay?.text || comp.notes?.[0]?.headline || '';

  const leagueMeta = LEAGUES[leagueKey];
  const periodLabel = getPeriodLabel(period, leagueMeta?.sport, status, event.status?.type?.description);

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
    homeTeam: {
      id: home.team?.id,
      name: home.team?.displayName,
      abbr: home.team?.abbreviation,
      logo: home.team?.logo,
      color: home.team?.color ? `#${home.team.color}` : null,
      score: parseInt(home.score || 0, 10),
      record: home.records?.[0]?.summary || '',
    },
    awayTeam: {
      id: away.team?.id,
      name: away.team?.displayName,
      abbr: away.team?.abbreviation,
      logo: away.team?.logo,
      color: away.team?.color ? `#${away.team.color}` : null,
      score: parseInt(away.score || 0, 10),
      record: away.records?.[0]?.summary || '',
    },
    leaders: extractLeaders(comp),
  };
}

function getPeriodLabel(period, sport, status, description) {
  if (status === 'final') return description || 'Final';
  if (status === 'scheduled') return '';
  if (!period) return description || 'Live';
  if (sport === 'football') return `Q${period}`;
  if (sport === 'basketball') return `Q${period}`;
  if (sport === 'baseball') return `Inn. ${period}`;
  if (sport === 'hockey') return `P${period}`;
  if (sport === 'soccer') return description || 'Live';
  return `${period}`;
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
