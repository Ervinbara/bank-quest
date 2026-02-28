import { useLanguage } from '@/contexts/LanguageContext'

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-1">
      <button
        type="button"
        onClick={() => setLanguage('fr')}
        className={`px-2 py-1 text-xs font-semibold rounded ${
          language === 'fr' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {t('language.fr', 'FR')}
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 text-xs font-semibold rounded ${
          language === 'en' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {t('language.en', 'EN')}
      </button>
    </div>
  )
}
