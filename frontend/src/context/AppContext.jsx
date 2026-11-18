import { createContext, useContext, useReducer, useCallback } from 'react'

const AppContext = createContext(null)

const initialState = {
  sourceDir: null,
  destDir: null,
  syncStatus: 'idle', // idle | running | paused | completed | failed
  syncProgress: null,
  backendConnected: false,
  currentSyncSession: null,
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_SOURCE_DIR':
      return { ...state, sourceDir: action.payload }
    case 'SET_DEST_DIR':
      return { ...state, destDir: action.payload }
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload }
    case 'SET_SYNC_PROGRESS':
      return { ...state, syncProgress: action.payload }
    case 'SET_BACKEND_CONNECTED':
      return { ...state, backendConnected: action.payload }
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSyncSession: action.payload }
    case 'RESET_SYNC':
      return { ...state, syncStatus: 'idle', syncProgress: null, currentSyncSession: null }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const setSourceDir = useCallback((dir) => dispatch({ type: 'SET_SOURCE_DIR', payload: dir }), [])
  const setDestDir = useCallback((dir) => dispatch({ type: 'SET_DEST_DIR', payload: dir }), [])
  const setSyncStatus = useCallback((status) => dispatch({ type: 'SET_SYNC_STATUS', payload: status }), [])
  const setSyncProgress = useCallback((progress) => dispatch({ type: 'SET_SYNC_PROGRESS', payload: progress }), [])
  const setBackendConnected = useCallback((connected) => dispatch({ type: 'SET_BACKEND_CONNECTED', payload: connected }), [])
  const setCurrentSession = useCallback((session) => dispatch({ type: 'SET_CURRENT_SESSION', payload: session }), [])
  const resetSync = useCallback(() => dispatch({ type: 'RESET_SYNC' }), [])

  return (
    <AppContext.Provider value={{
      ...state,
      setSourceDir,
      setDestDir,
      setSyncStatus,
      setSyncProgress,
      setBackendConnected,
      setCurrentSession,
      resetSync,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
