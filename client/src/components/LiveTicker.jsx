import { useSocket } from '../contexts/SocketContext'

const ALL_LEAGUES = ['nfl', 'nba', 'mlb', 'nhl', 'soccer', 'worldcup', 'ncaaf', 'ncaab', 'ncaaw']
const EMOJI = { nfl: '🏈', nba: '🏀', mlb: '⚾', nhl: '🏒', soccer: '⚽', worldcup: '🏆', ncaaf: '🏟️', ncaab: '🏀', ncaaw: '🏀' }

export default function LiveTicker() {
  const { gamesByLeague } = useSocket()
  const live = ALL_LEAGUES.flatMap((l) => (gamesByLeague[l] || []).filter((g) => g.status === 'live'))
  if (!live.length) return null

  // Duplicate so the -50% translate creates a seamless loop
  const items = [...live, ...live]
  const duration = Math.max(20, live.length * 10)

  return (
    <div
      className="overflow-hidden py-1.5"
      style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}
    >
      <div
        className="flex gap-8 whitespace-nowrap"
        style={{ animation: `ticker ${duration}s linear infinite` }}
      >
        {items.map((game, i) => (
          <span
            key={`${game.id}-${i}`}
            className="inline-flex items-center gap-1.5 text-xs shrink-0"
          >
            <span>{EMOJI[game.league]}</span>
            <span style={{ color: 'var(--muted)' }}>{game.awayTeam.abbr}</span>
            <span className="font-black tabular-nums" style={{ color: 'var(--fg)' }}>
              {game.awayTeam.score}
            </span>
            <span style={{ color: 'var(--muted)' }}>–</span>
            <span className="font-black tabular-nums" style={{ color: 'var(--fg)' }}>
              {game.homeTeam.score}
            </span>
            <span style={{ color: 'var(--muted)' }}>{game.homeTeam.abbr}</span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(52,211,153,0.12)', color: 'var(--green)' }}
            >
              {game.periodLabel}{game.clock ? ` ${game.clock}` : ''}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
