export const dashboardGuides = {
  overview: {
    buttonLabel: { fr: 'Notice de cet onglet', en: 'Tab guide' },
    title: { fr: 'Apercu du tableau de bord', en: 'Overview dashboard guide' },
    slides: [
      {
        title: { fr: 'A quoi sert cet onglet', en: 'What this tab is for' },
        description: {
          fr: 'Cet ecran te donne une vue rapide de ton activite commerciale et de tes priorites du jour.',
          en: 'This screen gives you a quick view of your sales activity and daily priorities.'
        },
        bullets: {
          fr: [
            'Voir en un coup d oeil le nombre total de clients et de quiz completes.',
            'Identifier les clients en attente et les suivis en cours.',
            'Acceder rapidement aux actions les plus frequentes.'
          ],
          en: [
            'See total clients and completed quizzes at a glance.',
            'Identify pending clients and active follow-ups.',
            'Access your most frequent actions quickly.'
          ]
        }
      },
      {
        title: { fr: 'Actions rapides', en: 'Quick actions' },
        description: {
          fr: 'Le bloc Actions rapides te fait gagner du temps pour naviguer vers les pages importantes.',
          en: 'The Quick actions block saves time by taking you to key pages.'
        },
        bullets: {
          fr: [
            'Inviter un client pour demarrer un nouveau questionnaire.',
            'Ouvrir les resultats clients, les analytics ou les questionnaires.',
            'Aller directement aux parametres du compte.'
          ],
          en: [
            'Invite a client to start a new questionnaire.',
            'Open client results, analytics, or questionnaires.',
            'Jump directly to account settings.'
          ]
        }
      },
      {
        title: { fr: 'Comment utiliser efficacement', en: 'How to use it effectively' },
        description: {
          fr: 'Commence ta session sur cet onglet pour prioriser ta journee en moins de deux minutes.',
          en: 'Start each session on this tab to prioritize your day in under two minutes.'
        },
        bullets: {
          fr: [
            'Verifie les clients a contacter en priorite.',
            'Lance ensuite Invitations ou Mes clients selon ton objectif.',
            'Reviens ici apres chaque action pour suivre la progression.'
          ],
          en: [
            'Check priority clients to contact first.',
            'Then move to Invitations or Clients depending on your goal.',
            'Come back here after actions to track progress.'
          ]
        }
      }
    ]
  },
  clients: {
    buttonLabel: { fr: 'Notice de cet onglet', en: 'Tab guide' },
    title: { fr: 'Mes clients - Guide', en: 'My clients guide' },
    slides: [
      {
        title: { fr: 'Objectif principal', en: 'Main objective' },
        description: {
          fr: 'Cet onglet centralise toutes les fiches clients et leur avancement quiz/commercial.',
          en: 'This tab centralizes all client cards and their quiz/sales progress.'
        },
        bullets: {
          fr: [
            'Visualiser le statut du quiz (en attente ou complete).',
            'Voir le score, forces et faiblesses pour les quiz termines.',
            'Acceder a la fiche detaillee de chaque client.'
          ],
          en: [
            'View quiz status (pending or completed).',
            'See score, strengths, and weaknesses for completed quizzes.',
            'Open each client detailed profile.'
          ]
        }
      },
      {
        title: { fr: 'Filtres et priorisation', en: 'Filters and prioritization' },
        description: {
          fr: 'Utilise les filtres pour te concentrer sur le bon segment de clients.',
          en: 'Use filters to focus on the right client segment.'
        },
        bullets: {
          fr: [
            'Filtrer par statut quiz: tous, completes, en attente.',
            'Filtrer par suivi commercial: a contacter, RDV planifie, en cours, clos.',
            'Combiner les deux filtres pour une liste actionnable.'
          ],
          en: [
            'Filter by quiz status: all, completed, pending.',
            'Filter by sales follow-up: to contact, scheduled, in progress, closed.',
            'Combine both filters for an actionable list.'
          ]
        }
      },
      {
        title: { fr: 'Bon workflow recommande', en: 'Recommended workflow' },
        description: {
          fr: 'Une methode simple pour ne pas se perdre dans le suivi quotidien.',
          en: 'A simple method to stay organized in daily follow-up.'
        },
        bullets: {
          fr: [
            'Trie d abord les clients en attente pour relancer rapidement.',
            'Traite ensuite les clients completes avec score faible en priorite.',
            'Mets a jour le suivi commercial apres chaque action.'
          ],
          en: [
            'First handle pending clients for quick reminders.',
            'Then prioritize completed clients with lower scores.',
            'Update sales follow-up after each action.'
          ]
        }
      }
    ]
  },
  invitations: {
    buttonLabel: { fr: 'Notice de cet onglet', en: 'Tab guide' },
    title: { fr: 'Invitations - Guide', en: 'Invitations guide' },
    slides: [
      {
        title: { fr: 'A quoi sert cet onglet', en: 'What this tab is for' },
        description: {
          fr: 'Tu geres ici les liens d invitation actifs et le template email.',
          en: 'Here you manage active invitation links and the email template.'
        },
        bullets: {
          fr: [
            'Voir tous les liens en cours et leur date d expiration.',
            'Copier un lien pour un envoi manuel.',
            'Regenerer un lien si besoin.'
          ],
          en: [
            'See all active links and expiration dates.',
            'Copy a link for manual sending.',
            'Regenerate a link when needed.'
          ]
        }
      },
      {
        title: { fr: 'Template email', en: 'Email template' },
        description: {
          fr: 'Le template te permet de standardiser tes envois avec des variables dynamiques.',
          en: 'The template lets you standardize outreach with dynamic placeholders.'
        },
        bullets: {
          fr: [
            'Personnaliser objet et message.',
            'Utiliser les placeholders client, conseiller et lien.',
            'Enregistrer une version reusable pour tous les envois futurs.'
          ],
          en: [
            'Customize subject and message.',
            'Use client, advisor, and invite-link placeholders.',
            'Save a reusable version for future sends.'
          ]
        }
      },
      {
        title: { fr: 'Envoi et relance', en: 'Sending and follow-up' },
        description: {
          fr: 'Chaque ligne client propose les actions essentielles de diffusion.',
          en: 'Each client row includes essential distribution actions.'
        },
        bullets: {
          fr: [
            'Envoyer l email directement depuis la ligne.',
            'Copier puis partager via ton canal habituel.',
            'Regenerer un lien en cas d expiration ou de perte.'
          ],
          en: [
            'Send email directly from the row.',
            'Copy and share through your usual channel.',
            'Regenerate links if expired or lost.'
          ]
        }
      }
    ]
  },
  questionnaires: {
    buttonLabel: { fr: 'Notice de cet onglet', en: 'Tab guide' },
    title: { fr: 'Questionnaires - Guide', en: 'Questionnaires guide' },
    slides: [
      {
        title: { fr: 'Creation de questionnaires', en: 'Questionnaire creation' },
        description: {
          fr: 'Tu peux creer des questionnaires depuis un template ou partir d un format vide.',
          en: 'You can create questionnaires from a template or from scratch.'
        },
        bullets: {
          fr: [
            'Utiliser un template pour aller vite.',
            'Creer un questionnaire vide pour un besoin specifique.',
            'Nommer clairement chaque questionnaire selon son usage.'
          ],
          en: [
            'Use templates for faster setup.',
            'Create an empty questionnaire for specific use cases.',
            'Name each questionnaire clearly by purpose.'
          ]
        }
      },
      {
        title: { fr: 'Edition des questions', en: 'Question editing' },
        description: {
          fr: 'Tu ajoutes des questions depuis la banque ou en ecriture libre.',
          en: 'Add questions from the bank or write custom ones.'
        },
        bullets: {
          fr: [
            'Choisir une langue de question (FR/EN) lors de l ajout depuis la banque.',
            'Modifier concept, texte et theme de chaque question.',
            'Traduire rapidement une question FR <-> EN.'
          ],
          en: [
            'Choose question language (FR/EN) when adding from the bank.',
            'Edit concept, text, and theme for each question.',
            'Translate a question quickly FR <-> EN.'
          ]
        }
      },
      {
        title: { fr: 'Activation et pilotage', en: 'Activation and management' },
        description: {
          fr: 'Definis un questionnaire par defaut pour les nouvelles invitations.',
          en: 'Set one default questionnaire for new invitations.'
        },
        bullets: {
          fr: [
            'Marquer un questionnaire comme "Par defaut".',
            'Supprimer ceux non utilises pour garder une base propre.',
            'Sauvegarder apres chaque session de modifications.'
          ],
          en: [
            'Mark one questionnaire as "Default".',
            'Delete unused ones to keep your setup clean.',
            'Save after each editing session.'
          ]
        }
      }
    ]
  },
  questionBank: {
    buttonLabel: { fr: 'Notice de cet onglet', en: 'Tab guide' },
    title: { fr: 'Banque de questions - Guide', en: 'Question bank guide' },
    slides: [
      {
        title: { fr: 'Structure generale', en: 'General structure' },
        description: {
          fr: 'La banque est organisee par themes pour reutiliser tes questions facilement.',
          en: 'The bank is organized by themes to reuse questions easily.'
        },
        bullets: {
          fr: [
            'Creer des themes metier (budget, retraite, etc.).',
            'Ajouter des questions avec concept + formulation.',
            'Mettre a jour ou supprimer les questions existantes.'
          ],
          en: [
            'Create business themes (budget, retirement, etc.).',
            'Add questions with concept + wording.',
            'Update or delete existing questions.'
          ]
        }
      },
      {
        title: { fr: 'Gestion multilingue', en: 'Multilingual management' },
        description: {
          fr: 'Chaque question peut contenir des versions FR et EN.',
          en: 'Each question can include FR and EN versions.'
        },
        bullets: {
          fr: [
            'Editer explicitement une version par langue.',
            'Utiliser les boutons FR -> EN / EN -> FR pour pre-remplir.',
            'Verifier les badges FR/EN pour detecter les manques.'
          ],
          en: [
            'Explicitly edit one version per language.',
            'Use FR -> EN / EN -> FR buttons for prefill translations.',
            'Check FR/EN badges to spot missing variants.'
          ]
        }
      },
      {
        title: { fr: 'Bonnes pratiques', en: 'Best practices' },
        description: {
          fr: 'Une banque claire evite les doublons et accelere la creation de questionnaires.',
          en: 'A clean bank avoids duplicates and speeds up questionnaire creation.'
        },
        bullets: {
          fr: [
            'Donner des noms de themes explicites.',
            'Uniformiser le style des formulations.',
            'Reviser periodiquement les questions peu utilisees.'
          ],
          en: [
            'Use explicit theme names.',
            'Keep wording style consistent.',
            'Review underused questions regularly.'
          ]
        }
      }
    ]
  },
  analytics: {
    buttonLabel: { fr: 'Notice de cet onglet', en: 'Tab guide' },
    title: { fr: 'Analytics - Guide', en: 'Analytics guide' },
    slides: [
      {
        title: { fr: 'Ce que tu analyses ici', en: 'What you analyze here' },
        description: {
          fr: 'Cet onglet sert au pilotage commercial et a la priorisation des actions.',
          en: 'This tab is for sales monitoring and action prioritization.'
        },
        bullets: {
          fr: [
            'Suivre le volume clients, quiz completes et score moyen.',
            'Lire le pipeline pour identifier les blocages.',
            'Observer la segmentation chaud/tiede/froid.'
          ],
          en: [
            'Track client volume, completed quizzes, and average score.',
            'Read pipeline stages to spot bottlenecks.',
            'Monitor hot/warm/cold segmentation.'
          ]
        }
      },
      {
        title: { fr: 'Tendances et distribution', en: 'Trends and distribution' },
        description: {
          fr: 'Les graphiques montrent la qualite du portefeuille client dans le temps.',
          en: 'Charts show portfolio quality over time.'
        },
        bullets: {
          fr: [
            'Repartition des scores par tranche.',
            'Evolution mensuelle des scores moyens.',
            'Utiliser ces signaux pour ajuster ton discours commercial.'
          ],
          en: [
            'Score distribution by range.',
            'Monthly evolution of average scores.',
            'Use these signals to adjust your sales messaging.'
          ]
        }
      },
      {
        title: { fr: 'Priorites operationnelles', en: 'Operational priorities' },
        description: {
          fr: 'La section Top 10 te donne les relances les plus importantes.',
          en: 'The Top 10 section gives your highest-priority follow-ups.'
        },
        bullets: {
          fr: [
            'Identifier les urgences via le niveau de priorite.',
            'Ouvrir directement la fiche client pour agir.',
            'Exporter le CSV pour partage ou reporting externe.'
          ],
          en: [
            'Identify urgent cases by priority level.',
            'Open client profile directly to act.',
            'Export CSV for sharing or external reporting.'
          ]
        }
      }
    ]
  },
  settings: {
    buttonLabel: { fr: 'Notice de cet onglet', en: 'Tab guide' },
    title: { fr: 'Parametres - Guide', en: 'Settings guide' },
    slides: [
      {
        title: { fr: 'Profil', en: 'Profile' },
        description: {
          fr: 'Mets a jour tes informations de conseiller et de cabinet.',
          en: 'Update your advisor and company information.'
        },
        bullets: {
          fr: [
            'Modifier nom, societe et telephone.',
            'Verifier ton email professionnel (lecture seule).',
            'Enregistrer les changements pour les afficher partout dans l app.'
          ],
          en: [
            'Edit name, company, and phone.',
            'Check your professional email (read-only).',
            'Save changes to reflect them across the app.'
          ]
        }
      },
      {
        title: { fr: 'Securite', en: 'Security' },
        description: {
          fr: 'Change ton mot de passe et renforce la securite du compte.',
          en: 'Change your password and strengthen account security.'
        },
        bullets: {
          fr: [
            'Renseigner le mot de passe actuel pour verification.',
            'Choisir un nouveau mot de passe robuste.',
            'Confirmer et valider le changement.'
          ],
          en: [
            'Enter current password for verification.',
            'Choose a strong new password.',
            'Confirm and submit the change.'
          ]
        }
      },
      {
        title: { fr: 'Abonnement', en: 'Billing' },
        description: {
          fr: 'Pilote ton plan et la facturation Stripe depuis ce bloc.',
          en: 'Manage your plan and Stripe billing from this section.'
        },
        bullets: {
          fr: [
            'Demarrer sans abonnement puis souscrire au plan adapte.',
            'Suivre statut, date de souscription, prochaine echeance et fin d abonnement.',
            'Programmer une resiliation fin de periode ou changer de plan via Stripe.'
          ],
          en: [
            'Start with no subscription, then subscribe to the right plan.',
            'Track status, subscription date, next billing date, and end date.',
            'Schedule end-of-period cancellation or switch plans through Stripe.'
          ]
        }
      }
    ]
  }
}
