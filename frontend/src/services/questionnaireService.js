import { supabase } from '@/lib/supabase'
import { clientQuizQuestions } from '@/data/clientQuizQuestions'

const DEFAULT_OPTIONS = [
  { label: 'Jamais', points: 1 },
  { label: 'Rarement', points: 2 },
  { label: 'Parfois', points: 3 },
  { label: 'Souvent', points: 4 },
  { label: 'Toujours', points: 5 }
]

const DEFAULT_QUESTION_LANGUAGE = 'fr'

const sanitizeTranslations = (translations, fallbackText) => {
  const result = {}
  if (translations && typeof translations === 'object' && !Array.isArray(translations)) {
    Object.entries(translations).forEach(([lang, value]) => {
      const cleanLang = String(lang || '').trim().toLowerCase()
      const cleanValue = String(value || '').trim()
      if (!cleanLang || !cleanValue) return
      result[cleanLang] = cleanValue
    })
  }
  const cleanFallback = String(fallbackText || '').trim()
  if (cleanFallback && !result[DEFAULT_QUESTION_LANGUAGE]) {
    result[DEFAULT_QUESTION_LANGUAGE] = cleanFallback
  }
  return result
}

const getTranslatedValue = (translations, lang, fallbackValue) => {
  const cleanLang = String(lang || DEFAULT_QUESTION_LANGUAGE).trim().toLowerCase()
  const map = translations && typeof translations === 'object' ? translations : {}
  return (
    map[cleanLang] ||
    map[DEFAULT_QUESTION_LANGUAGE] ||
    map.en ||
    Object.values(map).find((value) => typeof value === 'string' && value.trim().length > 0) ||
    fallbackValue ||
    ''
  )
}

const DEFAULT_BANK_THEMES = [
  { code: 'budget', name: 'Budget', description: 'Gestion budget et depenses' },
  { code: 'epargne', name: 'Epargne', description: 'Reserve, objectifs et discipline' },
  { code: 'investissement', name: 'Investissement', description: 'Risque, allocation et diversification' },
  { code: 'protection', name: 'Protection', description: 'Assurance et prevoyance' },
  { code: 'fiscalite', name: 'Fiscalite', description: 'Leviers fiscaux et optimisation' },
  { code: 'retraite', name: 'Retraite', description: 'Preparation et projection retraite' },
  { code: 'general', name: 'General', description: 'Questions transverses' }
]

const DEFAULT_BANK_QUESTIONS = {
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
  ],
  general: [
    { concept: 'Vision financiere', prompt: 'Avez-vous une vision claire de vos objectifs financiers ?', options: DEFAULT_OPTIONS }
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
      ...DEFAULT_BANK_QUESTIONS.epargne,
      ...DEFAULT_BANK_QUESTIONS.investissement,
      ...DEFAULT_BANK_QUESTIONS.fiscalite,
      ...DEFAULT_BANK_QUESTIONS.retraite
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
      DEFAULT_BANK_QUESTIONS.budget[0],
      DEFAULT_BANK_QUESTIONS.epargne[0],
      DEFAULT_BANK_QUESTIONS.protection[0],
      DEFAULT_BANK_QUESTIONS.investissement[1]
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

const isMissingQuestionBankTableError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes("could not find the table 'public.advisor_question_bank_themes'") ||
    message.includes('relation "public.advisor_question_bank_themes" does not exist')
  )
}

const mapQuestionRow = (row) => ({
  id: row.id,
  questionText: getTranslatedValue(row.prompt_translations, DEFAULT_QUESTION_LANGUAGE, row.question_text),
  concept: getTranslatedValue(row.concept_translations, DEFAULT_QUESTION_LANGUAGE, row.concept),
  promptTranslations: sanitizeTranslations(row.prompt_translations, row.question_text),
  conceptTranslations: sanitizeTranslations(row.concept_translations, row.concept),
  theme: row.theme,
  orderIndex: row.order_index,
  options: Array.isArray(row.options) && row.options.length > 0 ? row.options : DEFAULT_OPTIONS
})

const normalizeQuestions = (questions) =>
  (questions || [])
    .map((question, index) => ({
      promptTranslations: sanitizeTranslations(
        question.promptTranslations || question.questionTranslations,
        question.questionText || question.prompt
      ),
      conceptTranslations: sanitizeTranslations(question.conceptTranslations, question.concept || 'General'),
      theme: String(question.theme || 'general').trim().toLowerCase(),
      orderIndex: typeof question.orderIndex === 'number' ? question.orderIndex : index,
      options: Array.isArray(question.options) && question.options.length > 0 ? question.options : DEFAULT_OPTIONS
    }))
    .map((question) => ({
      ...question,
      questionText: String(getTranslatedValue(question.promptTranslations, DEFAULT_QUESTION_LANGUAGE, '')).trim(),
      concept: String(getTranslatedValue(question.conceptTranslations, DEFAULT_QUESTION_LANGUAGE, 'General')).trim()
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
    prompt_translations: question.promptTranslations,
    concept_translations: question.conceptTranslations,
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

const getLocalQuestionBankFallback = () => {
  const result = {}
  Object.keys(DEFAULT_BANK_QUESTIONS).forEach((themeCode) => {
    result[themeCode] = DEFAULT_BANK_QUESTIONS[themeCode].map((question, index) => ({
      id: `${themeCode}-${index}`,
      concept: question.concept,
      prompt: question.prompt,
      conceptTranslations: { fr: question.concept },
      promptTranslations: { fr: question.prompt },
      options: question.options || DEFAULT_OPTIONS
    }))
  })
  return result
}

const mapQuestionBankRows = (themes, questions) => {
  const mapByTheme = new Map()
  ;(themes || []).forEach((theme) => {
    mapByTheme.set(theme.id, {
      id: theme.id,
      code: theme.code,
      name: theme.name,
      description: theme.description || '',
      questions: []
    })
  })

  ;(questions || []).forEach((question) => {
    const theme = mapByTheme.get(question.theme_id)
    if (!theme) return
    theme.questions.push({
      id: question.id,
      concept: getTranslatedValue(question.concept_translations, DEFAULT_QUESTION_LANGUAGE, question.concept),
      prompt: getTranslatedValue(question.prompt_translations, DEFAULT_QUESTION_LANGUAGE, question.prompt),
      conceptTranslations: sanitizeTranslations(question.concept_translations, question.concept),
      promptTranslations: sanitizeTranslations(question.prompt_translations, question.prompt),
      options: Array.isArray(question.options) && question.options.length > 0 ? question.options : DEFAULT_OPTIONS
    })
  })

  return [...mapByTheme.values()]
}

const ensureAdvisorQuestionBank = async (advisorId) => {
  if (!advisorId) return

  const { data: existing, error: existingError } = await supabase
    .from('advisor_question_bank_themes')
    .select('id')
    .eq('advisor_id', advisorId)
    .limit(1)

  if (existingError) {
    if (isMissingQuestionBankTableError(existingError)) return
    throw existingError
  }

  if (existing && existing.length > 0) return

  const { data: insertedThemes, error: themeInsertError } = await supabase
    .from('advisor_question_bank_themes')
    .insert(
      DEFAULT_BANK_THEMES.map((theme) => ({
        advisor_id: advisorId,
        code: theme.code,
        name: theme.name,
        description: theme.description
      }))
    )
    .select('id, code')

  if (themeInsertError) throw themeInsertError

  const themeIdByCode = new Map((insertedThemes || []).map((theme) => [theme.code, theme.id]))
  const rows = []
  Object.entries(DEFAULT_BANK_QUESTIONS).forEach(([code, questions]) => {
    const themeId = themeIdByCode.get(code)
    if (!themeId) return
    questions.forEach((question) => {
      rows.push({
        theme_id: themeId,
        concept: question.concept,
        prompt: question.prompt,
        concept_translations: { fr: question.concept },
        prompt_translations: { fr: question.prompt },
        options: question.options || DEFAULT_OPTIONS
      })
    })
  })

  if (rows.length > 0) {
    const { error: questionInsertError } = await supabase.from('advisor_question_bank_questions').insert(rows)
    if (questionInsertError) throw questionInsertError
  }
}

export const getAdvisorQuestionBankCatalog = async (advisorId) => {
  if (!advisorId) return []

  await ensureAdvisorQuestionBank(advisorId)

  const { data: themes, error: themesError } = await supabase
    .from('advisor_question_bank_themes')
    .select('id, code, name, description')
    .eq('advisor_id', advisorId)
    .order('name', { ascending: true })

  if (themesError) {
    if (isMissingQuestionBankTableError(themesError)) {
      return Object.entries(getLocalQuestionBankFallback()).map(([code, rows]) => ({
        id: code,
        code,
        name: code,
        description: '',
        questions: rows
      }))
    }
    throw themesError
  }

  if (!themes || themes.length === 0) return []

  const themeIds = themes.map((theme) => theme.id)
  const { data: questions, error: questionsError } = await supabase
    .from('advisor_question_bank_questions')
    .select('id, theme_id, concept, prompt, concept_translations, prompt_translations, options')
    .in('theme_id', themeIds)
    .order('created_at', { ascending: true })

  if (questionsError) throw questionsError

  return mapQuestionBankRows(themes, questions)
}

export const getQuestionBankByTheme = async (advisorId) => {
  const catalog = await getAdvisorQuestionBankCatalog(advisorId)
  const byTheme = {}
  catalog.forEach((theme) => {
    byTheme[theme.code] = theme.questions.map((question) => ({
      id: question.id,
      concept: question.concept,
      prompt: question.prompt,
      conceptTranslations: question.conceptTranslations,
      promptTranslations: question.promptTranslations,
      options: question.options
    }))
  })
  return byTheme
}

export const createAdvisorQuestionBankTheme = async ({ advisorId, name, description }) => {
  if (!advisorId) throw new Error('Conseiller introuvable')
  const cleanName = String(name || '').trim()
  if (!cleanName) throw new Error('Le nom du theme est requis')

  const code = cleanName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  const { data, error } = await supabase
    .from('advisor_question_bank_themes')
    .insert([
      {
        advisor_id: advisorId,
        code: code || `theme_${Date.now()}`,
        name: cleanName,
        description: String(description || '').trim()
      }
    ])
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const updateAdvisorQuestionBankTheme = async ({ advisorId, themeId, name, description }) => {
  if (!advisorId || !themeId) throw new Error('Theme introuvable')

  const cleanName = String(name || '').trim()
  if (!cleanName) throw new Error('Le nom du theme est requis')

  const { data, error } = await supabase
    .from('advisor_question_bank_themes')
    .update({
      name: cleanName,
      description: String(description || '').trim()
    })
    .eq('id', themeId)
    .eq('advisor_id', advisorId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const deleteAdvisorQuestionBankTheme = async ({ advisorId, themeId }) => {
  if (!advisorId || !themeId) throw new Error('Theme introuvable')

  const { data: allThemes, error: listError } = await supabase
    .from('advisor_question_bank_themes')
    .select('id')
    .eq('advisor_id', advisorId)

  if (listError) throw listError
  if (!allThemes || allThemes.length <= 1) {
    throw new Error('Au moins un theme doit rester disponible')
  }

  const { error } = await supabase
    .from('advisor_question_bank_themes')
    .delete()
    .eq('id', themeId)
    .eq('advisor_id', advisorId)

  if (error) throw error
  return { success: true }
}

export const createAdvisorQuestionBankQuestion = async ({
  advisorId,
  themeId,
  concept,
  prompt,
  conceptTranslations,
  promptTranslations,
  options
}) => {
  if (!advisorId || !themeId) throw new Error('Theme introuvable')
  const cleanConcept = String(concept || '').trim()
  const cleanPrompt = String(prompt || '').trim()

  if (!cleanConcept) throw new Error('Le concept est requis')
  if (!cleanPrompt) throw new Error('La question est requise')

  const { data: theme, error: themeError } = await supabase
    .from('advisor_question_bank_themes')
    .select('id')
    .eq('id', themeId)
    .eq('advisor_id', advisorId)
    .maybeSingle()

  if (themeError) throw themeError
  if (!theme) throw new Error('Theme introuvable')

  const { data, error } = await supabase
    .from('advisor_question_bank_questions')
    .insert([
      {
        theme_id: themeId,
        concept: cleanConcept,
        prompt: cleanPrompt,
        concept_translations: sanitizeTranslations(conceptTranslations, cleanConcept),
        prompt_translations: sanitizeTranslations(promptTranslations, cleanPrompt),
        options: Array.isArray(options) && options.length > 0 ? options : DEFAULT_OPTIONS
      }
    ])
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const updateAdvisorQuestionBankQuestion = ({
  advisorId,
  questionId,
  concept,
  prompt,
  conceptTranslations,
  promptTranslations,
  options
}) => {
  return updateAdvisorQuestionBankQuestionInternal({
    advisorId,
    questionId,
    concept,
    prompt,
    conceptTranslations,
    promptTranslations,
    options
  })
}

const updateAdvisorQuestionBankQuestionInternal = async ({
  advisorId,
  questionId,
  concept,
  prompt,
  conceptTranslations,
  promptTranslations,
  options
}) => {
  if (!advisorId || !questionId) throw new Error('Question introuvable')

  const translatedConcepts = sanitizeTranslations(conceptTranslations, concept)
  const translatedPrompts = sanitizeTranslations(promptTranslations, prompt)
  const cleanConcept = String(
    concept ||
      getTranslatedValue(translatedConcepts, DEFAULT_QUESTION_LANGUAGE, '') ||
      getTranslatedValue(translatedConcepts, 'en', '')
  ).trim()
  const cleanPrompt = String(
    prompt || getTranslatedValue(translatedPrompts, DEFAULT_QUESTION_LANGUAGE, '') || getTranslatedValue(translatedPrompts, 'en', '')
  ).trim()

  if (!cleanConcept) throw new Error('Le concept est requis')
  if (!cleanPrompt) throw new Error('La question est requise')

  const { data: existing, error: existingError } = await supabase
    .from('advisor_question_bank_questions')
    .select('id, theme_id')
    .eq('id', questionId)
    .maybeSingle()

  if (existingError) throw existingError
  if (!existing) throw new Error('Question introuvable')

  const { data: theme, error: themeError } = await supabase
    .from('advisor_question_bank_themes')
    .select('id')
    .eq('id', existing.theme_id)
    .eq('advisor_id', advisorId)
    .maybeSingle()

  if (themeError) throw themeError
  if (!theme) throw new Error('Question introuvable')

  const { data, error } = await supabase
    .from('advisor_question_bank_questions')
    .update({
      concept: cleanConcept,
      prompt: cleanPrompt,
      concept_translations: translatedConcepts,
      prompt_translations: translatedPrompts,
      options: Array.isArray(options) && options.length > 0 ? options : DEFAULT_OPTIONS
    })
    .eq('id', questionId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const deleteAdvisorQuestionBankQuestion = async ({ advisorId, questionId }) => {
  if (!advisorId || !questionId) throw new Error('Question introuvable')

  const { data: existing, error: existingError } = await supabase
    .from('advisor_question_bank_questions')
    .select('id, theme_id')
    .eq('id', questionId)
    .maybeSingle()

  if (existingError) throw existingError
  if (!existing) throw new Error('Question introuvable')

  const { data: theme, error: themeError } = await supabase
    .from('advisor_question_bank_themes')
    .select('id')
    .eq('id', existing.theme_id)
    .eq('advisor_id', advisorId)
    .maybeSingle()

  if (themeError) throw themeError
  if (!theme) throw new Error('Question introuvable')

  const { error } = await supabase
    .from('advisor_question_bank_questions')
    .delete()
    .eq('id', questionId)

  if (error) throw error
  return { success: true }
}

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
    .select('id, questionnaire_id, question_text, concept, prompt_translations, concept_translations, theme, order_index, options')
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

  return insertQuestionnaireWithQuestions(advisorId, {
    ...template,
    name: customName?.trim() || template.name,
    isDefault: false
  })
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
    prompt_translations: question.promptTranslations,
    concept_translations: question.conceptTranslations,
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
