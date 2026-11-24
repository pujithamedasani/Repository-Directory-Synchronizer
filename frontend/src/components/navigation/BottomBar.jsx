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
          className="p-1 rounded hover:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px] text-slate-400">Light</span>
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5 text-indigo-500" />
              <span className="hidden sm:inline text-[11px] text-slate-600">Dark</span>
            </>
          )}
        </button>
      </div>
    </footer>
  )
}

export default BottomBar
