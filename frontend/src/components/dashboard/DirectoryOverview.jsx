import { FolderOpen, ArrowRight } from 'lucide-react'
import { truncatePath } from '../../utils/formatters'

function DirectoryOverview({ sourceDir, destDir }) {
  return (
    <div className="bg-[#16161f] border border-[#2a2a3a] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-200 mb-4">Configured Directories</h3>
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center gap-3 p-3 bg-[#1e1e2a] rounded-lg border border-[#2a2a3a]">
          <FolderOpen className="h-4 w-4 text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-slate-500 mb-0.5">Source</div>
            <div className="text-xs text-slate-300 font-mono truncate" title={sourceDir}>
              {sourceDir ? truncatePath(sourceDir, 30) : 'Not set'}
            </div>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-600 shrink-0" />
        <div className="flex-1 flex items-center gap-3 p-3 bg-[#1e1e2a] rounded-lg border border-[#2a2a3a]">
          <FolderOpen className="h-4 w-4 text-green-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-slate-500 mb-0.5">Destination</div>
            <div className="text-xs text-slate-300 font-mono truncate" title={destDir}>
              {destDir ? truncatePath(destDir, 30) : 'Not set'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DirectoryOverview
