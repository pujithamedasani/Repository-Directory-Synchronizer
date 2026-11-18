function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  iconColor = 'text-indigo-400',
  iconBg = 'bg-indigo-500/10',
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center mb-4`}>
          <Icon className={`h-8 w-8 ${iconColor}`} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-200 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      )}
      {action}
    </div>
  )
}

export default EmptyState
