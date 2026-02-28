import { useMemo, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

const pick = (value, language) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value[language] || value.fr || value.en || ''
}

export default function DashboardGuide({ guide }) {
  const { language, tr } = useLanguage()
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const slides = useMemo(() => guide?.slides || [], [guide])
  const current = slides[index] || null

  if (!guide || slides.length === 0) return null

  const openGuide = () => {
    setIndex(0)
    setOpen(true)
  }

  const closeGuide = () => setOpen(false)
  const next = () => setIndex((prev) => Math.min(prev + 1, slides.length - 1))
  const prev = () => setIndex((prev) => Math.max(prev - 1, 0))

  return (
    <>
      <button
        onClick={openGuide}
        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 transition"
      >
        <BookOpen className="w-4 h-4" />
        {pick(guide.buttonLabel, language) || tr('Notice', 'Guide')}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/50" onClick={closeGuide} aria-label={tr('Fermer', 'Close')} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-emerald-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{pick(guide.title, language)}</h3>
                <p className="text-sm text-gray-600">
                  {tr('Etape', 'Step')} {index + 1}/{slides.length}
                </p>
              </div>
              <button
                onClick={closeGuide}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                aria-label={tr('Fermer', 'Close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {current ? (
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-900">{pick(current.title, language)}</h4>
                <p className="text-sm text-gray-700">{pick(current.description, language)}</p>
                <ul className="space-y-2">
                  {(pick(current.bullets, language) || []).map((item, itemIndex) => (
                    <li key={`${index}-${itemIndex}`} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-800">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {slides.map((_, dotIndex) => (
                  <button
                    key={dotIndex}
                    onClick={() => setIndex(dotIndex)}
                    className={`h-2.5 w-2.5 rounded-full transition ${
                      dotIndex === index ? 'bg-emerald-600 w-5' : 'bg-gray-300'
                    }`}
                    aria-label={`${tr('Aller a', 'Go to')} ${dotIndex + 1}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={prev}
                  disabled={index === 0}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {tr('Precedent', 'Previous')}
                </button>
                <button
                  onClick={index === slides.length - 1 ? closeGuide : next}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  {index === slides.length - 1 ? tr('Terminer', 'Done') : tr('Suivant', 'Next')}
                  {index === slides.length - 1 ? null : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
