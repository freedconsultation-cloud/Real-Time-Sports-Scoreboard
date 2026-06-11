const LEAGUES = [
  { key: 'favorites',  label: 'Favs',    fullLabel: 'Favorites',      emoji: '★' },
  { key: 'nfl',        label: 'NFL',     fullLabel: 'NFL',             emoji: '🏈' },
  { key: 'nba',        label: 'NBA',     fullLabel: 'NBA',             emoji: '🏀' },
  { key: 'mlb',        label: 'MLB',     fullLabel: 'MLB',             emoji: '⚾' },
  { key: 'nhl',        label: 'NHL',     fullLabel: 'NHL',             emoji: '🏒' },
  { key: 'soccer',     label: 'EPL',     fullLabel: 'Premier League',  emoji: '⚽' },
  { key: 'worldcup',   label: 'WC',      fullLabel: 'World Cup',       emoji: '🏆' },
  { key: 'ncaaf',      label: 'CFB',     fullLabel: 'CFB',             emoji: '🏟️' },
  { key: 'ncaab',      label: 'NCAAB',   fullLabel: 'NCAAB',           emoji: '🏀' },
  { key: 'ncaaw',      label: 'NCAAW',   fullLabel: 'NCAAW',           emoji: '🏀' },
]

export default function SportTabs({ active, onChange }) {
  return (
    <div className="flex gap-0.5 overflow-x-auto scrollbar-hide" style={{ borderBottom: '1px solid var(--border)' }}>
      {LEAGUES.map(({ key, label, fullLabel, emoji }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium shrink-0 transition-colors relative whitespace-nowrap"
          style={{ color: active === key ? 'var(--accent)' : 'var(--muted)' }}
          title={fullLabel}
        >
          <span>{emoji}</span>
          <span className="hidden sm:inline">{fullLabel}</span>
          <span className="sm:hidden">{label}</span>
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
