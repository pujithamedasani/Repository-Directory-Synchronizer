export function formatBytes(bytes) {
  if (bytes === 0 || bytes == null) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDuration(seconds) {
  if (seconds == null || seconds < 0) return '—'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  if (m < 60) return `${m}m ${s}s`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return `${h}h ${rem}m`
}

export function formatRelativeTime(isoString) {
  if (!isoString) return '—'
  const diff = Date.now() - new Date(isoString).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`
  return formatDate(isoString)
}

export function getFileIcon(extension) {
  const ext = (extension || '').toLowerCase().replace('.', '')
  const map = {
    js: 'code', jsx: 'code', ts: 'code', tsx: 'code', py: 'code', rb: 'code',
    java: 'code', cpp: 'code', c: 'code', go: 'code', rs: 'code', php: 'code',
    html: 'globe', css: 'palette', scss: 'palette',
    json: 'braces', xml: 'braces', yaml: 'braces', yml: 'braces', toml: 'braces',
    md: 'file-text', txt: 'file-text', pdf: 'file-text', doc: 'file-text', docx: 'file-text',
    png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', svg: 'image', webp: 'image',
    mp4: 'video', avi: 'video', mov: 'video', mkv: 'video',
    mp3: 'music', wav: 'music', flac: 'music',
    zip: 'archive', tar: 'archive', gz: 'archive', rar: 'archive',
    sql: 'database', db: 'database', sqlite: 'database',
    sh: 'terminal', bash: 'terminal', ps1: 'terminal',
    exe: 'cpu', dll: 'cpu', bin: 'cpu',
  }
  return map[ext] || 'file'
}

export function truncatePath(path, maxLength = 50) {
  if (!path || path.length <= maxLength) return path
  const parts = path.replace(/\\/g, '/').split('/')
  if (parts.length <= 2) return '...' + path.slice(-maxLength + 3)
  return parts[0] + '/.../' + parts[parts.length - 1]
}
