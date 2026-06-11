const LEAGUES = [
  { key: 'favorites', label: 'Favorites', emoji: '★' },
  { key: 'nfl',       label: 'NFL',            emoji: '🏈' },
  { key: 'nba',       label: 'NBA',            emoji: '🏀' },
  { key: 'mlb',       label: 'MLB',            emoji: '⚾' },
  { key: 'nhl',       label: 'NHL',            emoji: '🏒' },
  { key: 'soccer',    label: 'Premier League', emoji: '⚽' },
  { key: 'worldcup',  label: 'World Cup',      emoji: '🏆' },
  { key: 'ncaaf',     label: 'CFB',            emoji: '🏟️' },
  { key: 'ncaab',     label: 'NCAAB',          emoji: '🏀' },
  { key: 'ncaaw',     label: 'NCAAW',          emoji: '🏀' },
]

export default function SportTabs({ active, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide" style={{ borderBottom: '1px solid var(--border)' }}>
      {LEAGUES.map(({ key, label, emoji }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium shrink-0 transition-colors relative"
          style={{ color: active === key ? (key === 'favorites' ? 'var(--accent)' : 'var(--accent)') : 'var(--muted)' }}
        >
          <span style={{ color: key === 'favorites' && active !== key ? 'var(--muted)' : undefined }}>{emoji}</span>
          <span>{label}</span>
          {active === key && (
            <span
              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
              style={{ background: 'var(--accent)' }}
            />
          )}
        </button>
      ))}
    </div>
  )
}
