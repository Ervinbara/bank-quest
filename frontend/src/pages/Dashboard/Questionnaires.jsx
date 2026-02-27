import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
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
import { Loader2, Plus, Save, Star, Trash2 } from 'lucide-react'

const DEFAULT_EDIT_OPTIONS = [
  { label: 'Jamais', points: 1 },
  { label: 'Rarement', points: 2 },
  { label: 'Parfois', points: 3 },
  { label: 'Souvent', points: 4 },
  { label: 'Toujours', points: 5 }
]

export default function Questionnaires() {
  const { advisor } = useAuth()
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

  const templates = useMemo(() => getDefaultQuestionnaireTemplates(), [])
  const bankByTheme = useMemo(() => getQuestionBankByTheme(), [])
  const bankThemes = useMemo(() => Object.keys(bankByTheme), [bankByTheme])

  const selectedQuestionnaire = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId]
  )

  const loadAll = useCallback(async () => {
    if (!advisor?.id) return

    try {
      setLoading(true)
      setError(null)
      const rows = await getAdvisorQuestionnaires(advisor.id)
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
      setError('Impossible de charger les questionnaires')
    } finally {
      setLoading(false)
    }
  }, [advisor?.id])

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
      setSuccess('Questionnaire cree depuis template')
    } catch (err) {
      setError(err.message || 'Impossible de creer le questionnaire')
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
      setSuccess('Questionnaire vide cree')
    } catch (err) {
      setError(err.message || 'Impossible de creer le questionnaire')
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
        questionText: question.prompt,
        concept: question.concept,
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
      setSuccess('Questionnaire enregistre')
    } catch (err) {
      setError(err.message || "Impossible d'enregistrer le questionnaire")
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
      setSuccess('Questionnaire par defaut mis a jour')
    } catch (err) {
      setError(err.message || 'Impossible de definir le questionnaire par defaut')
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
      setSuccess('Questionnaire supprime')
    } catch (err) {
      setError(err.message || 'Impossible de supprimer le questionnaire')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des questionnaires...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Questionnaires</h2>
        <p className="text-gray-600">Creez vos propres questionnaires, partez de templates et reutilisez la banque de questions.</p>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      {success ? <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{success}</div> : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
          <h3 className="font-bold text-gray-900">Vos questionnaires</h3>
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
            <p className="text-sm font-semibold text-gray-800">Creer depuis un template</p>
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
              placeholder="Nom personnalise (optionnel)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={createFromTemplate}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Ajouter depuis template
            </button>
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-semibold text-gray-800">Creer un questionnaire vide</p>
            <input
              type="text"
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="Ex: Questionnaire premium"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={createCustom}
              disabled={saving || customName.trim().length < 3}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              Creer vide
            </button>
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-xl shadow-md p-6 space-y-4">
          {!draft || !selectedQuestionnaire ? (
            <p className="text-gray-600">Selectionnez un questionnaire pour le modifier.</p>
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
                    Par defaut
                  </button>
                  <button
                    onClick={() => removeQuestionnaire(selectedQuestionnaire.id)}
                    disabled={saving}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-300 text-red-700 font-semibold hover:bg-red-50 transition disabled:opacity-60"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <p className="text-sm font-semibold text-gray-800">Ajouter depuis la banque de questions</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
                        {theme}
                      </option>
                    ))}
                  </select>
                  <select
                    value={bankQuestionIndex}
                    onChange={(event) => setBankQuestionIndex(Number(event.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white md:col-span-2"
                  >
                    {(bankByTheme[bankTheme] || []).map((question, index) => (
                      <option key={`${bankTheme}-${index}`} value={index}>
                        {question.prompt}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={addBankQuestion}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-white transition"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter la question
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">Questions ({draft.questions.length})</p>
                  <button
                    onClick={addCustomQuestion}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une question
                  </button>
                </div>

                {draft.questions.length === 0 ? (
                  <p className="text-sm text-gray-600">Ajoutez des questions pour activer ce questionnaire.</p>
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
                            placeholder="Concept"
                            className="px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <input
                            type="text"
                            value={question.theme || ''}
                            onChange={(event) => updateQuestionField(index, 'theme', event.target.value)}
                            placeholder="Theme"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <button
                            onClick={() => removeQuestion(index)}
                            className="text-sm text-red-600 hover:text-red-700 font-semibold"
                          >
                            Supprimer
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
                  Enregistrer les modifications
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
