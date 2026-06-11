const LEAGUES = [
  { key: 'favorites', label: 'Favs',  fullLabel: 'Favorites',     logo: null,    emoji: '★' },
  { key: 'nfl',       label: 'NFL',   fullLabel: 'NFL',            logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png' },
  { key: 'nba',       label: 'NBA',   fullLabel: 'NBA',            logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png' },
  { key: 'mlb',       label: 'MLB',   fullLabel: 'MLB',            logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png' },
  { key: 'nhl',       label: 'NHL',   fullLabel: 'NHL',            logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png' },
  { key: 'soccer',    label: 'EPL',   fullLabel: 'Premier League', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png' },
  { key: 'worldcup',  label: 'WC',    fullLabel: 'World Cup',      logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/4.png' },
  { key: 'ncaaf',     label: 'CFB',   fullLabel: 'CFB',            logo: 'https://a.espncdn.com/redesign/assets/img/icons/ESPN-icon-football-college.png' },
  { key: 'ncaab',     label: 'NCAAB', fullLabel: 'NCAAB',          logo: 'https://a.espncdn.com/redesign/assets/img/icons/ESPN-icon-basketball.png' },
  { key: 'ncaaw',     label: 'NCAAW', fullLabel: 'NCAAW',          logo: 'https://a.espncdn.com/redesign/assets/img/icons/ESPN-icon-basketball.png' },
]

export default function SportTabs({ active, onChange }) {
  return (
    <div className="flex gap-0.5 overflow-x-auto scrollbar-hide" style={{ borderBottom: '1px solid var(--border)' }}>
      {LEAGUES.map(({ key, label, fullLabel, logo, emoji }) => {
        const isActive = active === key
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-2.5 text-xs sm:text-sm font-medium shrink-0 transition-colors relative whitespace-nowrap"
            style={{ color: isActive ? 'var(--accent)' : 'var(--muted)' }}
            title={fullLabel}
          >
            {logo ? (
              <img
                src={logo}
                alt={fullLabel}
                className="w-4 h-4 sm:w-5 sm:h-5 object-contain shrink-0"
                style={{ opacity: isActive ? 1 : 0.5 }}
              />
            ) : (
              <span>{emoji}</span>
            )}
            <span className="hidden sm:inline">{fullLabel}</span>
            <span className="sm:hidden">{label}</span>
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: 'var(--accent)' }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
