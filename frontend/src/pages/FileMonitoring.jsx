import { useState, useEffect } from 'react'
import { Activity, Play, Square, Eye, FileText, Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApp } from '../context/AppContext'
import { startMonitoring, stopMonitoring, getMonitoringStatus, getMonitoringEvents } from '../services/api'
import { useWebSocket } from '../hooks/useWebSocket'
import { formatRelativeTime } from '../utils/formatters'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

export default function FileMonitoring() {
  const { sourceDir } = useApp()
  const [targetDir, setTargetDir] = useState(sourceDir || '')
  const [activeMonitors, setActiveMonitors] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  const isMonitoring = activeMonitors.includes(targetDir)

  // Listen for WebSocket live monitoring events
  useWebSocket('/ws/monitoring', {
    enabled: true,
    onMessage: (msg) => {
      if (msg.event_type || msg.type === 'file_event') {
        const ev = msg.data || msg
        setEvents(prev => [ev, ...prev.slice(0, 99)])
      }
    },
  })

  const refreshStatus = async () => {
    try {
      const res = await getMonitoringStatus()
      setActiveMonitors(res.data?.monitors || [])
      const evRes = await getMonitoringEvents(targetDir, 50)
      setEvents(evRes.data?.events || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    refreshStatus()
  }, [targetDir])

  const handleToggleMonitoring = async () => {
    if (!targetDir) {
      toast.error('Specify directory to monitor')
      return
    }

    setLoading(true)
    try {
      if (isMonitoring) {
        await stopMonitoring(targetDir)
        toast.success('Monitoring stopped')
      } else {
        await startMonitoring(targetDir)
        toast.success('Watchdog monitor activated')
      }
      await refreshStatus()
    } catch (err) {
      toast.error(err.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-100">File System Monitoring</h2>
        <p className="text-sm text-slate-500">Real-time kernel-level file system event detection powered by Python Watchdog.</p>
      </div>

      <Card className="p-6">
        <h3 className="text-md font-semibold text-slate-200 mb-4">Monitor Target</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={targetDir}
            onChange={(e) => setTargetDir(e.target.value)}
            placeholder="Directory path to watch (e.g. E:\demo_source)"
            className="flex-1 bg-[#1e1e2a] border border-[#2a2a3a] text-slate-200 text-sm rounded-lg px-3 py-2 font-mono"
          />
          <Button
            variant={isMonitoring ? 'danger' : 'primary'}
            icon={isMonitoring ? Square : Play}
            onClick={handleToggleMonitoring}
            loading={loading}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-[#2a2a3a] bg-[#16161f] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className={`h-4 w-4 ${isMonitoring ? 'text-green-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-xs font-semibold text-slate-200">Live Event Feed</span>
          </div>
          <span className="text-xs font-mono text-slate-500">{events.length} recorded events</span>
        </div>

        {events.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            {isMonitoring ? 'Monitoring active... Waiting for filesystem changes.' : 'Start monitoring a directory to see events.'}
          </div>
        ) : (
          <div className="divide-y divide-[#2a2a3a] max-h-[500px] overflow-y-auto font-mono">
            {events.map((ev, idx) => (
              <div key={idx} className="flex items-center justify-between px-5 py-3 hover:bg-[#1e1e2a]/50 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge status={ev.event_type} size="xs">{ev.event_type}</Badge>
                  <span className="text-slate-300 truncate">{ev.src_path || ev.file_path}</span>
                </div>
                <span className="text-slate-500 whitespace-nowrap ml-4">
                  {ev.timestamp ? formatRelativeTime(ev.timestamp) : 'Just now'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
