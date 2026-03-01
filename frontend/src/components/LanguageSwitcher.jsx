import { useLanguage } from '@/contexts/LanguageContext'

export default function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-gray-200 bg-white ${
        compact ? 'p-0.5' : 'p-1'
      }`}
    >
      <button
        type="button"
        onClick={() => setLanguage('fr')}
        className={`${compact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs'} font-semibold rounded ${
          language === 'fr' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {t('language.fr', 'FR')}
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`${compact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs'} font-semibold rounded ${
          language === 'en' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {t('language.en', 'EN')}
      </button>
    </div>
  )
}

