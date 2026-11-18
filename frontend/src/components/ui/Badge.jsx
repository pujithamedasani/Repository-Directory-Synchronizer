import { STATUS_COLORS } from '../../utils/constants'

const variants = {
  ...STATUS_COLORS,
  default: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
}

function Badge({ status, children, size = 'sm', dot = false, className = '' }) {
  const colors = variants[status] || variants.default
  const sizeClasses = size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2.5 py-1'

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />}
      {children || status}
    </span>
  )
}

export default Badge
