import { useFavorites } from '../contexts/FavoritesContext'
import { useAuth } from '../contexts/AuthContext'

const STATUS_COLORS = { live: 'var(--green)', final: 'var(--muted)', scheduled: 'var(--yellow)' }

function formatGameTime(startTime) {
  const gameDate = new Date(startTime)
  const now = new Date()
  const isToday = gameDate.toDateString() === now.toDateString()
  if (isToday) {
    return gameDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  return gameDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' · ' + gameDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function TeamRow({ team, isWinner, showLogo = true }) {
  return (
    <div className="flex items-center gap-2.5">
      {showLogo && team.logo && (
        <img src={team.logo} alt={team.abbr} className="w-8 h-8 object-contain shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isWinner ? '' : 'opacity-70'}`} style={{ color: 'var(--fg)' }}>
          {team.abbr}
        </p>
        <p className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>{team.record}</p>
      </div>
      <span className={`text-xl font-black tabular-nums ${isWinner ? '' : 'opacity-60'}`} style={{ color: 'var(--fg)' }}>
        {team.score}
      </span>
    </div>
  )
}

export default function GameCard({ game, onClick, onAuthRequired }) {
  const { user } = useAuth()
  const { isFavorite, toggle } = useFavorites()

  const isLive = game.status === 'live'
  const isFinal = game.status === 'final'
  const homeWins = isFinal && game.homeTeam.score > game.awayTeam.score
  const awayWins = isFinal && game.awayTeam.score > game.homeTeam.score
  const homeIsFav = isFavorite(game.homeTeam.id)
  const awayIsFav = isFavorite(game.awayTeam.id)
  const isHighlighted = homeIsFav || awayIsFav

  function handleFav(e, teamId) {
    e.stopPropagation()
    if (!user) { onAuthRequired?.(); return }
    toggle(teamId)
  }

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer transition-all hover:translate-y-[-2px]"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${isHighlighted ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: isHighlighted ? '0 0 0 1px var(--accent)' : 'none',
      }}
      onClick={onClick}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-1.5">
          {isLive && <span className="live-dot" />}
          <span className="text-[11px] font-semibold" style={{ color: STATUS_COLORS[game.status] }}>
            {isLive ? `${game.periodLabel} ${game.clock}`.trim() : isFinal ? 'Final' : formatGameTime(game.startTime)}
          </span>
        </div>
        {game.venue && (
          <span className="text-[10px] truncate max-w-[120px]" style={{ color: 'var(--muted)' }}>{game.venue}</span>
        )}
      </div>

      {/* Teams */}
      <div className="px-3 py-3 space-y-2">
        <div className="flex items-center gap-1">
          <div className="flex-1"><TeamRow team={game.awayTeam} isWinner={awayWins} /></div>
          <button
            className="ml-1 text-base opacity-40 hover:opacity-100 transition-opacity shrink-0"
            style={{ color: awayIsFav ? 'var(--accent)' : 'var(--muted)' }}
            onClick={(e) => handleFav(e, game.awayTeam.id)}
            title={awayIsFav ? 'Remove favorite' : 'Add to favorites'}
          >
            {awayIsFav ? '★' : '☆'}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex-1"><TeamRow team={game.homeTeam} isWinner={homeWins} /></div>
          <button
            className="ml-1 text-base opacity-40 hover:opacity-100 transition-opacity shrink-0"
            style={{ color: homeIsFav ? 'var(--accent)' : 'var(--muted)' }}
            onClick={(e) => handleFav(e, game.homeTeam.id)}
            title={homeIsFav ? 'Remove favorite' : 'Add to favorites'}
          >
            {homeIsFav ? '★' : '☆'}
          </button>
        </div>
      </div>

      {/* Last play */}
      {game.lastPlay && isLive && (
        <div className="px-3 pb-3">
          <p className="text-[11px] leading-snug line-clamp-2" style={{ color: 'var(--muted)' }}>
            {game.lastPlay}
          </p>
        </div>
      )}
    </div>
  )
}
