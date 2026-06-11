import { useEffect, useRef } from 'react'

export default function Commentary({ plays = [] }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [plays.length])

  if (!plays.length) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>
        No play-by-play available yet.
      </p>
    )
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {plays.map((play, i) => (
        <div
          key={i}
          className="flex gap-3 text-xs leading-relaxed"
          style={{ color: i === plays.length - 1 ? 'var(--fg)' : 'var(--muted)' }}
        >
          {play.clock && (
            <span className="shrink-0 font-mono tabular-nums" style={{ color: 'var(--accent)', minWidth: '3rem' }}>
              {play.clock}
            </span>
          )}
          <p>{play.text}</p>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
