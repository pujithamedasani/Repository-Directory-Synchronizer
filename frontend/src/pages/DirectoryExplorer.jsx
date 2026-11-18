import { useState, useEffect } from 'react'
import { Folder, File, ChevronRight, ArrowLeft, RefreshCw, HardDrive } from 'lucide-react'
import { getDirectoryContents } from '../services/api'
import { formatBytes, formatDate } from '../utils/formatters'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Skeleton from '../components/ui/Skeleton'

export default function DirectoryExplorer() {
  const [currentPath, setCurrentPath] = useState('')
  const [data, setData] = useState({ path: '', items: [], parent: null })
  const [loading, setLoading] = useState(false)
  const [inputPath, setInputPath] = useState('')

  const loadDirectory = async (targetPath = '') => {
    setLoading(true)
    try {
      const res = await getDirectoryContents(targetPath)
      setData(res.data)
      setCurrentPath(res.data.path || '')
      setInputPath(res.data.path || '')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDirectory('')
  }, [])

  const handleNavigate = (item) => {
    if (item.is_dir) {
      loadDirectory(item.path)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Directory Explorer</h2>
        <p className="text-sm text-slate-500">Traverse local file systems, inspect file metadata, and explore directory structures.</p>
      </div>

      <Card className="p-4">
        <div className="flex gap-2">
          {data.parent !== null && (
            <Button
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => loadDirectory(data.parent)}
              disabled={loading}
            >
              Up
            </Button>
          )}
          <input
            type="text"
            value={inputPath}
            onChange={(e) => setInputPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadDirectory(inputPath)}
            placeholder="Type path or select drive..."
            className="flex-1 bg-[#1e1e2a] border border-[#2a2a3a] text-slate-200 text-sm rounded-lg px-3 py-2 font-mono"
          />
          <Button variant="secondary" icon={RefreshCw} onClick={() => loadDirectory(inputPath)}>
            Go
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-[#2a2a3a] bg-[#16161f] flex justify-between items-center">
          <span className="text-xs font-mono text-slate-400">
            {currentPath || 'Root Drives'} ({data.items?.length || 0} items)
          </span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 bg-[#1e1e2a] rounded animate-pulse" />
            ))}
          </div>
        ) : data.items?.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">Directory is empty</div>
        ) : (
          <div className="divide-y divide-[#2a2a3a]">
            {data.items.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleNavigate(item)}
                className={`flex items-center justify-between px-5 py-3 hover:bg-[#1e1e2a]/60 transition-colors ${
                  item.is_dir ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.is_dir ? (
                    <Folder className="h-4 w-4 text-indigo-400 shrink-0" />
                  ) : (
                    <File className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                  <span className="text-sm font-medium text-slate-200 truncate">{item.name}</span>
                </div>

                <div className="flex items-center gap-6 text-xs text-slate-500 font-mono">
                  <span>{!item.is_dir && item.size ? formatBytes(item.size) : '—'}</span>
                  <span className="w-32 text-right">{item.modified ? formatDate(item.modified) : '—'}</span>
                  {item.is_dir && <ChevronRight className="h-4 w-4 text-slate-600" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
