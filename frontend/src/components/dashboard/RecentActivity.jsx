import { Clock, ArrowRight, Check, AlertCircle } from 'lucide-react'
import { formatRelativeTime } from '../../utils/formatters'
import Badge from '../ui/Badge'

function RecentActivity({ sessions = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-5">
        <div className="h-5 bg-[#2a2a3a] w-32 rounded mb-4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-8 h-8 bg-[#2a2a3a] rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[#2a2a3a] rounded w-3/4" />
                <div className="h-3 bg-[#2a2a3a] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-200 mb-4">Recent Activity</h3>
      {sessions.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">No recent activity</div>
      ) : (
        <div className="space-y-3">
          {sessions.slice(0, 5).map((s) => (
            <div key={s.id} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                s.status === 'completed' ? 'bg-green-500/15' :
                s.status === 'failed' ? 'bg-red-500/15' : 'bg-blue-500/15'
              }`}>
                {s.status === 'completed'
                  ? <Check className="h-3.5 w-3.5 text-green-400" />
                  : s.status === 'failed'
                  ? <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                  : <Clock className="h-3.5 w-3.5 text-blue-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-slate-300 truncate max-w-[120px]">{s.source_dir?.split(/[/\\]/).pop()}</span>
                  <ArrowRight className="h-3 w-3 text-slate-600 shrink-0" />
                  <span className="text-xs text-slate-300 truncate max-w-[120px]">{s.dest_dir?.split(/[/\\]/).pop()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={s.status} size="xs">{s.status}</Badge>
                  <span className="text-xs text-slate-600">{formatRelativeTime(s.start_time)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RecentActivity
