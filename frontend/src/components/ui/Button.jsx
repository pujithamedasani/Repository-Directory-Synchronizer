import { forwardRef } from 'react'
import { clsx } from 'clsx'

const variants = {
  primary: 'bg-indigo-500 hover:bg-indigo-600 text-white focus:ring-indigo-500',
  secondary: 'bg-[#1e1e2a] hover:bg-[#2a2a3a] text-slate-300 border border-[#2a2a3a] focus:ring-indigo-500',
  danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
  ghost: 'hover:bg-[#1e1e2a] text-slate-400 hover:text-slate-200 focus:ring-indigo-500',
  outline: 'border border-indigo-500 text-indigo-400 hover:bg-indigo-500/10 focus:ring-indigo-500',
  success: 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500',
}

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-base rounded-xl',
}

const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  children,
  className,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f0f17]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : null}
      {children}
      {!loading && IconRight && <IconRight className="h-4 w-4 shrink-0" />}
    </button>
  )
})

Button.displayName = 'Button'
export default Button
