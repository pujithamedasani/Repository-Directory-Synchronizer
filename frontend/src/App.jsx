import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import Overview from './pages/Overview.jsx'
import Synchronize from './pages/Synchronize.jsx'
import DirectoryExplorer from './pages/DirectoryExplorer.jsx'
import CompareDirectories from './pages/CompareDirectories.jsx'
import ActivityHistory from './pages/ActivityHistory.jsx'
import FileMonitoring from './pages/FileMonitoring.jsx'
import Settings from './pages/Settings.jsx'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/synchronize" element={<Synchronize />} />
        <Route path="/explorer" element={<DirectoryExplorer />} />
        <Route path="/compare" element={<CompareDirectories />} />
        <Route path="/history" element={<ActivityHistory />} />
        <Route path="/monitoring" element={<FileMonitoring />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
