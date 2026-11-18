export const ROUTES = {
  OVERVIEW: '/overview',
  SYNCHRONIZE: '/synchronize',
  EXPLORER: '/explorer',
  COMPARE: '/compare',
  HISTORY: '/history',
  MONITORING: '/monitoring',
  SETTINGS: '/settings',
}

export const SYNC_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
}

export const FILE_STATUS = {
  NEW: 'new',
  MODIFIED: 'modified',
  DELETED: 'deleted',
  UNCHANGED: 'unchanged',
  MOVED: 'moved',
  CONFLICT: 'conflict',
}

export const STATUS_COLORS = {
  new: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', dot: 'bg-green-400' },
  modified: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-400' },
  deleted: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-400' },
  unchanged: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', dot: 'bg-slate-400' },
  moved: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', dot: 'bg-yellow-400' },
  conflict: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-400' },
  completed: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', dot: 'bg-green-400' },
  running: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-400' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-400' },
  pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', dot: 'bg-yellow-400' },
  cancelled: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', dot: 'bg-slate-400' },
  idle: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', dot: 'bg-slate-400' },
}

export const MONITORING_EVENT_COLORS = {
  created: 'text-green-400',
  modified: 'text-blue-400',
  deleted: 'text-red-400',
  moved: 'text-yellow-400',
}

export const SYNC_MODES = {
  ONE_WAY: 'one_way',
  TWO_WAY: 'two_way',
}

export const WS_URLS = {
  PROGRESS: '/ws/progress',
  MONITORING: '/ws/monitoring',
}
