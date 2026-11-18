import { useState, useEffect } from 'react'
import { FolderSync, Files, HardDrive, CheckCircle2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { getHistoryStats, getHistory, getComparisonResult } from '../services/api'
import { formatBytes } from '../utils/formatters'
import StatsCard from '../components/dashboard/StatsCard'
import DirectoryOverview from '../components/dashboard/DirectoryOverview'
import SyncOverview from '../components/dashboard/SyncOverview'
import SyncChart from '../components/dashboard/SyncChart'
import FileDistribution from '../components/dashboard/FileDistribution'
import RecentActivity from '../components/dashboard/RecentActivity'

export default function Overview() {
  const { sourceDir, destDir } = useApp()
  const [stats, setStats] = useState(null)
  const [recentSessions, setRecentSessions] = useState([])
  const [lastSession, setLastSession] = useState(null)
  const [comparisonData, setComparisonData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      setLoading(true)
      try {
        const [statsRes, historyRes, compRes] = await Promise.allSettled([
          getHistoryStats(),
          getHistory({ limit: 10 }),
          getComparisonResult(),
        ])

        if (isMounted) {
          if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
          if (historyRes.status === 'fulfilled') {
            const sessions = historyRes.value.data?.sessions || []
            setRecentSessions(sessions)
            if (sessions.length > 0) setLastSession(sessions[0])
          }
          if (compRes.status === 'fulfilled') {
            setComparisonData(compRes.value.data?.summary || null)
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()
    return () => { isMounted = false }
  }, [])

  const chartData = recentSessions.map(s => ({
    date: s.start_time ? new Date(s.start_time).toLocaleDateString() : 'N/A',
    files_synced: (s.files_copied || 0) + (s.files_updated || 0),
  })).reverse()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">System Overview</h2>
        <p className="text-sm text-slate-500">Monitor sync operations, file activity, and repository status.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={FolderSync}
          label="Total Sync Sessions"
          value={stats?.total_sessions ?? 0}
          iconColor="text-indigo-400"
          iconBg="bg-indigo-500/10"
          loading={loading}
        />
        <StatsCard
          icon={CheckCircle2}
          label="Completed"
          value={stats?.completed ?? 0}
          iconColor="text-green-400"
          iconBg="bg-green-500/10"
          loading={loading}
        />
        <StatsCard
          icon={Files}
          label="Total Files Synced"
          value={stats?.total_files_synced ?? 0}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
          loading={loading}
        />
        <StatsCard
          icon={HardDrive}
          label="Data Transferred"
          value={formatBytes(stats?.total_bytes_transferred ?? 0)}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/10"
          loading={loading}
        />
      </div>

      <DirectoryOverview sourceDir={sourceDir} destDir={destDir} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SyncOverview session={lastSession} loading={loading} />
        <RecentActivity sessions={recentSessions} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SyncChart data={chartData} loading={loading} />
        <FileDistribution data={comparisonData} loading={loading} />
      </div>
    </div>
  )
}
