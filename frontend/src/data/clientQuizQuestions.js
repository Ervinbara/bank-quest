export const clientQuizQuestions = [
  {
    id: 'budget_monthly',
    concept: 'Budget mensuel',
    prompt: 'Suivez-vous votre budget mensuel de facon reguliere ?',
    options: [
      { label: 'Jamais', points: 1 },
      { label: 'Rarement', points: 2 },
      { label: 'Parfois', points: 3 },
      { label: 'Souvent', points: 4 },
      { label: 'Toujours', points: 5 }
    ]
  },
  {
    id: 'savings_buffer',
    concept: 'Epargne de precaution',
    prompt: "Disposez-vous d'une epargne couvrant au moins 3 mois de depenses ?",
    options: [
      { label: 'Pas du tout', points: 1 },
      { label: "Moins d'un mois", points: 2 },
      { label: 'Environ 1-2 mois', points: 3 },
      { label: 'Environ 3 mois', points: 4 },
      { label: 'Plus de 3 mois', points: 5 }
    ]
  },
  {
    id: 'debt_management',
    concept: 'Gestion des dettes',
    prompt: 'Votre niveau de dettes est-il maitrise et planifie ?',
    options: [
      { label: 'Non maitrise', points: 1 },
      { label: 'Tres difficile', points: 2 },
      { label: 'Moyennement stable', points: 3 },
      { label: 'Plutot stable', points: 4 },
      { label: 'Completement maitrise', points: 5 }
    ]
  },
  {
    id: 'investing_basics',
    concept: 'Bases de l investissement',
    prompt: 'Comprenez-vous les notions de risque et de diversification ?',
    options: [
      { label: 'Pas du tout', points: 1 },
      { label: 'Tres peu', points: 2 },
      { label: 'Notions de base', points: 3 },
      { label: 'Bonne comprehension', points: 4 },
      { label: 'Tres bonne comprehension', points: 5 }
    ]
  },
  {
    id: 'retirement_planning',
    concept: 'Preparation retraite',
    prompt: 'Avez-vous deja commence a preparer votre retraite ?',
    options: [
      { label: 'Pas commence', points: 1 },
      { label: 'Reflexion en cours', points: 2 },
      { label: 'Demarrage recent', points: 3 },
      { label: 'Plan etabli', points: 4 },
      { label: 'Plan suivi regulierement', points: 5 }
    ]
  },
  {
    id: 'insurance_coverage',
    concept: 'Protection et assurance',
    prompt: 'Votre couverture assurance est-elle adaptee a votre situation ?',
    options: [
      { label: 'Non adaptee', points: 1 },
      { label: 'Partiellement adaptee', points: 2 },
      { label: 'Acceptable', points: 3 },
      { label: 'Bien adaptee', points: 4 },
      { label: 'Optimisee', points: 5 }
    ]
  },
  {
    id: 'tax_awareness',
    concept: 'Fiscalite',
    prompt: 'Connaissez-vous les principaux leviers d optimisation fiscale ?',
    options: [
      { label: 'Pas du tout', points: 1 },
      { label: 'Tres peu', points: 2 },
      { label: 'Quelques notions', points: 3 },
      { label: 'Bonne connaissance', points: 4 },
      { label: 'Maitrise avancee', points: 5 }
    ]
  },
  {
    id: 'project_planning',
    concept: 'Planification des projets',
    prompt: 'Vos projets financiers sont-ils clairement planifies ?',
    options: [
      { label: 'Pas de plan', points: 1 },
      { label: 'Plan flou', points: 2 },
      { label: 'Plan partiel', points: 3 },
      { label: 'Plan clair', points: 4 },
      { label: 'Plan detaille et suivi', points: 5 }
    ]
  }
]
