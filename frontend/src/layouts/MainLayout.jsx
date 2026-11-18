import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/navigation/Sidebar'
import TopNav from '../components/navigation/TopNav'
import BottomBar from '../components/navigation/BottomBar'
import { useApp } from '../context/AppContext'
import { checkHealth } from '../services/api'

function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { setBackendConnected } = useApp()

  // Poll backend health
  useEffect(() => {
    const ping = async () => {
      try {
        await checkHealth()
        setBackendConnected(true)
      } catch {
        setBackendConnected(false)
      }
    }
    ping()
    const interval = setInterval(ping, 10000)
    return () => clearInterval(interval)
  }, [setBackendConnected])

  return (
    <div className="flex h-screen bg-[#0f0f17] overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
        <BottomBar />
      </div>
    </div>
  )
}

export default MainLayout
