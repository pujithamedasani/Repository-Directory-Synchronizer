import { forwardRef } from 'react'

const Input = forwardRef(({
  label,
  error,
  hint,
  icon: Icon,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          ref={ref}
          className={`
            bg-[#1e1e2a] border text-slate-100 placeholder-slate-500 rounded-lg px-3 py-2 w-full
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            transition-colors duration-150 text-sm
            ${error ? 'border-red-500/50' : 'border-[#2a2a3a] hover:border-[#3a3a4f]'}
            ${Icon ? 'pl-9' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-400">{error}</span>}
      {hint && !error && <span className="text-xs text-slate-500">{hint}</span>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
