import { useState, useEffect, useRef } from 'react'
import { Play, Square, Eye, FolderOpen, ArrowRight, ShieldCheck, RefreshCw, Sparkles, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApp } from '../context/AppContext'
import {
  startSync,
  cancelSync,
  previewSync,
  setSourceDir as apiSetSource,
  setDestDir as apiSetDest,
  getSourceDir,
  getDestDir,
  getConflicts,
  resolveConflict,
  getSyncStatus,
  resetDemoDirs,
} from '../services/api'
import { useWebSocket } from '../hooks/useWebSocket'
import { formatBytes } from '../utils/formatters'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'

export default function Synchronize() {
  const { sourceDir, destDir, setSourceDir, setDestDir, syncStatus, setSyncStatus, syncProgress, setSyncProgress } = useApp()
  const [mode, setMode] = useState('one_way') // 'one_way' | 'two_way'
  const [deleteOrphans, setDeleteOrphans] = useState(false)
  const [dryRunPreview, setDryRunPreview] = useState(null)
  const [conflicts, setConflicts] = useState([])
  const [loading, setLoading] = useState(false)
  const [resettingDemo, setResettingDemo] = useState(false)
  const [conflictModalOpen, setConflictModalOpen] = useState(false)
  const pollTimerRef = useRef(null)

  // Auto-load existing directories from backend on mount
  useEffect(() => {
    const loadDirs = async () => {
      try {
        const [sRes, dRes] = await Promise.all([getSourceDir(), getDestDir()])
        if (sRes.data?.source && !sourceDir) setSourceDir(sRes.data.source)
        if (dRes.data?.destination && !destDir) setDestDir(dRes.data.destination)
      } catch (e) {
        console.error(e)
      }
    }
    loadDirs()
  }, [])

  // Keep WebSocket listening for live progress
  useWebSocket('/ws/progress', {
    enabled: true,
    onMessage: (msg) => {
      if (msg.type === 'sync_progress' || msg.percent != null) {
        setSyncProgress(msg)
      }
      if (msg.status === 'completed' || msg.type === 'completed') {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current)
        setSyncStatus('completed')
        setSyncProgress(null)
        toast.success('Synchronization finished successfully!')
      } else if (msg.status === 'failed' || msg.type === 'error') {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current)
        setSyncStatus('failed')
        toast.error(`Sync error: ${msg.error || 'Failed'}`)
      }
    },
  })

  const saveSource = async (path = sourceDir) => {
    if (!path) return
    try {
      await apiSetSource(path)
      setSourceDir(path)
      toast.success('Source directory set!')
    } catch (err) {
      toast.error(err.message || 'Failed to set source directory')
    }
  }

  const saveDest = async (path = destDir) => {
    if (!path) return
    try {
      await apiSetDest(path)
      setDestDir(path)
      toast.success('Destination directory set!')
    } catch (err) {
      toast.error(err.message || 'Failed to set destination directory')
    }
  }

  const loadDemoDirs = async () => {
    const demoSource = 'E:\\Projects\\OS_Project\\demo_source'
    const demoDest = 'E:\\Projects\\OS_Project\\demo_dest'
    setSourceDir(demoSource)
    setDestDir(demoDest)
    try {
      await Promise.allSettled([apiSetSource(demoSource), apiSetDest(demoDest)])
      toast.success('Loaded demo directory paths!')
    } catch (e) {
      console.error(e)
    }
  }

  const handleResetDemoData = async () => {
    setResettingDemo(true)
    try {
      const res = await resetDemoDirs()
      if (res.data?.source) setSourceDir(res.data.source)
      if (res.data?.destination) setDestDir(res.data.destination)
      setDryRunPreview(null)
      toast.success('Fresh demo data generated! Ready to test two-way sync.')
      // Fetch fresh conflicts
      const cRes = await getConflicts()
      setConflicts(cRes.data || [])
    } catch (err) {
      toast.error(err.message || 'Failed to reset demo directories')
    } finally {
      setResettingDemo(false)
    }
  }

  const handleStartSync = async () => {
    if (!sourceDir || !destDir) {
      toast.error('Please configure both source and destination paths.')
      return
    }

    try {
      setLoading(true)
      // Ensure backend state is updated with paths
      await Promise.all([apiSetSource(sourceDir), apiSetDest(destDir)])

      setSyncStatus('running')
      await startSync({
        source_dir: sourceDir,
        dest_dir: destDir,
        mode: mode,
        sync_mode: mode,
        delete_extra: deleteOrphans,
        delete_orphans: deleteOrphans,
      })
      toast.success(mode === 'two_way' ? 'Two-way synchronization started!' : 'One-way mirror sync started!')

      if (mode === 'two_way') {
        const cRes = await getConflicts()
        setConflicts(cRes.data || [])
      }

      // Polling fallback to guarantee completion detection
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
      pollTimerRef.current = setInterval(async () => {
        try {
          const res = await getSyncStatus()
          if (!res.data?.active) {
            clearInterval(pollTimerRef.current)
            setSyncStatus('completed')
            setSyncProgress(null)
          } else if (res.data?.files_done != null) {
            setSyncProgress(res.data)
          }
        } catch {
          clearInterval(pollTimerRef.current)
        }
      }, 700)
    } catch (err) {
      setSyncStatus('failed')
      toast.error(err.message || 'Failed to start sync')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSync = async () => {
    try {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
      await cancelSync()
      setSyncStatus('cancelled')
      toast.success('Sync cancelled.')
    } catch (err) {
      toast.error(err.message || 'Failed to cancel sync')
    }
  }

  const handlePreview = async () => {
    if (!sourceDir || !destDir) {
      toast.error('Set source and destination directories first.')
      return
    }
    try {
      setLoading(true)
      await Promise.all([apiSetSource(sourceDir), apiSetDest(destDir)])
      const res = await previewSync({
        source_dir: sourceDir,
        dest_dir: destDir,
        mode: mode,
        sync_mode: mode,
      })
      setDryRunPreview(res.data)
      if (mode === 'two_way') {
        const cRes = await getConflicts()
        setConflicts(cRes.data || [])
      }
      toast.success('Dry-run preview generated.')
    } catch (err) {
      toast.error(err.message || 'Failed to generate preview')
    } finally {
      setLoading(false)
    }
  }

  const checkConflicts = async () => {
    try {
      const res = await getConflicts()
      setConflicts(res.data || [])
      setConflictModalOpen(true)
    } catch (err) {
      toast.error('Failed to load conflicts')
    }
  }

  const handleResolveConflict = async (filePath, resolution) => {
    try {
      await resolveConflict(filePath, resolution)
      setConflicts(c => c.filter(item => item.relative_path !== filePath))
      toast.success(`Conflict resolved with "${resolution}"`)
    } catch (err) {
      toast.error(err.message || 'Resolution failed')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Directory Synchronization</h2>
          <p className="text-sm text-slate-500">Perform concurrent, multi-threaded directory mirroring and bidirectional syncing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            icon={Sparkles}
            onClick={loadDemoDirs}
            title="Auto-fill Source and Destination with demo paths"
          >
            Load Demo Directories
          </Button>
          <Button
            variant="secondary"
            icon={RotateCcw}
            onClick={handleResetDemoData}
            loading={resettingDemo}
            title="Regenerate fresh test files on disk"
          >
            Reset Demo Data
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className="text-md font-semibold text-slate-200 mb-4">Directory Endpoints</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Source Path</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sourceDir || ''}
                onChange={(e) => setSourceDir(e.target.value)}
                placeholder="e.g. E:\Projects\OS_Project\demo_source"
                className="flex-1 bg-[#1e1e2a] border border-[#2a2a3a] text-slate-200 text-sm rounded-lg px-3 py-2 font-mono"
              />
              <Button variant="secondary" onClick={() => saveSource()}>
                Save
              </Button>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Destination Path</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={destDir || ''}
                onChange={(e) => setDestDir(e.target.value)}
                placeholder="e.g. E:\Projects\OS_Project\demo_dest"
                className="flex-1 bg-[#1e1e2a] border border-[#2a2a3a] text-slate-200 text-sm rounded-lg px-3 py-2 font-mono"
              />
              <Button variant="secondary" onClick={() => saveDest()}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-md font-semibold text-slate-200 mb-4">Sync Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="text-xs text-slate-400 block mb-2">Synchronization Mode</label>
            <div className="space-y-2">
              {/* One-Way Card */}
              <div
                onClick={() => setMode('one_way')}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  mode === 'one_way'
                    ? 'border-indigo-500 bg-indigo-500/15 shadow-sm shadow-indigo-500/20'
                    : 'border-[#2a2a3a] bg-[#1e1e2a] hover:bg-[#1e1e2a]/80'
                }`}
              >
                <input
                  type="radio"
                  name="syncMode"
                  value="one_way"
                  checked={mode === 'one_way'}
                  onChange={() => setMode('one_way')}
                  className="text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <div className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <span>One-Way Sync (Mirror)</span>
                    {mode === 'one_way' && <Badge status="new" size="xs">Active</Badge>}
                  </div>
                  <div className="text-xs text-slate-400">Copy changes unidirectionally from Source to Destination</div>
                </div>
              </div>

              {/* Two-Way Card */}
              <div
                onClick={() => setMode('two_way')}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  mode === 'two_way'
                    ? 'border-indigo-500 bg-indigo-500/15 shadow-sm shadow-indigo-500/20'
                    : 'border-[#2a2a3a] bg-[#1e1e2a] hover:bg-[#1e1e2a]/80'
                }`}
              >
                <input
                  type="radio"
                  name="syncMode"
                  value="two_way"
                  checked={mode === 'two_way'}
                  onChange={() => setMode('two_way')}
                  className="text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <div>
                  <div className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <span>Two-Way Sync (Bidirectional)</span>
                    {mode === 'two_way' && <Badge status="new" size="xs">Active</Badge>}
                  </div>
                  <div className="text-xs text-slate-400">Merge changes bidirectionally between both folders with conflict resolution</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-2">Additional Policies</label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-[#2a2a3a] bg-[#1e1e2a] cursor-pointer">
              <input
                type="checkbox"
                checked={deleteOrphans}
                onChange={(e) => setDeleteOrphans(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-0"
              />
              <div>
                <div className="text-sm font-medium text-slate-200">Delete Extraneous Files (One-Way only)</div>
                <div className="text-xs text-slate-500">Remove destination files that do not exist in source</div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#2a2a3a]">
          {syncStatus === 'running' ? (
            <Button variant="danger" icon={Square} onClick={handleCancelSync}>
              Cancel Sync
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={Play}
              loading={loading}
              onClick={handleStartSync}
            >
              {mode === 'two_way' ? 'Start Two-Way Sync (Bidirectional)' : 'Start One-Way Sync (Mirror)'}
            </Button>
          )}

          <Button variant="secondary" icon={Eye} onClick={handlePreview} loading={loading}>
            Dry-Run Preview
          </Button>

          <Button variant="ghost" icon={ShieldCheck} onClick={checkConflicts}>
            View Conflicts ({conflicts.length})
          </Button>
        </div>
      </Card>

      {syncStatus === 'running' && syncProgress && (
        <Card className="p-6 border-indigo-500/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-indigo-400">
              Syncing in background ({mode === 'two_way' ? 'Bidirectional' : 'Mirror'})...
            </span>
            <span className="text-sm text-slate-400">{Math.round(syncProgress.percent || 0)}%</span>
          </div>
          <ProgressBar value={syncProgress.percent || 0} max={100} />
          <div className="mt-3 flex justify-between text-xs text-slate-500 font-mono">
            <span>Current: {syncProgress.current_file || 'Processing...'}</span>
            <span>Files: {syncProgress.files_done || 0} / {syncProgress.total_files || 0}</span>
          </div>
        </Card>
      )}

      {dryRunPreview && (
        <Card className="p-6">
          <h3 className="text-md font-semibold text-slate-200 mb-2">
            Dry-Run Preview Result ({dryRunPreview.mode === 'two_way' ? 'Two-Way Bidirectional' : 'One-Way Mirror'})
          </h3>
          <p className="text-xs text-slate-500 mb-4">No files were modified. These actions will execute upon starting sync.</p>
          {dryRunPreview.mode === 'two_way' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
              <div className="p-3 bg-[#1e1e2a] rounded-lg">
                <div className="text-lg font-bold text-green-400">{dryRunPreview.source_to_dest_count ?? 0}</div>
                <div className="text-xs text-slate-500">Source → Dest (New)</div>
              </div>
              <div className="p-3 bg-[#1e1e2a] rounded-lg">
                <div className="text-lg font-bold text-blue-400">{dryRunPreview.dest_to_source_count ?? 0}</div>
                <div className="text-xs text-slate-500">Dest → Source (Propagated)</div>
              </div>
              <div className="p-3 bg-[#1e1e2a] rounded-lg">
                <div className="text-lg font-bold text-orange-400">{dryRunPreview.conflict_count ?? 0}</div>
                <div className="text-xs text-slate-500">Modified / Conflicts</div>
              </div>
              <div className="p-3 bg-[#1e1e2a] rounded-lg">
                <div className="text-lg font-bold text-slate-400">{dryRunPreview.files_to_skip ?? 0}</div>
                <div className="text-xs text-slate-500">Unchanged</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
              <div className="p-3 bg-[#1e1e2a] rounded-lg">
                <div className="text-lg font-bold text-green-400">{dryRunPreview.files_to_copy ?? 0}</div>
                <div className="text-xs text-slate-500">To Copy</div>
              </div>
              <div className="p-3 bg-[#1e1e2a] rounded-lg">
                <div className="text-lg font-bold text-blue-400">{dryRunPreview.files_to_update ?? 0}</div>
                <div className="text-xs text-slate-500">To Update</div>
              </div>
              <div className="p-3 bg-[#1e1e2a] rounded-lg">
                <div className="text-lg font-bold text-red-400">{dryRunPreview.files_to_delete ?? 0}</div>
                <div className="text-xs text-slate-500">To Delete</div>
              </div>
              <div className="p-3 bg-[#1e1e2a] rounded-lg">
                <div className="text-lg font-bold text-slate-400">{dryRunPreview.files_to_skip ?? 0}</div>
                <div className="text-xs text-slate-500">Unchanged</div>
              </div>
            </div>
          )}
        </Card>
      )}

      <Modal open={conflictModalOpen} onClose={() => setConflictModalOpen(false)} title="Conflict Resolution">
        {conflicts.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No conflicting files detected.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {conflicts.map((c, i) => (
              <div key={i} className="p-3 bg-[#1e1e2a] rounded-lg border border-[#2a2a3a] flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-300 truncate max-w-xs block">{c.relative_path}</span>
                  <span className="text-[10px] text-slate-500">Resolution: {c.resolution || 'Auto (Newer wins)'}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="xs" variant="secondary" onClick={() => handleResolveConflict(c.relative_path, 'source')}>
                    Keep Source
                  </Button>
                  <Button size="xs" variant="secondary" onClick={() => handleResolveConflict(c.relative_path, 'dest')}>
                    Keep Dest
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
