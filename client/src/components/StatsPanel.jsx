function StatRow({ player, stat, category }) {
  return (
    <div className="flex items-center gap-2 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: 'var(--fg)' }}>{player}</p>
        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{category}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-black tabular-nums" style={{ color: 'var(--accent)' }}>{stat}</p>
      </div>
    </div>
  )
}

export default function StatsPanel({ leaders = [] }) {
  if (!leaders.length) {
    return (
      <p className="text-sm text-center py-6" style={{ color: 'var(--muted)' }}>
        No stats available.
      </p>
    )
  }

  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
        Leaders
      </h4>
      <div>
        {leaders.map((l, i) => (
          <StatRow key={i} player={l.athlete} stat={l.stat} category={l.category} />
        ))}
      </div>
    </div>
  )
}
