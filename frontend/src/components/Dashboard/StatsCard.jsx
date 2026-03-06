export default function StatsCard({ title, value, icon, color = 'slate', trend }) {
  const Icon = icon
  const colorClasses = {
    slate:   'from-slate-700 to-slate-600',
    brand:   'from-teal-600 to-emerald-700',
    teal:    'from-cyan-600 to-teal-700',
    emerald: 'from-emerald-500 to-emerald-700',
    amber:   'from-amber-500 to-orange-500',
    // anciens noms conservés pour rétrocompat
    purple:  'from-slate-700 to-slate-600',
    pink:    'from-teal-600 to-emerald-700',
    blue:    'from-cyan-600 to-teal-700',
    green:   'from-emerald-500 to-emerald-700',
    orange:  'from-amber-500 to-orange-500',
  }

  return (
    <div className="card finance-animate-in p-4 sm:p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorClasses[color] ?? colorClasses.slate} text-white shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend != null && (
          <span className={`text-xs font-semibold tabular-nums ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-slate-500 text-xs font-medium leading-snug mb-1">{title}</p>
      <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
    </div>
  )
}
