import { useEffect, useState } from 'react'
import { SERVER_URL } from '../config.js'

export default function TopPerformers({ league }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setCategories([])
    fetch(`${SERVER_URL}/api/leaders/${league}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [league, open])

  useEffect(() => { setOpen(false) }, [league])

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full py-2 text-xs font-bold uppercase tracking-widest"
        style={{ color: 'var(--muted)' }}
      >
        <span>🏆 Season Leaders</span>
        <span className="ml-auto text-[10px]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="pb-3">
          {loading && (
            <p className="text-xs text-center py-6" style={{ color: 'var(--muted)' }}>Loading…</p>
          )}
          {!loading && !categories.length && (
            <p className="text-xs text-center py-6" style={{ color: 'var(--muted)' }}>
              No leaders data available.
            </p>
          )}
          {categories.length > 0 && (
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
                {categories.map((cat) => (
                  <div
                    key={cat.category}
                    className="rounded-xl p-3 shrink-0"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      width: '170px',
                    }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest mb-2.5"
                      style={{ color: 'var(--muted)' }}
                    >
                      {cat.category}
                    </p>
                    {cat.leaders.slice(0, 3).map((l, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2 last:mb-0">
                        <span
                          className="text-[10px] w-3 shrink-0 tabular-nums text-right"
                          style={{ color: 'var(--muted)' }}
                        >
                          {i + 1}
                        </span>
                        {l.logo ? (
                          <img
                            src={l.logo}
                            alt={l.teamAbbr}
                            className="w-5 h-5 object-contain shrink-0"
                          />
                        ) : (
                          <div
                            className="w-5 h-5 rounded-full shrink-0"
                            style={{ background: l.teamColor || 'var(--surface-2)' }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-[11px] font-semibold truncate"
                            style={{ color: 'var(--fg)' }}
                          >
                            {l.name}
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                            {l.teamAbbr}
                          </p>
                        </div>
                        <span
                          className="text-[11px] font-black tabular-nums shrink-0"
                          style={{ color: 'var(--accent)' }}
                        >
                          {l.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
