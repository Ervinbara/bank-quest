import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  createAdvisorQuestionnaireFromTemplate,
  createCustomAdvisorQuestionnaire,
  deleteAdvisorQuestionnaire,
  getAdvisorQuestionnaires,
  getDefaultQuestionnaireTemplates,
  getQuestionBankByTheme,
  setAdvisorDefaultQuestionnaire,
  updateAdvisorQuestionnaire
} from '@/services/questionnaireService'
import { translateText } from '@/services/translationService'
import { ChevronDown, ChevronUp, Languages, Loader2, Plus, Save, Star, Trash2 } from 'lucide-react'

const DEFAULT_EDIT_OPTIONS = [
  { label: 'Jamais', points: 1 },
  { label: 'Rarement', points: 2 },
  { label: 'Parfois', points: 3 },
  { label: 'Souvent', points: 4 },
  { label: 'Toujours', points: 5 }
]

const THEME_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'budget', label: 'Budget' },
  { value: 'epargne', label: 'Epargne' },
  { value: 'investissement', label: 'Investissement' },
  { value: 'protection', label: 'Protection' },
  { value: 'fiscalite', label: 'Fiscalite' },
  { value: 'retraite', label: 'Retraite' }
]

const THEME_LABELS = {
  general: 'General',
  budget: 'Budget',
  epargne: 'Epargne',
  investissement: 'Investissement',
  protection: 'Protection',
  fiscalite: 'Fiscalite',
  retraite: 'Retraite'
}

export default function Questionnaires() {
  const { advisor } = useAuth()
  const { tr, language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState('')
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [draft, setDraft] = useState(null)
  const [templateKey, setTemplateKey] = useState('starter')
  const [templateName, setTemplateName] = useState('')
  const [customName, setCustomName] = useState('')
  const [bankTheme, setBankTheme] = useState('budget')
  const [bankQuestionIndex, setBankQuestionIndex] = useState(0)
  const [bankQuestionLanguage, setBankQuestionLanguage] = useState('fr')
  const [bankByTheme, setBankByTheme] = useState({})
  const [questionBusy, setQuestionBusy] = useState({})
  const [panelOpen, setPanelOpen] = useState({
    template: false,
    custom: false,
    bank: true,
    questions: true
  })

  const templates = useMemo(() => getDefaultQuestionnaireTemplates(), [])
  const bankThemes = useMemo(() => Object.keys(bankByTheme), [bankByTheme])

  const selectedQuestionnaire = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId]
  )

  const resolveTranslated = useCallback((translations, fallbackText, lang) => {
    const map = translations && typeof translations === 'object' ? translations : {}
    return map[lang] || map.fr || map.en || fallbackText || ''
  }, [])

  useEffect(() => {
    setBankQuestionLanguage(language === 'en' ? 'en' : 'fr')
  }, [language])

  const loadAll = useCallback(async () => {
    if (!advisor?.id) return

    try {
      setLoading(true)
      setError(null)
      const rows = await getAdvisorQuestionnaires(advisor.id)
      const bank = await getQuestionBankByTheme(advisor.id)
      setBankByTheme(bank || {})
      const firstTheme = Object.keys(bank || {})[0]
      if (firstTheme) {
        setBankTheme(firstTheme)
      }
      setItems(rows || [])
      const defaultItem = (rows || []).find((item) => item.is_default) || rows?.[0]
      setSelectedId(defaultItem?.id || '')
      if (defaultItem) {
        setDraft({
          name: defaultItem.name,
          description: defaultItem.description || '',
          questions: defaultItem.questions || []
        })
      } else {
        setDraft(null)
      }
    } catch (err) {
      console.error('Erreur chargement questionnaires:', err)
      setError(tr('Impossible de charger les questionnaires', 'Unable to load questionnaires'))
    } finally {
      setLoading(false)
    }
  }, [advisor?.id, tr])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  useEffect(() => {
    if (!selectedQuestionnaire) return
    setDraft({
      name: selectedQuestionnaire.name,
      description: selectedQuestionnaire.description || '',
      questions: selectedQuestionnaire.questions || []
    })
  }, [selectedQuestionnaire])

  const createFromTemplate = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess('')
      await createAdvisorQuestionnaireFromTemplate({
        advisorId: advisor.id,
        templateKey,
        customName: templateName
      })
      setTemplateName('')
      await loadAll()
      setSuccess(tr('Questionnaire cree depuis template', 'Questionnaire created from template'))
    } catch (err) {
      setError(err.message || tr('Impossible de creer le questionnaire', 'Unable to create questionnaire'))
    } finally {
      setSaving(false)
    }
  }

  const createCustom = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess('')
      await createCustomAdvisorQuestionnaire({
        advisorId: advisor.id,
        name: customName,
        description: ''
      })
      setCustomName('')
      await loadAll()
      setSuccess(tr('Questionnaire vide cree', 'Empty questionnaire created'))
    } catch (err) {
      setError(err.message || tr('Impossible de creer le questionnaire', 'Unable to create questionnaire'))
    } finally {
      setSaving(false)
    }
  }

  const addBankQuestion = () => {
    if (!draft) return
    const themeRows = bankByTheme[bankTheme] || []
    const question = themeRows[bankQuestionIndex]
    if (!question) return

    const nextQuestions = [
      ...draft.questions,
      {
        questionText: resolveTranslated(question.promptTranslations, question.prompt, bankQuestionLanguage),
        concept: resolveTranslated(question.conceptTranslations, question.concept, bankQuestionLanguage),
        promptTranslations: question.promptTranslations || { fr: question.prompt || '' },
        conceptTranslations: question.conceptTranslations || { fr: question.concept || '' },
        theme: bankTheme,
        orderIndex: draft.questions.length,
        options: question.options || DEFAULT_EDIT_OPTIONS
      }
    ]

    setDraft((prev) => ({ ...prev, questions: nextQuestions }))
  }

  const addCustomQuestion = () => {
    if (!draft) return
    setDraft((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: '',
          concept: 'General',
          promptTranslations: { fr: '' },
          conceptTranslations: { fr: 'General' },
          theme: 'general',
          orderIndex: prev.questions.length,
          options: DEFAULT_EDIT_OPTIONS
        }
      ]
    }))
  }

  const updateQuestionField = (index, field, value) => {
    if (!draft) return
    const next = [...draft.questions]
    next[index] = { ...next[index], [field]: value }
    if (field === 'questionText') {
      next[index].promptTranslations = {
        ...(next[index].promptTranslations || {}),
        [language === 'en' ? 'en' : 'fr']: value
      }
    }
    if (field === 'concept') {
      next[index].conceptTranslations = {
        ...(next[index].conceptTranslations || {}),
        [language === 'en' ? 'en' : 'fr']: value
      }
    }
    setDraft((prev) => ({ ...prev, questions: next }))
  }

  const removeQuestion = (index) => {
    if (!draft) return
    const next = draft.questions.filter((_, idx) => idx !== index).map((question, idx) => ({
      ...question,
      orderIndex: idx
    }))
    setDraft((prev) => ({ ...prev, questions: next }))
  }

  const translateDraftQuestion = async (index, sourceLang, targetLang) => {
    if (!draft?.questions?.[index]) return
    try {
      setQuestionBusy((prev) => ({ ...prev, [index]: true }))
      setError(null)
      setSuccess('')
      const question = draft.questions[index]
      const [questionResult, conceptResult] = await Promise.all([
        translateText({
          text: question.questionText || '',
          sourceLang,
          targetLang
        }),
        translateText({
          text: question.concept || '',
          sourceLang,
          targetLang
        })
      ])

      const next = [...draft.questions]
      const nextPromptTranslations = {
        ...(question.promptTranslations || {}),
        [targetLang]: questionResult.translatedText || question.questionText
      }
      const nextConceptTranslations = {
        ...(question.conceptTranslations || {}),
        [targetLang]: conceptResult.translatedText || question.concept
      }
      next[index] = {
        ...next[index],
        questionText: resolveTranslated(nextPromptTranslations, questionResult.translatedText || question.questionText, targetLang),
        concept: resolveTranslated(nextConceptTranslations, conceptResult.translatedText || question.concept, targetLang),
        promptTranslations: nextPromptTranslations,
        conceptTranslations: nextConceptTranslations
      }
      setDraft((prev) => ({ ...prev, questions: next }))
      setSuccess(tr('Question traduite dans le brouillon', 'Question translated in draft'))
    } catch (err) {
      setError(err.message || tr('Impossible de traduire la question', 'Unable to translate question'))
    } finally {
      setQuestionBusy((prev) => ({ ...prev, [index]: false }))
    }
  }

  const saveCurrent = async () => {
    if (!selectedQuestionnaire || !draft) return

    try {
      setSaving(true)
      setError(null)
      setSuccess('')
      await updateAdvisorQuestionnaire({
        advisorId: advisor.id,
        questionnaireId: selectedQuestionnaire.id,
        name: draft.name,
        description: draft.description,
        questions: draft.questions
      })
      await loadAll()
      setSuccess(tr('Questionnaire enregistre', 'Questionnaire saved'))
    } catch (err) {
      setError(err.message || tr("Impossible d'enregistrer le questionnaire", 'Unable to save questionnaire'))
    } finally {
      setSaving(false)
    }
  }

  const setDefault = async (questionnaireId) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess('')
      await setAdvisorDefaultQuestionnaire({ advisorId: advisor.id, questionnaireId })
      await loadAll()
      setSuccess(tr('Questionnaire par defaut mis a jour', 'Default questionnaire updated'))
    } catch (err) {
      setError(err.message || tr('Impossible de definir le questionnaire par defaut', 'Unable to set default questionnaire'))
    } finally {
      setSaving(false)
    }
  }

  const removeQuestionnaire = async (questionnaireId) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess('')
      await deleteAdvisorQuestionnaire({ advisorId: advisor.id, questionnaireId })
      await loadAll()
      setSuccess(tr('Questionnaire supprime', 'Questionnaire deleted'))
    } catch (err) {
      setError(err.message || tr('Impossible de supprimer le questionnaire', 'Unable to delete questionnaire'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{tr('Chargement des questionnaires...', 'Loading questionnaires...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{tr('Questionnaires', 'Questionnaires')}</h2>
        <p className="text-gray-600">{tr('Creez vos questionnaires, utilisez des templates et ajoutez des questions par theme.', 'Create questionnaires, use templates, and add topic-based questions.')}</p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Le theme sert uniquement a classer les questions (General, Budget, Epargne, etc.).
        Si aucun questionnaire n'est marque "Par defaut", l'application utilise automatiquement le premier questionnaire cree.
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      {success ? <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{success}</div> : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
          <h3 className="font-bold text-gray-900">{tr('Vos questionnaires', 'Your questionnaires')}</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-left rounded-lg border px-3 py-2 transition ${
                  selectedId === item.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-800">{item.name}</p>
                  {item.is_default ? <Star className="w-4 h-4 text-amber-500" /> : null}
                </div>
                <p className="text-xs text-gray-600">{item.questions?.length || 0} questions</p>
              </button>
            ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <button
              onClick={() => setPanelOpen((prev) => ({ ...prev, template: !prev.template }))}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-800"
            >
              {tr('Creer depuis un template', 'Create from template')}
              {panelOpen.template ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
            </button>
            {panelOpen.template ? (
              <>
                <select
                  value={templateKey}
                  onChange={(event) => setTemplateKey(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {templates.map((template) => (
                    <option key={template.key} value={template.key}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={templateName}
                  onChange={(event) => setTemplateName(event.target.value)}
                  placeholder={tr('Nom personnalise (optionnel)', 'Custom name (optional)')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={createFromTemplate}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {tr('Ajouter depuis template', 'Add from template')}
                </button>
              </>
            ) : null}
          </div>

          <div className="border-t pt-4 space-y-3">
            <button
              onClick={() => setPanelOpen((prev) => ({ ...prev, custom: !prev.custom }))}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-800"
            >
              {tr('Creer un questionnaire vide', 'Create an empty questionnaire')}
              {panelOpen.custom ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
            </button>
            {panelOpen.custom ? (
              <>
                <input
                  type="text"
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                  placeholder={tr('Ex: Questionnaire premium', 'Ex: Premium questionnaire')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={createCustom}
                  disabled={saving || customName.trim().length < 3}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  {tr('Creer vide', 'Create empty')}
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-xl shadow-md p-6 space-y-4">
          {!draft || !selectedQuestionnaire ? (
              <p className="text-gray-600">{tr('Selectionnez un questionnaire pour le modifier.', 'Select a questionnaire to edit.')}</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={draft.description}
                    onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDefault(selectedQuestionnaire.id)}
                    disabled={saving}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-amber-300 text-amber-700 font-semibold hover:bg-amber-50 transition disabled:opacity-60"
                  >
                    <Star className="w-4 h-4" />
                     {tr('Par defaut', 'Set default')}
                  </button>
                  <button
                    onClick={() => removeQuestionnaire(selectedQuestionnaire.id)}
                    disabled={saving}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-300 text-red-700 font-semibold hover:bg-red-50 transition disabled:opacity-60"
                  >
                    <Trash2 className="w-4 h-4" />
                     {tr('Supprimer', 'Delete')}
                  </button>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <button
                  onClick={() => setPanelOpen((prev) => ({ ...prev, bank: !prev.bank }))}
                  className="w-full flex items-center justify-between text-sm font-semibold text-gray-800"
                >
                  {tr('Banque de questions par theme', 'Question bank by topic')}
                  {panelOpen.bank ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                </button>
                {panelOpen.bank ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <select
                        value={bankQuestionLanguage}
                        onChange={(event) => setBankQuestionLanguage(event.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
                      >
                        <option value="fr">FR</option>
                        <option value="en">EN</option>
                      </select>
                      <select
                        value={bankTheme}
                        onChange={(event) => {
                          setBankTheme(event.target.value)
                          setBankQuestionIndex(0)
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
                      >
                        {bankThemes.map((theme) => (
                          <option key={theme} value={theme}>
                            {THEME_LABELS[theme] || theme}
                          </option>
                        ))}
                      </select>
                      <select
                        value={bankQuestionIndex}
                        onChange={(event) => setBankQuestionIndex(Number(event.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
                      >
                        {(bankByTheme[bankTheme] || []).map((question, index) => (
                          <option key={`${bankTheme}-${index}`} value={index}>
                            {resolveTranslated(question.promptTranslations, question.prompt, bankQuestionLanguage)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={addBankQuestion}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-white transition"
                    >
                      <Plus className="w-4 h-4" />
                       {tr('Ajouter la question', 'Add question')}
                    </button>
                  </>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                   <button
                    onClick={() => setPanelOpen((prev) => ({ ...prev, questions: !prev.questions }))}
                    className="flex items-center gap-2 font-semibold text-gray-900"
                  >
                    <span>{tr('Questions', 'Questions')} ({draft.questions.length})</span>
                    {panelOpen.questions ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                  </button>
                  <button
                    onClick={addCustomQuestion}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                  >
                    <Plus className="w-4 h-4" />
                     {tr('Ajouter une question', 'Add a question')}
                  </button>
                </div>

                {!panelOpen.questions ? null : draft.questions.length === 0 ? (
                   <p className="text-sm text-gray-600">{tr('Ajoutez des questions pour activer ce questionnaire.', 'Add questions to activate this questionnaire.')}</p>
                ) : (
                  <div className="space-y-3 max-h-[460px] overflow-auto pr-1">
                    {draft.questions.map((question, index) => (
                      <div key={`question-${index}`} className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={question.questionText || ''}
                            onChange={(event) => updateQuestionField(index, 'questionText', event.target.value)}
                            placeholder={`Question ${index + 1}`}
                            className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="text"
                            value={question.concept || ''}
                            onChange={(event) => updateQuestionField(index, 'concept', event.target.value)}
                             placeholder={tr('Concept', 'Concept')}
                            className="px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => translateDraftQuestion(index, 'fr', 'en')}
                            disabled={Boolean(questionBusy[index])}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                          >
                            <Languages className="w-3 h-3" />
                            FR -&gt; EN
                          </button>
                          <button
                            onClick={() => translateDraftQuestion(index, 'en', 'fr')}
                            disabled={Boolean(questionBusy[index])}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                          >
                            <Languages className="w-3 h-3" />
                            EN -&gt; FR
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <label className="text-sm text-gray-600">{tr('Theme', 'Topic')}</label>
                            <select
                              value={question.theme || 'general'}
                              onChange={(event) => updateQuestionField(index, 'theme', event.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                            >
                              {THEME_OPTIONS.map((theme) => (
                                <option key={theme.value} value={theme.value}>
                                  {theme.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => removeQuestion(index)}
                            className="text-sm text-red-600 hover:text-red-700 font-semibold"
                          >
                             {tr('Supprimer', 'Delete')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={saveCurrent}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                   {tr('Enregistrer les modifications', 'Save changes')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
