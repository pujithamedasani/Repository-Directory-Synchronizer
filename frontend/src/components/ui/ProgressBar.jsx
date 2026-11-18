function ProgressBar({ value = 0, max = 100, color = 'indigo', label, showPercent = true, size = 'md', animated = true }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))

  const colors = {
    indigo: 'bg-indigo-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
  }

  const heights = {
    xs: 'h-1',
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-slate-400">{label}</span>}
          {showPercent && <span className="text-sm font-medium text-slate-200">{Math.round(percent)}%</span>}
        </div>
      )}
      <div className={`w-full bg-[#2a2a3a] rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${heights[size]} rounded-full transition-all duration-300 ${colors[color] || colors.indigo} ${animated && percent < 100 ? 'relative overflow-hidden' : ''}`}
          style={{ width: `${percent}%` }}
        >
          {animated && percent > 0 && percent < 100 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          )}
        </div>
      </div>
    </div>
  )
}

export default ProgressBar
