import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = {
  new: '#22c55e',
  modified: '#3b82f6',
  deleted: '#ef4444',
  unchanged: '#475569',
}

function FileDistribution({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-5 animate-pulse">
        <div className="h-5 bg-[#2a2a3a] w-36 rounded mb-4" />
        <div className="h-48 bg-[#2a2a3a] rounded-lg" />
      </div>
    )
  }

  const chartData = data
    ? [
        { name: 'New', value: Number(data.new ?? data.new_files ?? 0), color: COLORS.new },
        { name: 'Modified', value: Number(data.modified ?? data.modified_files ?? 0), color: COLORS.modified },
        { name: 'Deleted', value: Number(data.deleted ?? data.deleted_files ?? 0), color: COLORS.deleted },
        { name: 'Unchanged', value: Number(data.unchanged ?? data.unchanged_files ?? 0), color: COLORS.unchanged },
      ].filter(d => d.value > 0)
    : []

  const total = chartData.reduce((s, d) => s + d.value, 0)

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const { name, value } = payload[0]
    return (
      <div className="bg-[#1e1e2a] border border-[#2a2a3a] rounded-lg px-3 py-2 text-xs">
        <span className="text-slate-300 font-medium">{name}:</span>
        <span className="text-slate-100 ml-1">{value} ({total > 0 ? Math.round(value / total * 100) : 0}%)</span>
      </div>
    )
  }

  return (
    <div className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-200 mb-4">File Distribution</h3>
      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => <span className="text-xs text-slate-400">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default FileDistribution
