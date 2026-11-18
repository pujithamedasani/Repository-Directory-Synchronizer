import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useApp } from '../../context/AppContext'
import StatusDot from '../ui/StatusDot'

function BottomBar() {
  const { theme, toggleTheme } = useTheme()
  const { backendConnected } = useApp()

  return (
    <footer className="h-8 flex items-center justify-between px-4 border-t border-[#2a2a3a] bg-[#0a0a0f] text-xs text-slate-500 shrink-0">
      <div className="flex items-center gap-3">
        <StatusDot status={backendConnected ? 'connected' : 'disconnected'} animate={false} />
        <span>{backendConnected ? 'Backend Connected' : 'Backend Offline'}</span>
      </div>
      <div className="flex items-center gap-3">
        <span>SyncSphere v1.0.0</span>
        <button
          onClick={toggleTheme}
          className="p-1 rounded hover:text-slate-200 transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
        </button>
      </div>
    </footer>
  )
}

export default BottomBar
