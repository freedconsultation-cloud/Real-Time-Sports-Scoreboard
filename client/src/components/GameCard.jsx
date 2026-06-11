import { useState } from 'react'
import { useFavorites } from '../contexts/FavoritesContext'
import { useAuth } from '../contexts/AuthContext'
import TeamModal from './TeamModal'

const STATUS_COLORS = { live: 'var(--green)', final: 'var(--muted)', scheduled: 'var(--yellow)' }

function formatML(ml) {
  if (ml === null || ml === undefined) return null
  return ml > 0 ? `+${ml}` : `${ml}`
}

function OddsRow({ odds, awayAbbr, homeAbbr }) {
  if (!odds) return null
  const { spread, overUnder, homeML, awayML, homeFavored } = odds

  const spreadStr = spread !== null
    ? `${homeFavored ? homeAbbr : awayAbbr} ${spread > 0 ? '+' : ''}${spread}`
    : null
  const ouStr = overUnder !== null ? `O/U ${overUnder}` : null
  const mlStr = (homeML !== null && awayML !== null)
    ? `${awayAbbr} ${formatML(awayML)} / ${homeAbbr} ${formatML(homeML)}`
    : null

  const parts = [spreadStr, ouStr, mlStr].filter(Boolean)
  if (!parts.length) return null

  return (
    <div
      className="px-3 pb-2.5 pt-0"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      <p className="text-[10px] leading-snug mt-2" style={{ color: 'var(--muted)' }}>
        {parts.join(' · ')}
      </p>
    </div>
  )
}

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

function TeamRow({ team, isWinner, onTeamClick }) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        className="flex items-center gap-2.5 flex-1 min-w-0 text-left group"
        onClick={onTeamClick}
        title={`View ${team.abbr} profile`}
      >
        {team.logo && (
          <img
            src={team.logo}
            alt={team.abbr}
            className="w-8 h-8 object-contain shrink-0 transition-transform group-hover:scale-110"
          />
        )}
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate group-hover:underline ${isWinner ? '' : 'opacity-70'}`} style={{ color: 'var(--fg)' }}>
            {team.abbr}
          </p>
          <p className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>{team.record}</p>
        </div>
      </button>
      <span className={`text-xl font-black tabular-nums ${isWinner ? '' : 'opacity-60'}`} style={{ color: 'var(--fg)' }}>
        {team.score}
      </span>
    </div>
  )
}

export default function GameCard({ game, onClick, onAuthRequired }) {
  const { user } = useAuth()
  const { isFavorite, toggle } = useFavorites()
  const [teamModal, setTeamModal] = useState(null) // { id, name }

  const isLive = game.status === 'live'
  const isFinal = game.status === 'final'
  const homeWins = isFinal && game.homeTeam.score > game.awayTeam.score
  const awayWins = isFinal && game.awayTeam.score > game.homeTeam.score
  const homeFavId = `${game.league}-${game.homeTeam.id}`
  const awayFavId = `${game.league}-${game.awayTeam.id}`
  const homeIsFav = isFavorite(homeFavId)
  const awayIsFav = isFavorite(awayFavId)
  const isHighlighted = homeIsFav || awayIsFav

  function handleFav(e, favId) {
    e.stopPropagation()
    if (!user) { onAuthRequired?.(); return }
    toggle(favId)
  }

  function openTeam(e, team) {
    e.stopPropagation()
    setTeamModal({ id: team.id, name: team.abbr })
  }

  return (
    <>
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
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isLive && <span className="live-dot shrink-0" />}
          <span className="text-[11px] font-semibold truncate" style={{ color: STATUS_COLORS[game.status] }}>
            {isLive ? `${game.periodLabel} ${game.clock}`.trim() : isFinal ? 'Final' : formatGameTime(game.startTime)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {game.broadcasts?.length > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded whitespace-nowrap" style={{ background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)' }}>
              {game.broadcasts[0]}
            </span>
          )}
          {game.venue && (
            <span className="text-[10px] truncate max-w-[80px] hidden sm:block" style={{ color: 'var(--muted)' }}>{game.venue}</span>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="px-3 py-3 space-y-2">
        <div className="flex items-center gap-1">
          <div className="flex-1">
            <TeamRow team={game.awayTeam} isWinner={awayWins} onTeamClick={(e) => openTeam(e, game.awayTeam)} />
          </div>
          <button
            className="ml-1 text-base opacity-40 hover:opacity-100 transition-opacity shrink-0"
            style={{ color: awayIsFav ? 'var(--accent)' : 'var(--muted)' }}
            onClick={(e) => handleFav(e, awayFavId)}
            title={awayIsFav ? 'Remove favorite' : 'Add to favorites'}
          >
            {awayIsFav ? '★' : '☆'}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex-1">
            <TeamRow team={game.homeTeam} isWinner={homeWins} onTeamClick={(e) => openTeam(e, game.homeTeam)} />
          </div>
          <button
            className="ml-1 text-base opacity-40 hover:opacity-100 transition-opacity shrink-0"
            style={{ color: homeIsFav ? 'var(--accent)' : 'var(--muted)' }}
            onClick={(e) => handleFav(e, homeFavId)}
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

      {/* Odds — scheduled games only */}
      {game.status === 'scheduled' && (
        <OddsRow odds={game.odds} awayAbbr={game.awayTeam.abbr} homeAbbr={game.homeTeam.abbr} />
      )}
    </div>

    {teamModal && (
      <TeamModal
        league={game.league}
        teamId={teamModal.id}
        teamName={teamModal.name}
        onClose={() => setTeamModal(null)}
      />
    )}
    </>
  )
}
