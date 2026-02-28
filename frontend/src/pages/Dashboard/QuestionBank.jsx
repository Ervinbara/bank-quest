import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  createAdvisorQuestionBankQuestion,
  createAdvisorQuestionBankTheme,
  deleteAdvisorQuestionBankQuestion,
  deleteAdvisorQuestionBankTheme,
  getAdvisorQuestionBankCatalog,
  updateAdvisorQuestionBankQuestion,
  updateAdvisorQuestionBankTheme
} from '@/services/questionnaireService'
import { translateText } from '@/services/translationService'
import { ChevronDown, ChevronUp, Languages, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react'

export default function QuestionBank() {
  const { advisor } = useAuth()
  const { tr, language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [themes, setThemes] = useState([])
  const [selectedThemeId, setSelectedThemeId] = useState('')
  const [newThemeName, setNewThemeName] = useState('')
  const [newThemeDescription, setNewThemeDescription] = useState('')
  const [newConcept, setNewConcept] = useState('')
  const [newPrompt, setNewPrompt] = useState('')
  const [editingThemeName, setEditingThemeName] = useState('')
  const [editingThemeDescription, setEditingThemeDescription] = useState('')
  const [editingQuestionId, setEditingQuestionId] = useState('')
  const [editingQuestionLanguage, setEditingQuestionLanguage] = useState('fr')
  const [editingQuestionValues, setEditingQuestionValues] = useState({
    concept: '',
    prompt: '',
    conceptTranslations: {},
    promptTranslations: {}
  })
  const [questionBusy, setQuestionBusy] = useState({})
  const [panelOpen, setPanelOpen] = useState({
    newTheme: false,
    addQuestion: true,
    themeQuestions: true
  })

  const selectedTheme = useMemo(
    () => themes.find((theme) => theme.id === selectedThemeId) || null,
    [themes, selectedThemeId]
  )

  const getTranslationValue = useCallback((translations, fallbackValue, lang) => {
    const map = translations && typeof translations === 'object' ? translations : {}
    return map[lang] || map.fr || map.en || fallbackValue || ''
  }, [])

  const getPrimaryValue = (translations, fallbackValue) => {
    const map = translations && typeof translations === 'object' ? translations : {}
    return map.fr || map.en || Object.values(map).find((value) => String(value || '').trim().length > 0) || fallbackValue || ''
  }

  const hasLangValue = (translations, lang, fallbackValue) => {
    const map = translations && typeof translations === 'object' ? translations : {}
    const value = map[lang]
    if (String(value || '').trim().length > 0) return true
    if (lang === 'fr' && String(fallbackValue || '').trim().length > 0) return true
    return false
  }

  useEffect(() => {
    setEditingQuestionLanguage(language === 'en' ? 'en' : 'fr')
  }, [language])

  const loadCatalog = useCallback(async () => {
    if (!advisor?.id) return
    try {
      setLoading(true)
      setError('')
      const rows = await getAdvisorQuestionBankCatalog(advisor.id)
      setThemes(rows || [])
      const first = rows?.[0]
      setSelectedThemeId((current) => (current && rows.some((theme) => theme.id === current) ? current : first?.id || ''))
    } catch (err) {
      console.error('Erreur chargement banque de questions:', err)
      setError(tr('Impossible de charger la banque de questions', 'Unable to load question bank'))
    } finally {
      setLoading(false)
    }
  }, [advisor?.id, tr])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    if (!selectedTheme) return
    setEditingThemeName(selectedTheme.name || '')
    setEditingThemeDescription(selectedTheme.description || '')
  }, [selectedTheme])

  const createTheme = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      await createAdvisorQuestionBankTheme({
        advisorId: advisor.id,
        name: newThemeName,
        description: newThemeDescription
      })
      setNewThemeName('')
      setNewThemeDescription('')
      await loadCatalog()
      setSuccess(tr('Theme cree', 'Theme created'))
    } catch (err) {
      setError(err.message || tr('Impossible de creer le theme', 'Unable to create theme'))
    } finally {
      setSaving(false)
    }
  }

  const saveTheme = async () => {
    if (!selectedTheme) return
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      await updateAdvisorQuestionBankTheme({
        advisorId: advisor.id,
        themeId: selectedTheme.id,
        name: editingThemeName,
        description: editingThemeDescription
      })
      await loadCatalog()
      setSuccess(tr('Theme mis a jour', 'Theme updated'))
    } catch (err) {
      setError(err.message || tr('Impossible de modifier le theme', 'Unable to update theme'))
    } finally {
      setSaving(false)
    }
  }

  const removeTheme = async () => {
    if (!selectedTheme) return
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      await deleteAdvisorQuestionBankTheme({ advisorId: advisor.id, themeId: selectedTheme.id })
      await loadCatalog()
      setSuccess(tr('Theme supprime', 'Theme deleted'))
    } catch (err) {
      setError(err.message || tr('Impossible de supprimer le theme', 'Unable to delete theme'))
    } finally {
      setSaving(false)
    }
  }

  const createQuestion = async () => {
    if (!selectedTheme) return
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      await createAdvisorQuestionBankQuestion({
        advisorId: advisor.id,
        themeId: selectedTheme.id,
        concept: newConcept,
        prompt: newPrompt
      })
      setNewConcept('')
      setNewPrompt('')
      await loadCatalog()
      setSuccess(tr('Question ajoutee', 'Question added'))
    } catch (err) {
      setError(err.message || tr('Impossible de creer la question', 'Unable to create question'))
    } finally {
      setSaving(false)
    }
  }

  const removeQuestion = async (questionId) => {
    try {
      setQuestionBusy((prev) => ({ ...prev, [questionId]: true }))
      setError('')
      setSuccess('')
      await deleteAdvisorQuestionBankQuestion({ advisorId: advisor.id, questionId })
      await loadCatalog()
      setSuccess(tr('Question supprimee', 'Question deleted'))
    } catch (err) {
      setError(err.message || tr('Impossible de supprimer la question', 'Unable to delete question'))
    } finally {
      setQuestionBusy((prev) => ({ ...prev, [questionId]: false }))
    }
  }

  const startEditQuestion = (question) => {
    const conceptTranslations = question.conceptTranslations || { fr: question.concept || '' }
    const promptTranslations = question.promptTranslations || { fr: question.prompt || '' }
    setEditingQuestionId(question.id)
    setEditingQuestionValues({
      concept: getPrimaryValue(conceptTranslations, question.concept || ''),
      prompt: getPrimaryValue(promptTranslations, question.prompt || ''),
      conceptTranslations,
      promptTranslations
    })
  }

  const cancelEditQuestion = () => {
    setEditingQuestionId('')
    setEditingQuestionValues({ concept: '', prompt: '', conceptTranslations: {}, promptTranslations: {} })
  }

  const updateEditingQuestionValue = (field, value) => {
    setEditingQuestionValues((prev) => {
      if (field === 'concept') {
        const conceptTranslations = { ...(prev.conceptTranslations || {}) }
        conceptTranslations[editingQuestionLanguage] = value
        return {
          ...prev,
          concept: getPrimaryValue(conceptTranslations, value),
          conceptTranslations
        }
      }

      const promptTranslations = { ...(prev.promptTranslations || {}) }
      promptTranslations[editingQuestionLanguage] = value
      return {
        ...prev,
        prompt: getPrimaryValue(promptTranslations, value),
        promptTranslations
      }
    })
  }

  const saveQuestion = async (question) => {
    try {
      setQuestionBusy((prev) => ({ ...prev, [question.id]: true }))
      setError('')
      setSuccess('')
      await updateAdvisorQuestionBankQuestion({
        advisorId: advisor.id,
        questionId: question.id,
        concept: getPrimaryValue(editingQuestionValues.conceptTranslations, editingQuestionValues.concept),
        prompt: getPrimaryValue(editingQuestionValues.promptTranslations, editingQuestionValues.prompt),
        conceptTranslations: editingQuestionValues.conceptTranslations,
        promptTranslations: editingQuestionValues.promptTranslations,
        options: question.options
      })
      await loadCatalog()
      cancelEditQuestion()
      setSuccess(tr('Question modifiee', 'Question updated'))
    } catch (err) {
      setError(err.message || tr('Impossible de modifier la question', 'Unable to update question'))
    } finally {
      setQuestionBusy((prev) => ({ ...prev, [question.id]: false }))
    }
  }

  const translateQuestionDraft = async (question, sourceLang, targetLang) => {
    try {
      setQuestionBusy((prev) => ({ ...prev, [question.id]: true }))
      setError('')
      setSuccess('')
      const conceptToTranslate = editingQuestionId === question.id ? editingQuestionValues.concept : question.concept
      const promptToTranslate = editingQuestionId === question.id ? editingQuestionValues.prompt : question.prompt
      const [conceptResult, promptResult] = await Promise.all([
        translateText({ text: conceptToTranslate, sourceLang, targetLang }),
        translateText({ text: promptToTranslate, sourceLang, targetLang })
      ])

      setEditingQuestionId(question.id)
      setEditingQuestionValues({
        concept: getPrimaryValue(
          {
            ...(editingQuestionId === question.id ? editingQuestionValues.conceptTranslations : question.conceptTranslations || {}),
            [targetLang]: conceptResult.translatedText || conceptToTranslate
          },
          conceptResult.translatedText || conceptToTranslate
        ),
        prompt: getPrimaryValue(
          {
            ...(editingQuestionId === question.id ? editingQuestionValues.promptTranslations : question.promptTranslations || {}),
            [targetLang]: promptResult.translatedText || promptToTranslate
          },
          promptResult.translatedText || promptToTranslate
        ),
        conceptTranslations: {
          ...(editingQuestionId === question.id ? editingQuestionValues.conceptTranslations : question.conceptTranslations || {}),
          [targetLang]: conceptResult.translatedText || conceptToTranslate
        },
        promptTranslations: {
          ...(editingQuestionId === question.id ? editingQuestionValues.promptTranslations : question.promptTranslations || {}),
          [targetLang]: promptResult.translatedText || promptToTranslate
        }
      })
      setEditingQuestionLanguage(targetLang)
      setSuccess(tr('Traduction pre-remplie, enregistrez la question', 'Translation prefilled, save the question'))
    } catch (err) {
      setError(err.message || tr('Impossible de traduire la question', 'Unable to translate question'))
    } finally {
      setQuestionBusy((prev) => ({ ...prev, [question.id]: false }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{tr('Chargement de la banque de questions...', 'Loading question bank...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{tr('Banque de questions', 'Question bank')}</h2>
        <p className="text-gray-600">{tr('Gerez ici vos themes et questions reutilisables dans tous vos questionnaires.', 'Manage reusable themes and questions for all your questionnaires.')}</p>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      {success ? <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{success}</div> : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
          <h3 className="font-bold text-gray-900">{tr('Themes', 'Themes')}</h3>
          <div className="space-y-2">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedThemeId(theme.id)}
                className={`w-full text-left rounded-lg border px-3 py-2 transition ${
                  selectedThemeId === theme.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <p className="font-semibold text-gray-800">{theme.name}</p>
                <p className="text-xs text-gray-600">{theme.questions?.length || 0} questions</p>
              </button>
            ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <button
              onClick={() => setPanelOpen((prev) => ({ ...prev, newTheme: !prev.newTheme }))}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-800"
            >
              {tr('Nouveau theme', 'New theme')}
              {panelOpen.newTheme ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
            </button>
            {panelOpen.newTheme ? (
              <>
                <input
                  type="text"
                  value={newThemeName}
                  onChange={(event) => setNewThemeName(event.target.value)}
                   placeholder={tr('Ex: Credit immobilier', 'Ex: Mortgage')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  value={newThemeDescription}
                  onChange={(event) => setNewThemeDescription(event.target.value)}
                   placeholder={tr('Description (optionnel)', 'Description (optional)')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={createTheme}
                  disabled={saving || newThemeName.trim().length < 2}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                   {tr('Creer le theme', 'Create theme')}
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-xl shadow-md p-6 space-y-4">
          {!selectedTheme ? (
             <p className="text-gray-600">{tr('Selectionnez un theme pour voir ses questions.', 'Select a theme to view its questions.')}</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={editingThemeName}
                  onChange={(event) => setEditingThemeName(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  value={editingThemeDescription}
                  onChange={(event) => setEditingThemeDescription(event.target.value)}
                   placeholder={tr('Description', 'Description')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveTheme}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                   {tr('Enregistrer le theme', 'Save theme')}
                </button>
                <button
                  onClick={removeTheme}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-300 text-red-700 font-semibold hover:bg-red-50 transition disabled:opacity-60"
                >
                  <Trash2 className="w-4 h-4" />
                   {tr('Supprimer le theme', 'Delete theme')}
                </button>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <button
                  onClick={() => setPanelOpen((prev) => ({ ...prev, addQuestion: !prev.addQuestion }))}
                  className="w-full flex items-center justify-between text-sm font-semibold text-gray-800"
                >
                  {tr('Ajouter une question a ce theme', 'Add a question to this theme')}
                  {panelOpen.addQuestion ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                </button>
                {panelOpen.addQuestion ? (
                  <>
                    <input
                      type="text"
                      value={newConcept}
                      onChange={(event) => setNewConcept(event.target.value)}
                       placeholder={tr('Concept', 'Concept')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                    />
                    <textarea
                      rows={3}
                      value={newPrompt}
                      onChange={(event) => setNewPrompt(event.target.value)}
                       placeholder={tr('Texte de la question', 'Question text')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                    />
                    <button
                      onClick={createQuestion}
                      disabled={saving || newConcept.trim().length < 2 || newPrompt.trim().length < 6}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-60"
                    >
                      <Plus className="w-4 h-4" />
                       {tr('Ajouter la question', 'Add question')}
                    </button>
                    <p className="text-xs text-gray-500">
                      {tr('Astuce: creez en FR puis utilisez FR -> EN pour ajouter la version anglaise.', 'Tip: create in FR then use FR -> EN to add the English version.')}
                    </p>
                  </>
                ) : null}
              </div>

              <div className="space-y-2">
                 <button
                  onClick={() => setPanelOpen((prev) => ({ ...prev, themeQuestions: !prev.themeQuestions }))}
                  className="flex items-center gap-2 font-semibold text-gray-900"
                >
                  <span>{tr('Questions du theme', 'Theme questions')} ({selectedTheme.questions?.length || 0})</span>
                  {panelOpen.themeQuestions ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                </button>
                {!panelOpen.themeQuestions ? null : (selectedTheme.questions || []).length === 0 ? (
                   <p className="text-sm text-gray-600">{tr('Aucune question dans ce theme.', 'No questions in this theme.')}</p>
                ) : (
                  <div className="space-y-2">
                    {(selectedTheme.questions || []).map((question) => (
                      <div key={question.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            {editingQuestionId === question.id ? (
                              <>
                                <input
                                  type="text"
                                  value={getTranslationValue(
                                    editingQuestionValues.conceptTranslations,
                                    editingQuestionValues.concept,
                                    editingQuestionLanguage
                                  )}
                                  onChange={(event) => updateEditingQuestionValue('concept', event.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                  placeholder={tr('Concept', 'Concept')}
                                />
                                <textarea
                                  rows={3}
                                  value={getTranslationValue(
                                    editingQuestionValues.promptTranslations,
                                    editingQuestionValues.prompt,
                                    editingQuestionLanguage
                                  )}
                                  onChange={(event) => updateEditingQuestionValue('prompt', event.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                  placeholder={tr('Texte de la question', 'Question text')}
                                />
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-gray-600">{tr('Langue editee', 'Editing language')}</label>
                                  <select
                                    value={editingQuestionLanguage}
                                    onChange={(event) => setEditingQuestionLanguage(event.target.value)}
                                    className="px-2 py-1 border border-gray-300 rounded-md text-xs bg-white"
                                  >
                                    <option value="fr">FR</option>
                                    <option value="en">EN</option>
                                  </select>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold text-gray-800">{getTranslationValue(question.conceptTranslations, question.concept, language)}</p>
                                <p className="text-sm text-gray-700">{getTranslationValue(question.promptTranslations, question.prompt, language)}</p>
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <span
                                    className={`px-2 py-0.5 text-xs rounded-full ${
                                      hasLangValue(question.promptTranslations, 'fr', question.prompt)
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    {hasLangValue(question.promptTranslations, 'fr', question.prompt)
                                      ? tr('FR OK', 'FR ready')
                                      : tr('FR manquant', 'FR missing')}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 text-xs rounded-full ${
                                      hasLangValue(question.promptTranslations, 'en')
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {hasLangValue(question.promptTranslations, 'en')
                                      ? tr('EN OK', 'EN ready')
                                      : tr('EN manquant', 'EN missing')}
                                  </span>
                                </div>
                              </>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => translateQuestionDraft(question, 'fr', 'en')}
                                disabled={Boolean(questionBusy[question.id])}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                              >
                                <Languages className="w-3 h-3" />
                                FR -&gt; EN
                              </button>
                              <button
                                onClick={() => translateQuestionDraft(question, 'en', 'fr')}
                                disabled={Boolean(questionBusy[question.id])}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                              >
                                <Languages className="w-3 h-3" />
                                EN -&gt; FR
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {editingQuestionId === question.id ? (
                              <>
                                <button
                                  onClick={() => saveQuestion(question)}
                                  disabled={
                                    Boolean(questionBusy[question.id]) ||
                                    getPrimaryValue(editingQuestionValues.conceptTranslations, editingQuestionValues.concept).trim().length < 2 ||
                                    getPrimaryValue(editingQuestionValues.promptTranslations, editingQuestionValues.prompt).trim().length < 6
                                  }
                                  className="text-sm text-purple-700 hover:text-purple-800 font-semibold disabled:opacity-60"
                                >
                                  {tr('Enregistrer', 'Save')}
                                </button>
                                <button
                                  onClick={cancelEditQuestion}
                                  disabled={Boolean(questionBusy[question.id])}
                                  className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700 font-semibold disabled:opacity-60"
                                >
                                  <X className="w-3 h-3" />
                                  {tr('Annuler', 'Cancel')}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => startEditQuestion(question)}
                                disabled={Boolean(questionBusy[question.id])}
                                className="inline-flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 font-semibold disabled:opacity-60"
                              >
                                <Pencil className="w-3 h-3" />
                                {tr('Modifier', 'Edit')}
                              </button>
                            )}
                            <button
                              onClick={() => removeQuestion(question.id)}
                              disabled={Boolean(questionBusy[question.id])}
                              className="text-sm text-red-600 hover:text-red-700 font-semibold disabled:opacity-60"
                            >
                              {tr('Supprimer', 'Delete')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
