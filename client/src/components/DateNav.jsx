export function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function parseDate(str) {
  return new Date(
    parseInt(str.slice(0, 4)),
    parseInt(str.slice(4, 6)) - 1,
    parseInt(str.slice(6, 8)),
  )
}

function shiftDate(str, days) {
  const d = parseDate(str)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function displayLabel(str) {
  const today = todayStr()
  if (str === today) return 'Today'
  const yesterday = shiftDate(today, -1)
  if (str === yesterday) return 'Yesterday'
  const tomorrow = shiftDate(today, 1)
  if (str === tomorrow) return 'Tomorrow'
  return parseDate(str).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function DateNav({ date, onChange }) {
  const today = todayStr()
  const isToday = date === today

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(shiftDate(date, -1))}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-base font-bold"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
      >
        ‹
      </button>
      <button
        onClick={() => onChange(today)}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold min-w-[90px] text-center"
        style={{
          background: isToday ? 'var(--accent)' : 'var(--surface)',
          border: '1px solid var(--border)',
          color: isToday ? '#000' : 'var(--fg)',
        }}
      >
        {displayLabel(date)}
      </button>
      <button
        onClick={() => onChange(shiftDate(date, 1))}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-base font-bold"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
      >
        ›
      </button>
    </div>
  )
}
