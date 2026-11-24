import { useState, useEffect, useCallback } from 'react'
import { Activity, Play, Square, RefreshCw, FolderSearch, PlusCircle } from 'lucide-react'
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
  const [targetDir, setTargetDir] = useState(sourceDir || 'E:\\Projects\\OS_Project\\demo_source')
  const [activeMonitors, setActiveMonitors] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  // Check if targetDir is monitored (normalizing slashes and casing)
  const isMonitoring = activeMonitors.some(m => {
    const dir = typeof m === 'string' ? m : m?.directory
    if (!dir || !targetDir) return false
    const normD = dir.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
    const normT = targetDir.trim().replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
    return normD === normT
  })

  // Listen for WebSocket live monitoring events
  useWebSocket('/ws/monitoring', {
    enabled: true,
    onMessage: (msg) => {
      if (msg.type === 'monitoring_event' || msg.event_type || msg.type === 'file_event') {
        const ev = msg.type === 'monitoring_event' ? msg : (msg.data || msg)
        setEvents(prev => {
          // Avoid immediate duplicates
          const key = `${ev.event_type}-${ev.file_path}-${ev.timestamp}`
          if (prev.some(e => `${e.event_type}-${e.file_path}-${e.timestamp}` === key)) return prev
          return [ev, ...prev.slice(0, 99)]
        })
      }
    },
  })

  const refreshStatus = useCallback(async () => {
    try {
      const res = await getMonitoringStatus()
      const monitors = res.data?.monitors || []
      setActiveMonitors(monitors)

      if (targetDir) {
        const evRes = await getMonitoringEvents(targetDir, 50)
        const dbEvents = evRes.data?.events || []
        setEvents(prev => {
          // Merge dbEvents with any live websocket events
          const combined = [...prev]
          for (const d of dbEvents) {
            if (!combined.some(c => c.id === d.id || (c.file_path === d.file_path && c.timestamp === d.timestamp))) {
              combined.push(d)
            }
          }
          return combined.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)).slice(0, 100)
        })
      }
    } catch (err) {
      console.error(err)
    }
  }, [targetDir])

  useEffect(() => {
    refreshStatus()
    // Poll every 3 seconds as a safety net
    const interval = setInterval(refreshStatus, 3000)
    return () => clearInterval(interval)
  }, [refreshStatus])

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

  const handleQuickDemoDir = () => {
    const demoDir = 'E:\\Projects\\OS_Project\\demo_source'
    setTargetDir(demoDir)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">File System Monitoring</h2>
          <p className="text-sm text-slate-500">Real-time kernel-level file system event detection powered by Python Watchdog.</p>
        </div>
        <Button variant="secondary" icon={FolderSearch} onClick={handleQuickDemoDir}>
          Use Demo Source
        </Button>
      </div>

      <Card className="p-6">
        <h3 className="text-md font-semibold text-slate-200 mb-4">Monitor Target</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={targetDir}
            onChange={(e) => setTargetDir(e.target.value)}
            placeholder="Directory path to watch (e.g. E:\Projects\OS_Project\demo_source)"
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
        {activeMonitors.length > 0 && (
          <div className="mt-3 text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span>Active background monitors: {activeMonitors.map(m => m.directory).join(', ')}</span>
          </div>
        )}
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-[#2a2a3a] bg-[#16161f] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className={`h-4 w-4 ${isMonitoring ? 'text-green-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-xs font-semibold text-slate-200">Live Event Feed</span>
            {isMonitoring && (
              <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
                LIVE WATCHING
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-500">{events.length} recorded events</span>
            <Button size="xs" variant="ghost" icon={RefreshCw} onClick={refreshStatus}>
              Refresh
            </Button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            {isMonitoring
              ? 'Monitoring active! Modify, create, or delete any file in the watched directory to see events appear.'
              : 'Start monitoring a directory to see events.'}
          </div>
        ) : (
          <div className="divide-y divide-[#2a2a3a] max-h-[500px] overflow-y-auto font-mono">
            {events.map((ev, idx) => (
              <div key={idx} className="flex items-center justify-between px-5 py-3 hover:bg-[#1e1e2a]/50 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge status={ev.event_type} size="xs">{ev.event_type}</Badge>
                  <span className="text-slate-300 truncate" title={ev.file_path}>{ev.file_path}</span>
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
