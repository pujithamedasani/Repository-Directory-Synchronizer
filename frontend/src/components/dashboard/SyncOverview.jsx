import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import Badge from '../ui/Badge'
import { formatRelativeTime, formatDuration } from '../../utils/formatters'

function SyncOverview({ session, loading = false }) {
  if (loading) {
    return (
      <div className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-5 animate-pulse space-y-4">
        <div className="h-5 bg-[#2a2a3a] w-32 rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-4 bg-[#2a2a3a] rounded" />)}
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Last Sync</h3>
        <div className="flex flex-col items-center py-6 text-center">
          <RefreshCw className="h-8 w-8 text-slate-600 mb-3" />
          <p className="text-sm text-slate-500">No sync sessions yet</p>
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Files Copied', value: session.files_copied ?? 0, color: 'text-green-400' },
    { label: 'Files Updated', value: session.files_updated ?? 0, color: 'text-blue-400' },
    { label: 'Files Deleted', value: session.files_deleted ?? 0, color: 'text-red-400' },
    { label: 'Files Skipped', value: session.files_skipped ?? 0, color: 'text-slate-400' },
  ]

  return (
    <div className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Last Sync</h3>
        <Badge status={session.status} dot>{session.status}</Badge>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatRelativeTime(session.start_time)}</span>
          <span>·</span>
          <span>{formatDuration(session.duration_seconds)}</span>
        </div>

        <div className="text-xs text-slate-500 truncate">
          <span className="text-slate-400">Source:</span> {session.source_dir}
        </div>
        <div className="text-xs text-slate-500 truncate">
          <span className="text-slate-400">Dest:</span> {session.dest_dir}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-[#1e1e2a] rounded-lg p-3">
            <div className={`text-lg font-bold ${color}`}>{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SyncOverview
