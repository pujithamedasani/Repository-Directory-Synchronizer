import { useState, useEffect, useRef, useCallback } from 'react'

export function useWebSocket(url, { enabled = true, onMessage } = {}) {
  const [status, setStatus] = useState('disconnected') // connected | disconnected | reconnecting | error
  const wsRef = useRef(null)
  const reconnectRef = useRef(0)
  const maxReconnects = 3
  const shouldConnectRef = useRef(enabled)

  const connect = useCallback(() => {
    if (!url || !shouldConnectRef.current) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}${url}`
    
    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setStatus('connected')
        reconnectRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onMessage?.(data)
        } catch {
          onMessage?.({ type: 'raw', data: event.data })
        }
      }

      ws.onerror = () => {
        setStatus('error')
      }

      ws.onclose = () => {
        setStatus('disconnected')
        if (shouldConnectRef.current && reconnectRef.current < maxReconnects) {
          setStatus('reconnecting')
          reconnectRef.current++
          const delay = 1000 * Math.pow(2, reconnectRef.current - 1)
          setTimeout(connect, delay)
        }
      }
    } catch {
      setStatus('error')
    }
  }, [url, onMessage])

  useEffect(() => {
    shouldConnectRef.current = enabled
    if (enabled) {
      connect()
    } else {
      wsRef.current?.close()
    }

    return () => {
      shouldConnectRef.current = false
      wsRef.current?.close()
    }
  }, [enabled, connect])

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  return { status, send }
}
