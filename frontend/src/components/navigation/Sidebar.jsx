import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, RefreshCw, FolderTree, GitCompare,
  History, Activity, Settings, ChevronLeft, ChevronRight,
  Zap,
} from 'lucide-react'
import { ROUTES } from '../../utils/constants'

const navItems = [
  { label: 'Overview', path: ROUTES.OVERVIEW, icon: LayoutDashboard },
  { label: 'Synchronize', path: ROUTES.SYNCHRONIZE, icon: RefreshCw },
  { label: 'Explorer', path: ROUTES.EXPLORER, icon: FolderTree },
  { label: 'Compare', path: ROUTES.COMPARE, icon: GitCompare },
  { label: 'History', path: ROUTES.HISTORY, icon: History },
  { label: 'Monitoring', path: ROUTES.MONITORING, icon: Activity },
  { label: 'Settings', path: ROUTES.SETTINGS, icon: Settings },
]

function Sidebar({ collapsed, onToggle }) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex flex-col h-full bg-[#0a0a0f] border-r border-[#2a2a3a] overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#2a2a3a]">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <span className="text-sm font-bold text-slate-100 whitespace-nowrap">SyncSphere</span>
              <p className="text-xs text-slate-500 whitespace-nowrap">Directory Sync</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 group relative
              ${isActive
                ? 'bg-indigo-500/15 text-indigo-400'
                : 'text-slate-500 hover:text-slate-200 hover:bg-[#16161f]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-r-full" />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Toggle button */}
      <div className="p-3 border-t border-[#2a2a3a]">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-[#16161f] transition-colors duration-150"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </motion.aside>
  )
}

export default Sidebar
