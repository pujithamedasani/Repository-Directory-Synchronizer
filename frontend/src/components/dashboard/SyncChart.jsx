import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDate } from '../../utils/formatters'

function SyncChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-5 animate-pulse">
        <div className="h-5 bg-[#2a2a3a] w-32 rounded mb-4" />
        <div className="h-48 bg-[#2a2a3a] rounded-lg" />
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[#1e1e2a] border border-[#2a2a3a] rounded-lg px-3 py-2 text-xs space-y-1">
        <div className="text-slate-500">{label}</div>
        {payload.map((p) => (
          <div key={p.name} style={{ color: p.color }}>
            {p.name}: <span className="font-medium">{p.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-200 mb-4">Sync History</h3>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No sync history</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={{ stroke: '#2a2a3a' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="files_synced" name="Files" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default SyncChart
