import { Link } from 'react-router-dom'
import { GraduationCap, Award, TrendingUp, Settings, ArrowRight } from 'lucide-react'

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <span className="text-3xl">🎮</span>
                            <span className="text-2xl font-bold gradient-text">Bank Quest</span>
                        </div>
                        <div className="hidden md:flex space-x-8">
                            <a href="#solution" className="text-gray-600 hover:text-purple-600 font-medium">Solution</a>
                            <Link to="/demo" className="text-gray-600 hover:text-purple-600 font-medium">Démo</Link>
                            <a href="#features" className="text-gray-600 hover:text-purple-600 font-medium">Fonctionnalités</a>
                        </div>
                        <a href="mailto:contact@bankquest.io" className="btn-primary">
                            Demander une démo
                        </a>
                    </div>
                </nav>
            </header>

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
                            <a href="#features" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition">
                                En savoir plus
                            </a>
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

            {/* Features */}
            <section id="features" className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-800 mb-4">Pourquoi Bank Quest ?</h2>
                        <p className="text-xl text-gray-600">La solution complète pour engager et éduquer vos clients</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="card">
                            <GraduationCap className="w-12 h-12 text-purple-600 mb-4" />
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">Pédagogie Interactive</h3>
                            <p className="text-gray-600">5 scénarios réalistes pour apprendre en s'amusant. Budget, épargne, crédit, fraude... tout y est.</p>
                        </div>

                        <div className="card">
                            <Award className="w-12 h-12 text-purple-600 mb-4" />
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">Gamification</h3>
                            <p className="text-gray-600">Système de points, badges et récompenses qui motivent et fidélisent vos utilisateurs.</p>
                        </div>

                        <div className="card">
                            <TrendingUp className="w-12 h-12 text-purple-600 mb-4" />
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">Suivi de Progression</h3>
                            <p className="text-gray-600">Analytics détaillées pour mesurer l'impact et le ROI de l'éducation financière.</p>
                        </div>

                        <div className="card">
                            <Settings className="w-12 h-12 text-purple-600 mb-4" />
                            <h3 className="text-2xl font-bold text-gray-800 mb-3">100% Personnalisable</h3>
                            <p className="text-gray-600">Adapté à votre charte graphique et vos besoins spécifiques en quelques clics.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold mb-4">Prêt à transformer l'engagement de vos clients ?</h2>
                    <p className="text-xl mb-8 text-purple-100">
                        Testez Bank Quest gratuitement pendant 30 jours. Aucune carte de crédit requise.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a href="mailto:contact@bankquest.io" className="bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:shadow-2xl transition transform hover:scale-105">
                            Demander une démo
                        </a>
                        <Link to="/demo" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition flex items-center justify-center gap-2">
                            Tester maintenant <ArrowRight className="w-5 h-5" />
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