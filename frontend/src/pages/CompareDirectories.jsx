import { useState, useEffect } from 'react'
import { GitCompare, CheckCircle2, AlertCircle, FilePlus, FileDiff, Trash2, FileCheck, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useApp } from '../context/AppContext'
import {
  compareDirectories,
  setSourceDir as apiSetSource,
  setDestDir as apiSetDest,
  getSourceDir,
  getDestDir,
} from '../services/api'
import { formatBytes } from '../utils/formatters'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

export default function CompareDirectories() {
  const { sourceDir, destDir, setSourceDir, setDestDir } = useApp()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    const fetchDirs = async () => {
      try {
        const [s, d] = await Promise.all([getSourceDir(), getDestDir()])
        if (s.data?.source && !sourceDir) setSourceDir(s.data.source)
        if (d.data?.destination && !destDir) setDestDir(d.data.destination)
      } catch (err) {
        console.error(err)
      }
    }
    fetchDirs()
  }, [])

  const handleCompare = async () => {
    const s = sourceDir || 'E:\\Projects\\OS_Project\\demo_source'
    const d = destDir || 'E:\\Projects\\OS_Project\\demo_dest'

    if (!sourceDir) setSourceDir(s)
    if (!destDir) setDestDir(d)

    try {
      setLoading(true)
      await Promise.all([apiSetSource(s), apiSetDest(d)])
      const res = await compareDirectories({ use_checksum: true, include_hidden: false })
      setResult(res.data)
      toast.success('Directory comparison completed.')
    } catch (err) {
      toast.error(err.message || 'Comparison failed')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredFiles = () => {
    if (!result) return []
    const newF = (result.new_files || []).map(f => ({ ...f, type: 'new' }))
    const modF = (result.modified_files || []).map(f => ({ ...f, type: 'modified' }))
    const delF = (result.deleted_files || []).map(f => ({ ...f, type: 'deleted' }))
    const uncF = (result.unchanged_files || []).map(f => ({ ...f, type: 'unchanged' }))

    switch (activeTab) {
      case 'new': return newF
      case 'modified': return modF
      case 'deleted': return delF
      case 'unchanged': return uncF
      default: return [...newF, ...modF, ...delF, ...uncF]
    }
  }

  const files = getFilteredFiles()

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Directory Comparison</h2>
          <p className="text-sm text-slate-500">SHA-256 hash comparison across source and destination file trees.</p>
        </div>
        <Button variant="primary" icon={GitCompare} onClick={handleCompare} loading={loading}>
          Compare Directories
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 cursor-pointer" onClick={() => setActiveTab('new')}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-400"><FilePlus className="h-5 w-5" /></div>
            <div>
              <div className="text-xl font-bold text-slate-100">{result?.summary?.new ?? 0}</div>
              <div className="text-xs text-slate-500">New Files</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 cursor-pointer" onClick={() => setActiveTab('modified')}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><FileDiff className="h-5 w-5" /></div>
            <div>
              <div className="text-xl font-bold text-slate-100">{result?.summary?.modified ?? 0}</div>
              <div className="text-xs text-slate-500">Modified Files</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 cursor-pointer" onClick={() => setActiveTab('deleted')}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400"><Trash2 className="h-5 w-5" /></div>
            <div>
              <div className="text-xl font-bold text-slate-100">{result?.summary?.deleted ?? 0}</div>
              <div className="text-xs text-slate-500">Deleted / Missing</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 cursor-pointer" onClick={() => setActiveTab('unchanged')}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-500/10 text-slate-400"><FileCheck className="h-5 w-5" /></div>
            <div>
              <div className="text-xl font-bold text-slate-100">{result?.summary?.unchanged ?? 0}</div>
              <div className="text-xs text-slate-500">Unchanged Files</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-[#2a2a3a] bg-[#16161f] flex items-center justify-between">
          <div className="flex gap-2">
            {['all', 'new', 'modified', 'deleted', 'unchanged'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e1e2a]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 font-mono">{files.length} items</span>
        </div>

        {files.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            {result ? 'No files in this category' : 'Run comparison to view directory differences'}
          </div>
        ) : (
          <div className="divide-y divide-[#2a2a3a] max-h-[500px] overflow-y-auto">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-[#1e1e2a]/50">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge status={file.type} size="xs">{file.type}</Badge>
                  <span className="text-sm font-mono text-slate-300 truncate">{file.relative_path || file.path}</span>
                </div>
                <div className="text-xs font-mono text-slate-500">
                  {file.size ? formatBytes(file.size) : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
