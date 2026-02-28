import { User, Lock, CreditCard } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function SettingsTabs({ activeTab, onTabChange }) {
  const { tr } = useLanguage()
  const tabs = [
    { id: 'profile', label: tr('Profil', 'Profile'), icon: User },
    { id: 'security', label: tr('Securite', 'Security'), icon: Lock },
    { id: 'billing', label: tr('Abonnement', 'Billing'), icon: CreditCard }
  ]

  return (
    <div className="bg-white rounded-xl shadow-md">
      <div className="flex border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all border-b-2 ${
                isActive
                  ? 'text-emerald-700 border-emerald-600 bg-emerald-50'
                  : 'text-gray-600 border-transparent hover:text-emerald-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}


