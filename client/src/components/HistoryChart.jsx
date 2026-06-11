import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function HistoryChart({ game }) {
  if (!game) return null

  const data = [
    { name: game.awayTeam.abbr, score: Number(game.awayTeam.score) || 0, color: '#60a5fa' },
    { name: game.homeTeam.abbr, score: Number(game.homeTeam.score) || 0, color: '#a78bfa' },
  ]

  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
        Score
      </h4>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} barCategoryGap="40%">
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--fg)' }}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
