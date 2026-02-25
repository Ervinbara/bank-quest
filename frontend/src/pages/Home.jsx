import { Link } from 'react-router-dom'
import { GraduationCap, Award, TrendingUp, Settings, ArrowRight } from 'lucide-react'
import Header from '@/components/Layout/Header'

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header avec navigation */}
            <Header />

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-500 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center animate-fade-in">
                        <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                            <span className="text-sm font-semibold">🚀 Gamification bancaire nouvelle génération</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6">
                            Transformez l'éducation financière<br/>en expérience <span className="underline decoration-yellow-400">addictive</span>
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
                            Module de gamification clé-en-main pour améliorer les connaissances financières de vos clients en 10 minutes
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                            <Link to="/demo" className="bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:shadow-2xl transition transform hover:scale-105">
                                Voir la démo interactive
                            </Link>
                            <Link to="/auth/register" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition">
                                Créer un compte gratuit
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-16">
                            <div className="text-center">
                                <div className="text-4xl font-bold mb-2">+47%</div>
                                <div className="text-white/80">Connaissances acquises</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold mb-2">85%</div>
                                <div className="text-white/80">Taux de satisfaction</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold mb-2">12K+</div>
                                <div className="text-white/80">Utilisateurs actifs</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Solution Section */}
            <section id="solution" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-800 mb-4">La solution pour les conseillers financiers</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Qualifiez vos clients, identifiez leurs lacunes et optimisez vos rendez-vous grâce à des questionnaires interactifs
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        <div className="text-center">
                            <div className="text-5xl mb-4">⏱️</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Gagnez du temps</h3>
                            <p className="text-gray-600">2h/semaine économisées = 100h/an = 8-10 clients supplémentaires</p>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl mb-4">🎯</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Qualifiez mieux</h3>
                            <p className="text-gray-600">Identifiez les points faibles de vos clients avant le rendez-vous</p>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl mb-4">💰</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Augmentez votre CA</h3>
                            <p className="text-gray-600">+40K€ de revenus annuels grâce aux clients supplémentaires</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-800 mb-4">Pourquoi Bank Quest ?</h2>
                        <p className="text-xl text-gray-600">La solution complète pour engager et éduquer vos clients</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all">
                            <GraduationCap className="w-12 h-12 text-purple-600 mb-4" />
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">Questionnaires thématiques</h3>
                            <p className="text-gray-600">8 modules : Budget, Épargne, Crédit, Investissement, Retraite, Fiscalité, Assurance, Patrimoine</p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all">
                            <Award className="w-12 h-12 text-purple-600 mb-4" />
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">Analyse automatique</h3>
                            <p className="text-gray-600">Identification des forces et faiblesses de chaque client pour personnaliser vos conseils</p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all">
                            <TrendingUp className="w-12 h-12 text-purple-600 mb-4" />
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">Tableau de bord complet</h3>
                            <p className="text-gray-600">Suivez la progression de vos clients et identifiez les opportunités de conseil</p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all">
                            <Settings className="w-12 h-12 text-purple-600 mb-4" />
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">100% Personnalisable</h3>
                            <p className="text-gray-600">Liens d'invitation uniques, suivi par email, intégration à votre workflow</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Preview */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-800 mb-4">Tarifs simples et transparents</h2>
                        <p className="text-xl text-gray-600">Choisissez la formule adaptée à votre activité</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Solo */}
                        <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-purple-600 transition-all">
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">Solo</h3>
                            <p className="text-gray-600 mb-6">Pour les conseillers indépendants</p>
                            <div className="text-4xl font-bold text-gray-800 mb-6">49€<span className="text-lg text-gray-600">/mois</span></div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    <span className="text-gray-600">Jusqu'à 50 clients</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    <span className="text-gray-600">8 modules de quiz</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    <span className="text-gray-600">Support email</span>
                                </li>
                            </ul>
                        </div>

                        {/* Pro */}
                        <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl p-8 transform scale-105 shadow-2xl">
                            <div className="bg-yellow-400 text-purple-900 text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">POPULAIRE</div>
                            <h3 className="text-2xl font-bold mb-2">Pro</h3>
                            <p className="text-purple-100 mb-6">Pour les conseillers actifs</p>
                            <div className="text-4xl font-bold mb-6">99€<span className="text-lg text-purple-200">/mois</span></div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2">
                                    <span className="text-yellow-400">✓</span>
                                    <span>Jusqu'à 200 clients</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-yellow-400">✓</span>
                                    <span>Modules illimités</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-yellow-400">✓</span>
                                    <span>Support prioritaire</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-yellow-400">✓</span>
                                    <span>Rapports personnalisés</span>
                                </li>
                            </ul>
                        </div>

                        {/* Cabinet */}
                        <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-purple-600 transition-all">
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">Cabinet</h3>
                            <p className="text-gray-600 mb-6">Pour les équipes</p>
                            <div className="text-4xl font-bold text-gray-800 mb-6">299€<span className="text-lg text-gray-600">/mois</span></div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    <span className="text-gray-600">Clients illimités</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    <span className="text-gray-600">Multi-utilisateurs</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    <span className="text-gray-600">Support dédié</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    <span className="text-gray-600">API & Intégrations</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold mb-4">Prêt à transformer votre pratique ?</h2>
                    <p className="text-xl mb-8 text-purple-100">
                        Testez Bank Quest gratuitement pendant 14 jours. Aucune carte de crédit requise.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/auth/register" className="bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:shadow-2xl transition transform hover:scale-105">
                            Créer un compte gratuit
                        </Link>
                        <Link to="/demo" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition flex items-center justify-center gap-2">
                            Tester la démo <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-gray-400">© 2025 Bank Quest. Tous droits réservés.</p>
                </div>
            </footer>
        </div>
    )
}