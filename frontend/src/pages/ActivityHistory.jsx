import { useState, useEffect } from 'react'
import { History, Trash2, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { getHistory, getSessionOperations, deleteHistoryRecord } from '../services/api'
import { formatRelativeTime, formatBytes } from '../utils/formatters'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'

export default function ActivityHistory() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState(null)
  const [operations, setOperations] = useState([])
  const [modalOpen, setModalOpen] = useState(false)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await getHistory({ limit: 50 })
      setSessions(res.data?.sessions || [])
    } catch (err) {
      toast.error('Failed to load activity history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleViewOperations = async (session) => {
    setSelectedSession(session)
    try {
      const res = await getSessionOperations(session.id)
      setOperations(res.data?.operations || [])
      setModalOpen(true)
    } catch (err) {
      toast.error('Failed to load session details')
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    try {
      await deleteHistoryRecord(id)
      setSessions(s => s.filter(item => item.id !== id))
      toast.success('Session removed')
    } catch (err) {
      toast.error('Failed to delete session')
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Activity History</h2>
        <p className="text-sm text-slate-500">Audit logs and synchronization session records.</p>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-[#1e1e2a] rounded animate-pulse" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No recorded synchronization history</div>
        ) : (
          <div className="divide-y divide-[#2a2a3a]">
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => handleViewOperations(s)}
                className="p-4 hover:bg-[#1e1e2a]/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Badge status={s.status}>{s.status}</Badge>
                    <span className="text-xs text-slate-500">{formatRelativeTime(s.start_time)}</span>
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    <span className="text-slate-500">Source:</span> {s.source_dir}
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    <span className="text-slate-500">Dest:</span> {s.dest_dir}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                  <div>
                    <span>Copied: {s.files_copied}</span> | <span>Updated: {s.files_updated}</span>
                  </div>
                  <span className="text-slate-200">{formatBytes(s.bytes_transferred || 0)}</span>
                  <button
                    onClick={(e) => handleDelete(s.id, e)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Session #${selectedSession?.id} Details`}>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {operations.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No individual file operations recorded for this session.</p>
          ) : (
            operations.map((op) => (
              <div key={op.id} className="p-3 bg-[#1e1e2a] rounded-lg border border-[#2a2a3a] flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-slate-300 truncate max-w-sm">{op.file_path}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{op.operation_type}</div>
                </div>
                <Badge status={op.status} size="xs">{op.status}</Badge>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}
