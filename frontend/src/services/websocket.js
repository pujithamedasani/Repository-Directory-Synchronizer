class WebSocketService {
  constructor() {
    this.ws = null
    this.url = null
    this.listeners = []
    this.reconnectAttempts = 0
    this.maxReconnects = 3
    this.reconnectDelay = 1000
    this.shouldReconnect = false
  }

  connect(url) {
    this.url = url
    this.shouldReconnect = true
    this._connect()
  }

  _connect() {
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}${this.url}`

    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this._emit({ type: 'connected' })
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this._emit(data)
      } catch {
        this._emit({ type: 'raw', data: event.data })
      }
    }

    this.ws.onerror = () => {
      this._emit({ type: 'error' })
    }

    this.ws.onclose = () => {
      this._emit({ type: 'disconnected' })
      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnects) {
        this.reconnectAttempts++
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
        setTimeout(() => this._connect(), delay)
      }
    }
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  onMessage(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  _emit(data) {
    this.listeners.forEach(cb => cb(data))
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const progressWS = new WebSocketService()
export const monitoringWS = new WebSocketService()
export default WebSocketService
