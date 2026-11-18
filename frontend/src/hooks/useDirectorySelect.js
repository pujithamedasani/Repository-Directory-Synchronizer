import { useState, useCallback } from 'react'
import { getDirectoryContents } from '../services/api'

export function useDirectorySelect() {
  const [modalOpen, setModalOpen] = useState(false)
  const [currentPath, setCurrentPath] = useState('')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [onSelect, setOnSelect] = useState(null)

  const browse = useCallback(async (path = '') => {
    setLoading(true)
    setError(null)
    try {
      const res = await getDirectoryContents(path)
      setCurrentPath(res.data.current_path || path)
      setEntries(res.data.entries || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const openBrowser = useCallback((callback, initialPath = '') => {
    setOnSelect(() => callback)
    setModalOpen(true)
    browse(initialPath)
  }, [browse])

  const navigateTo = useCallback((path) => {
    browse(path)
  }, [browse])

  const selectPath = useCallback(() => {
    if (onSelect && currentPath) {
      onSelect(currentPath)
      setModalOpen(false)
    }
  }, [onSelect, currentPath])

  const closeBrowser = useCallback(() => {
    setModalOpen(false)
    setEntries([])
    setError(null)
  }, [])

  return {
    modalOpen,
    currentPath,
    entries,
    loading,
    error,
    openBrowser,
    closeBrowser,
    navigateTo,
    selectPath,
  }
}
