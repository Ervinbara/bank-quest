import { Link } from 'react-router-dom'
import { Clock3, Target, TrendingUp, Settings, ArrowRight } from 'lucide-react'
import Header from '@/components/Layout/Header'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <section className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-500 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <span className="text-sm font-semibold">FinMate for financial advisors</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Qualify clients faster.
              <br />
              Convert meetings better.
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-4xl mx-auto">
              FinMate helps financial advisors structure client discovery with smart questionnaires, clear
              scoring, and ready-to-use meeting insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                to="/demo"
                className="bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:shadow-2xl transition transform hover:scale-105"
              >
                Voir la demo
              </Link>
              <Link
                to="/auth/register"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition"
              >
                Creer un compte
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-16">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">-30%</div>
                <div className="text-white/80">Temps de preparation RDV</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">+22%</div>
                <div className="text-white/80">Taux de conversion</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">+2h</div>
                <div className="text-white/80">Gagnees par conseiller/semaine</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="solution" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Un workflow simple pour vos rendez-vous</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Invitez, analysez, priorisez. FinMate transforme les reponses client en plan de rendez-vous actionnable.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <Clock3 className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Preparation acceleree</h3>
              <p className="text-gray-600">Recevez les reponses avant l appel et arrivez avec les bons sujets.</p>
            </div>
            <div className="text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Priorites claires</h3>
              <p className="text-gray-600">Identifiez rapidement les besoins urgents et les opportunites de conseil.</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Suivi commercial</h3>
              <p className="text-gray-600">Pilotez votre pipeline avec un tableau de bord client centralise.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Pourquoi FinMate</h2>
            <p className="text-xl text-gray-600">Un outil de productivite moderne pense pour les cabinets de conseil financier</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Questionnaires personnalisables</h3>
              <p className="text-gray-600">
                Adaptez vos questions par theme, type de client et niveau de maturite financiere.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Scoring automatique</h3>
              <p className="text-gray-600">
                Obtenez un diagnostic rapide des forces et points de vigilance avant chaque echange.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Gestion des invitations</h3>
              <p className="text-gray-600">
                Envoyez vos campagnes en quelques clics et suivez le statut des reponses client.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all">
              <Settings className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Compatible avec votre process</h3>
              <p className="text-gray-600">
                Utilisez FinMate comme couche de qualification sans changer vos outils metier.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Tarifs simples</h2>
            <p className="text-xl text-gray-600">Choisissez la formule adaptee a votre volume de clients</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-purple-600 transition-all">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Solo</h3>
              <p className="text-gray-600 mb-6">Pour les independants</p>
              <div className="text-4xl font-bold text-gray-800 mb-6">
                29 EUR<span className="text-lg text-gray-600">/mois</span>
              </div>
              <ul className="space-y-3 mb-8 text-gray-600">
                <li>Jusqu a 50 clients</li>
                <li>Questionnaires standard</li>
                <li>Support email</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl p-8 transform scale-105 shadow-2xl">
              <div className="bg-yellow-400 text-purple-900 text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">POPULAIRE</div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-purple-100 mb-6">Pour les conseillers actifs</p>
              <div className="text-4xl font-bold mb-6">
                79 EUR<span className="text-lg text-purple-200">/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li>Jusqu a 200 clients</li>
                <li>Questionnaires personnalises</li>
                <li>Support prioritaire</li>
                <li>Analytics avances</li>
              </ul>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-purple-600 transition-all">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Cabinet</h3>
              <p className="text-gray-600 mb-6">Pour les equipes</p>
              <div className="text-4xl font-bold text-gray-800 mb-6">
                149 EUR<span className="text-lg text-gray-600">/mois</span>
              </div>
              <ul className="space-y-3 mb-8 text-gray-600">
                <li>Clients illimites</li>
                <li>Acces multi-utilisateurs</li>
                <li>Support dedie</li>
                <li>Accompagnement onboarding</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Pret a accelerer votre cabinet</h2>
          <p className="text-xl mb-8 text-purple-100">
            Lancez FinMate et structurez vos rendez-vous clients en moins de 30 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/register"
              className="bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:shadow-2xl transition transform hover:scale-105"
            >
              Creer un compte
            </Link>
            <Link
              to="/demo"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition flex items-center justify-center gap-2"
            >
              Tester la demo <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">© 2026 FinMate. Tous droits reserves.</p>
        </div>
      </footer>
    </div>
  )
}
