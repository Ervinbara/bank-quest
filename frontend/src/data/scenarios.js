export const scenarios = [
    {
        id: 1,
        title: "Le Premier Salaire",
        description: "Vous venez de recevoir votre premier salaire de 1500€. Que faites-vous ?",
        choices: [
            {
                text: "Je dépense tout immédiatement",
                points: 0,
                feedback: "Attention ! Il est important d'épargner une partie de vos revenus pour les imprévus."
            },
            {
                text: "J'épargne 10% et je gère le reste",
                points: 10,
                feedback: "Excellent choix ! La règle des 10% d'épargne est une base solide pour construire votre sécurité financière."
            },
            {
                text: "J'épargne 30% et je budgétise le reste",
                points: 20,
                feedback: "Parfait ! Épargner 30% vous permettra d'atteindre vos objectifs plus rapidement."
            }
        ],
        concept: "L'épargne régulière",
        lesson: "Épargner entre 10% et 30% de ses revenus permet de constituer une réserve pour les imprévus et de réaliser ses projets futurs."
    },
    {
        id: 2,
        title: "L'Investissement",
        description: "Vous avez 5000€ d'épargne. Comment les faire fructifier ?",
        choices: [
            {
                text: "Tout investir en actions d'une seule entreprise",
                points: 0,
                feedback: "Risqué ! Ne jamais mettre tous ses œufs dans le même panier."
            },
            {
                text: "Laisser sur un compte courant à 0%",
                points: 5,
                feedback: "Sécurisé mais vous perdez du pouvoir d'achat avec l'inflation."
            },
            {
                text: "Diversifier : livret A + assurance-vie",
                points: 20,
                feedback: "Sage décision ! La diversification réduit les risques tout en optimisant le rendement."
            }
        ],
        concept: "La diversification",
        lesson: "Diversifier ses placements entre différents supports (livrets, assurance-vie, actions) permet de limiter les risques tout en optimisant les rendements."
    },
    {
        id: 3,
        title: "Le Crédit Immobilier",
        description: "Vous voulez acheter un appartement à 200 000€. Quelle approche choisir ?",
        choices: [
            {
                text: "Emprunter sur 30 ans pour payer moins par mois",
                points: 5,
                feedback: "Mensualités basses mais coût total du crédit très élevé."
            },
            {
                text: "Apporter 10% et emprunter sur 20 ans",
                points: 20,
                feedback: "Excellent équilibre ! Un apport de 10-20% et une durée raisonnable optimisent le coût du crédit."
            },
            {
                text: "Emprunter sans apport sur 25 ans",
                points: 10,
                feedback: "Possible mais les banques préfèrent un apport personnel qui prouve votre capacité d'épargne."
            }
        ],
        concept: "Le crédit immobilier",
        lesson: "Un apport personnel de 10-20% et une durée d'emprunt raisonnable (15-20 ans) permettent d'obtenir de meilleures conditions et de réduire le coût total du crédit."
    },
    {
        id: 4,
        title: "La Carte Bancaire",
        description: "Votre carte a été débitée de 150€ sans votre autorisation. Que faire ?",
        choices: [
            {
                text: "Attendre de voir si ça se règle tout seul",
                points: 0,
                feedback: "Non ! Il faut agir rapidement pour être protégé."
            },
            {
                text: "Faire opposition immédiatement",
                points: 20,
                feedback: "Parfait ! En cas de fraude, faire opposition immédiatement vous protège. Vous avez 13 mois pour contester."
            },
            {
                text: "Changer de banque",
                points: 5,
                feedback: "Inutile ! Faire opposition et contester suffit. La banque est tenue de vous rembourser si la fraude est avérée."
            }
        ],
        concept: "La sécurité bancaire",
        lesson: "En cas de fraude ou de perte de carte, faites opposition immédiatement (7j/7, 24h/24). Vous disposez de 13 mois pour contester un débit frauduleux et serez remboursé."
    },
    {
        id: 5,
        title: "Le Découvert Bancaire",
        description: "Votre compte est à -200€. Comment réagir ?",
        choices: [
            {
                text: "Ne rien faire, la banque va comprendre",
                points: 0,
                feedback: "Attention ! Les agios (intérêts sur découvert) peuvent coûter très cher, jusqu'à 20% par an."
            },
            {
                text: "Alimenter le compte rapidement",
                points: 20,
                feedback: "Excellente réaction ! Réduire la durée du découvert limite les frais d'agios."
            },
            {
                text: "Demander un crédit pour rembourser",
                points: 5,
                feedback: "Pas idéal. Mieux vaut négocier une autorisation de découvert à l'avance avec votre banque."
            }
        ],
        concept: "Les agios et découverts",
        lesson: "Un découvert non autorisé peut coûter jusqu'à 20% d'intérêts annuels. Il est préférable de négocier à l'avance une autorisation de découvert avec sa banque pour limiter les frais."
    }
]