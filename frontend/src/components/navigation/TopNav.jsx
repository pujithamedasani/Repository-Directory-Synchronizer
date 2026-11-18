import { useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import StatusDot from '../ui/StatusDot'
import { useApp } from '../../context/AppContext'

const pageNames = {
  '/overview': 'Overview',
  '/synchronize': 'Synchronize',
  '/explorer': 'Directory Explorer',
  '/compare': 'Compare Directories',
  '/history': 'Activity History',
  '/monitoring': 'File Monitoring',
  '/settings': 'Settings',
}

function TopNav() {
  const { pathname } = useLocation()
  const { backendConnected } = useApp()

  return (
    <header className="h-14 flex items-center gap-4 px-6 border-b border-[#2a2a3a] bg-[#0f0f17] shrink-0">
      <div className="flex-1">
        <h1 className="text-sm font-semibold text-slate-200">
          {pageNames[pathname] || 'SyncSphere'}
        </h1>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
        <input
          type="text"
          placeholder="Search..."
          className="w-48 bg-[#1e1e2a] border border-[#2a2a3a] text-slate-300 placeholder-slate-600 text-sm rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent transition-colors"
        />
      </div>

      {/* Notification bell */}
      <button className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-[#1e1e2a] transition-colors relative">
        <Bell className="h-4 w-4" />
      </button>

      {/* Connection status */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e1e2a] border border-[#2a2a3a]">
        <StatusDot status={backendConnected ? 'connected' : 'disconnected'} />
        <span className="text-xs text-slate-400 hidden sm:block">
          {backendConnected ? 'Connected' : 'Offline'}
        </span>
      </div>
    </header>
  )
}

export default TopNav
