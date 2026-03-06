export default function StatsCard({ title, value, icon, color = 'purple', trend }) {
  const Icon = icon
  const colorClasses = {
    purple: 'from-slate-800 to-slate-700',
    pink: 'from-teal-500 to-emerald-700',
    blue: 'from-cyan-600 to-teal-700',
    green: 'from-emerald-500 to-emerald-700',
    orange: 'from-amber-500 to-orange-600'
  }

  return (
    <div className="card finance-animate-in p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 sm:p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]} text-white`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        {trend && (
          <span className={`text-sm font-semibold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1 leading-snug">{title}</h3>
      <p className="text-2xl sm:text-3xl font-bold text-gray-800">{value}</p>
    </div>
  )
}
