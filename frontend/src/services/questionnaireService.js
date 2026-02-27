import { supabase } from '@/lib/supabase'
import { clientQuizQuestions } from '@/data/clientQuizQuestions'

const DEFAULT_OPTIONS = [
  { label: 'Jamais', points: 1 },
  { label: 'Rarement', points: 2 },
  { label: 'Parfois', points: 3 },
  { label: 'Souvent', points: 4 },
  { label: 'Toujours', points: 5 }
]

const QUESTION_BANK = {
  budget: [
    { concept: 'Budget mensuel', prompt: 'Suivez-vous un budget mensuel detaille ?', options: DEFAULT_OPTIONS },
    { concept: 'Depenses', prompt: 'Analysez-vous vos depenses fixes et variables ?', options: DEFAULT_OPTIONS }
  ],
  epargne: [
    { concept: 'Epargne de precaution', prompt: "Disposez-vous d'une epargne de securite ?", options: DEFAULT_OPTIONS },
    { concept: 'Objectifs', prompt: 'Avez-vous des objectifs d epargne formalises ?', options: DEFAULT_OPTIONS }
  ],
  investissement: [
    { concept: 'Diversification', prompt: 'Comprenez-vous la diversification de portefeuille ?', options: DEFAULT_OPTIONS },
    { concept: 'Risque', prompt: 'Connaissez-vous votre profil de risque investisseur ?', options: DEFAULT_OPTIONS }
  ],
  protection: [
    { concept: 'Assurance', prompt: 'Votre protection assurance est-elle a jour ?', options: DEFAULT_OPTIONS },
    { concept: 'Prevoyance', prompt: 'Avez-vous anticipe les aleas de revenus ?', options: DEFAULT_OPTIONS }
  ],
  fiscalite: [
    { concept: 'Fiscalite', prompt: "Connaissez-vous vos leviers d'optimisation fiscale ?", options: DEFAULT_OPTIONS },
    { concept: 'Patrimoine', prompt: 'Votre structure patrimoniale est-elle fiscalement optimisee ?', options: DEFAULT_OPTIONS }
  ],
  retraite: [
    { concept: 'Preparation retraite', prompt: 'Avez-vous un plan retraite chiffre ?', options: DEFAULT_OPTIONS },
    { concept: 'Projection', prompt: 'Avez-vous estime vos besoins de revenus a la retraite ?', options: DEFAULT_OPTIONS }
  ]
}

const DEFAULT_TEMPLATES = [
  {
    key: 'starter',
    name: 'Diagnostic essentiel',
    description: 'Questionnaire global rapide pour premier entretien',
    isDefault: true,
    questions: clientQuizQuestions.map((question, index) => ({
      questionText: question.prompt,
      concept: question.concept,
      theme: 'general',
      orderIndex: index,
      options: question.options
    }))
  },
  {
    key: 'patrimoine',
    name: 'Bilan patrimonial',
    description: 'Focus epargne, investissement, fiscalite et retraite',
    isDefault: false,
    questions: [
      ...QUESTION_BANK.epargne,
      ...QUESTION_BANK.investissement,
      ...QUESTION_BANK.fiscalite,
      ...QUESTION_BANK.retraite
    ].map((question, index) => ({
      questionText: question.prompt,
      concept: question.concept,
      theme: index < 2 ? 'epargne' : index < 4 ? 'investissement' : index < 6 ? 'fiscalite' : 'retraite',
      orderIndex: index,
      options: question.options
    }))
  },
  {
    key: 'suivi',
    name: 'Suivi relation client',
    description: 'Questionnaire court pour bilan trimestriel',
    isDefault: false,
    questions: [
      QUESTION_BANK.budget[0],
      QUESTION_BANK.epargne[0],
      QUESTION_BANK.protection[0],
      QUESTION_BANK.investissement[1]
    ].map((question, index) => ({
      questionText: question.prompt,
      concept: question.concept,
      theme: ['budget', 'epargne', 'protection', 'investissement'][index],
      orderIndex: index,
      options: question.options
    }))
  }
]

const isMissingQuestionnaireTableError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes("could not find the table 'public.advisor_questionnaires'") ||
    message.includes('relation "public.advisor_questionnaires" does not exist')
  )
}

const mapQuestionRow = (row) => ({
  id: row.id,
  questionText: row.question_text,
  concept: row.concept,
  theme: row.theme,
  orderIndex: row.order_index,
  options: Array.isArray(row.options) && row.options.length > 0 ? row.options : DEFAULT_OPTIONS
})

const normalizeQuestions = (questions) =>
  (questions || [])
    .map((question, index) => ({
      questionText: String(question.questionText || question.prompt || '').trim(),
      concept: String(question.concept || 'General').trim(),
      theme: String(question.theme || 'general').trim().toLowerCase(),
      orderIndex: typeof question.orderIndex === 'number' ? question.orderIndex : index,
      options: Array.isArray(question.options) && question.options.length > 0 ? question.options : DEFAULT_OPTIONS
    }))
    .filter((question) => question.questionText.length > 0)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((question, index) => ({ ...question, orderIndex: index }))

const insertQuestionnaireWithQuestions = async (advisorId, template) => {
  const { data: questionnaire, error } = await supabase
    .from('advisor_questionnaires')
    .insert([
      {
        advisor_id: advisorId,
        name: template.name,
        description: template.description,
        is_default: Boolean(template.isDefault)
      }
    ])
    .select('*')
    .single()

  if (error) throw error

  const rows = normalizeQuestions(template.questions).map((question) => ({
    questionnaire_id: questionnaire.id,
    question_text: question.questionText,
    concept: question.concept,
    theme: question.theme,
    order_index: question.orderIndex,
    options: question.options
  }))

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('advisor_questionnaire_questions').insert(rows)
    if (insertError) throw insertError
  }

  return questionnaire
}

export const getQuestionBankByTheme = () => QUESTION_BANK

export const getDefaultQuestionnaireTemplates = () => DEFAULT_TEMPLATES

export const ensureAdvisorQuestionnaires = async (advisorId) => {
  if (!advisorId) return

  const { data, error } = await supabase
    .from('advisor_questionnaires')
    .select('id')
    .eq('advisor_id', advisorId)
    .limit(1)

  if (error) {
    if (isMissingQuestionnaireTableError(error)) return
    throw error
  }

  if (Array.isArray(data) && data.length > 0) return

  for (const template of DEFAULT_TEMPLATES) {
    // Sequential insert for deterministic first default questionnaire
    // and easier troubleshooting if one template fails.
    await insertQuestionnaireWithQuestions(advisorId, template)
  }
}

export const getAdvisorQuestionnaires = async (advisorId) => {
  if (!advisorId) return []

  await ensureAdvisorQuestionnaires(advisorId)

  const { data: questionnaires, error } = await supabase
    .from('advisor_questionnaires')
    .select('id, advisor_id, name, description, is_default, created_at, updated_at')
    .eq('advisor_id', advisorId)
    .order('created_at', { ascending: true })

  if (error) {
    if (isMissingQuestionnaireTableError(error)) return []
    throw error
  }

  if (!questionnaires || questionnaires.length === 0) return []

  const ids = questionnaires.map((item) => item.id)
  const { data: questions, error: questionsError } = await supabase
    .from('advisor_questionnaire_questions')
    .select('id, questionnaire_id, question_text, concept, theme, order_index, options')
    .in('questionnaire_id', ids)
    .order('order_index', { ascending: true })

  if (questionsError) throw questionsError

  const byQuestionnaire = new Map()
  ;(questions || []).forEach((row) => {
    const existing = byQuestionnaire.get(row.questionnaire_id) || []
    existing.push(mapQuestionRow(row))
    byQuestionnaire.set(row.questionnaire_id, existing)
  })

  return questionnaires.map((questionnaire) => ({
    ...questionnaire,
    questions: byQuestionnaire.get(questionnaire.id) || []
  }))
}

export const createAdvisorQuestionnaireFromTemplate = async ({ advisorId, templateKey, customName }) => {
  if (!advisorId) throw new Error('Conseiller introuvable')
  const template = DEFAULT_TEMPLATES.find((item) => item.key === templateKey)
  if (!template) throw new Error('Template introuvable')

  const created = await insertQuestionnaireWithQuestions(advisorId, {
    ...template,
    name: customName?.trim() || template.name,
    isDefault: false
  })

  return created
}

export const createCustomAdvisorQuestionnaire = async ({ advisorId, name, description }) => {
  if (!advisorId) throw new Error('Conseiller introuvable')
  const cleanName = String(name || '').trim()
  if (!cleanName) throw new Error('Le nom du questionnaire est requis')

  const { data, error } = await supabase
    .from('advisor_questionnaires')
    .insert([
      {
        advisor_id: advisorId,
        name: cleanName,
        description: String(description || '').trim(),
        is_default: false
      }
    ])
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const updateAdvisorQuestionnaire = async ({ advisorId, questionnaireId, name, description, questions }) => {
  if (!advisorId || !questionnaireId) throw new Error('Questionnaire introuvable')

  const cleanName = String(name || '').trim()
  if (!cleanName) throw new Error('Le nom du questionnaire est requis')

  const { data, error } = await supabase
    .from('advisor_questionnaires')
    .update({
      name: cleanName,
      description: String(description || '').trim()
    })
    .eq('id', questionnaireId)
    .eq('advisor_id', advisorId)
    .select('*')
    .single()

  if (error) throw error

  const { error: deleteError } = await supabase
    .from('advisor_questionnaire_questions')
    .delete()
    .eq('questionnaire_id', questionnaireId)

  if (deleteError) throw deleteError

  const rows = normalizeQuestions(questions).map((question) => ({
    questionnaire_id: questionnaireId,
    question_text: question.questionText,
    concept: question.concept,
    theme: question.theme,
    order_index: question.orderIndex,
    options: question.options
  }))

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('advisor_questionnaire_questions').insert(rows)
    if (insertError) throw insertError
  }

  return data
}

export const setAdvisorDefaultQuestionnaire = async ({ advisorId, questionnaireId }) => {
  if (!advisorId || !questionnaireId) throw new Error('Questionnaire introuvable')

  const { error: resetError } = await supabase
    .from('advisor_questionnaires')
    .update({ is_default: false })
    .eq('advisor_id', advisorId)

  if (resetError) throw resetError

  const { data, error } = await supabase
    .from('advisor_questionnaires')
    .update({ is_default: true })
    .eq('id', questionnaireId)
    .eq('advisor_id', advisorId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const deleteAdvisorQuestionnaire = async ({ advisorId, questionnaireId }) => {
  if (!advisorId || !questionnaireId) throw new Error('Questionnaire introuvable')

  const { data: allQuestionnaires, error: listError } = await supabase
    .from('advisor_questionnaires')
    .select('id, is_default')
    .eq('advisor_id', advisorId)

  if (listError) throw listError
  if (!allQuestionnaires || allQuestionnaires.length <= 1) {
    throw new Error('Au moins un questionnaire doit rester disponible')
  }

  const current = allQuestionnaires.find((item) => item.id === questionnaireId)

  const { error } = await supabase
    .from('advisor_questionnaires')
    .delete()
    .eq('id', questionnaireId)
    .eq('advisor_id', advisorId)

  if (error) throw error

  if (current?.is_default) {
    const fallback = allQuestionnaires.find((item) => item.id !== questionnaireId)
    if (fallback) {
      await setAdvisorDefaultQuestionnaire({ advisorId, questionnaireId: fallback.id })
    }
  }

  return { success: true }
}
