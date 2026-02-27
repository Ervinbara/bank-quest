import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  createAdvisorQuestionBankQuestion,
  createAdvisorQuestionBankTheme,
  deleteAdvisorQuestionBankQuestion,
  deleteAdvisorQuestionBankTheme,
  getAdvisorQuestionBankCatalog,
  updateAdvisorQuestionBankTheme
} from '@/services/questionnaireService'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'

export default function QuestionBank() {
  const { advisor } = useAuth()
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

  const selectedTheme = useMemo(
    () => themes.find((theme) => theme.id === selectedThemeId) || null,
    [themes, selectedThemeId]
  )

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
      setError('Impossible de charger la banque de questions')
    } finally {
      setLoading(false)
    }
  }, [advisor?.id])

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
      setSuccess('Theme cree')
    } catch (err) {
      setError(err.message || 'Impossible de creer le theme')
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
      setSuccess('Theme mis a jour')
    } catch (err) {
      setError(err.message || 'Impossible de modifier le theme')
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
      setSuccess('Theme supprime')
    } catch (err) {
      setError(err.message || 'Impossible de supprimer le theme')
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
      setSuccess('Question ajoutee')
    } catch (err) {
      setError(err.message || 'Impossible de creer la question')
    } finally {
      setSaving(false)
    }
  }

  const removeQuestion = async (questionId) => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      await deleteAdvisorQuestionBankQuestion({ advisorId: advisor.id, questionId })
      await loadCatalog()
      setSuccess('Question supprimee')
    } catch (err) {
      setError(err.message || 'Impossible de supprimer la question')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de la banque de questions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Banque de questions</h2>
        <p className="text-gray-600">Gerez ici vos themes et questions reutilisables dans tous vos questionnaires.</p>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      {success ? <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{success}</div> : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
          <h3 className="font-bold text-gray-900">Themes</h3>
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
            <p className="text-sm font-semibold text-gray-800">Nouveau theme</p>
            <input
              type="text"
              value={newThemeName}
              onChange={(event) => setNewThemeName(event.target.value)}
              placeholder="Ex: Credit immobilier"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              value={newThemeDescription}
              onChange={(event) => setNewThemeDescription(event.target.value)}
              placeholder="Description (optionnel)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={createTheme}
              disabled={saving || newThemeName.trim().length < 2}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              Creer le theme
            </button>
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-xl shadow-md p-6 space-y-4">
          {!selectedTheme ? (
            <p className="text-gray-600">Selectionnez un theme pour voir ses questions.</p>
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
                  placeholder="Description"
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
                  Enregistrer le theme
                </button>
                <button
                  onClick={removeTheme}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-300 text-red-700 font-semibold hover:bg-red-50 transition disabled:opacity-60"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer le theme
                </button>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <p className="text-sm font-semibold text-gray-800">Ajouter une question a ce theme</p>
                <input
                  type="text"
                  value={newConcept}
                  onChange={(event) => setNewConcept(event.target.value)}
                  placeholder="Concept"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                />
                <textarea
                  rows={3}
                  value={newPrompt}
                  onChange={(event) => setNewPrompt(event.target.value)}
                  placeholder="Texte de la question"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                />
                <button
                  onClick={createQuestion}
                  disabled={saving || newConcept.trim().length < 2 || newPrompt.trim().length < 6}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter la question
                </button>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-gray-900">Questions du theme ({selectedTheme.questions?.length || 0})</p>
                {(selectedTheme.questions || []).length === 0 ? (
                  <p className="text-sm text-gray-600">Aucune question dans ce theme.</p>
                ) : (
                  <div className="space-y-2">
                    {(selectedTheme.questions || []).map((question) => (
                      <div key={question.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-800">{question.concept}</p>
                            <p className="text-sm text-gray-700">{question.prompt}</p>
                          </div>
                          <button
                            onClick={() => removeQuestion(question.id)}
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
