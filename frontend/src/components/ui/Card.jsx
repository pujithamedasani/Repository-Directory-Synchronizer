function Card({ children, className = '', header, footer, ...props }) {
  return (
    <div
      className={`bg-[#16161f] border border-[#2a2a3a] rounded-xl ${className}`}
      {...props}
    >
      {header && (
        <div className="px-5 py-4 border-b border-[#2a2a3a]">
          {header}
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
      {footer && (
        <div className="px-5 py-3 border-t border-[#2a2a3a]">
          {footer}
        </div>
      )}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return <div className={`px-5 py-4 border-b border-[#2a2a3a] ${className}`}>{children}</div>
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>
}

export default Card
