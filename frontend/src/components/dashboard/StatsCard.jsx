import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

function StatsCard({ icon: Icon, label, value, trend, trendLabel, iconColor = 'text-indigo-400', iconBg = 'bg-indigo-500/10', loading = false }) {
  if (loading) {
    return (
      <div className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-5">
        <div className="animate-pulse space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2a2a3a] rounded-lg" />
            <div className="h-3 w-20 bg-[#2a2a3a] rounded" />
          </div>
          <div className="h-7 w-24 bg-[#2a2a3a] rounded" />
        </div>
      </div>
    )
  }

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-slate-500'

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-5 group cursor-default"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          {Icon && <Icon className={`h-5 w-5 ${iconColor}`} />}
        </div>
        {trend != null && (
          <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            <span>{trendLabel || `${Math.abs(trend)}%`}</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-100 mb-1">{value ?? '—'}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </motion.div>
  )
}

export default StatsCard
