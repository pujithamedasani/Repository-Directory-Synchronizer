function StatusDot({ status = 'offline', label, animate = true }) {
  const colors = {
    online: 'bg-green-400',
    connected: 'bg-green-400',
    offline: 'bg-red-400',
    disconnected: 'bg-red-400',
    reconnecting: 'bg-yellow-400',
    warning: 'bg-yellow-400',
    idle: 'bg-slate-400',
  }

  const color = colors[status] || colors.idle

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        {animate && (status === 'online' || status === 'connected') && (
          <div className={`absolute inset-0 rounded-full ${color} opacity-50 animate-ping`} />
        )}
      </div>
      {label && <span className="text-xs text-slate-400">{label}</span>}
    </div>
  )
}

export default StatusDot
