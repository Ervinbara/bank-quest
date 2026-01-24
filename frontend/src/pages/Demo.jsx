import { useState } from 'react'
import { Link } from 'react-router-dom'
import BankQuestGame from '@/components/Game/BankQuestGame'
import { themes } from '@/data/themes'

export default function Demo() {
    const [currentTheme, setCurrentTheme] = useState('blue')

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <span className="text-3xl">🎮</span>
                            <span className="text-2xl font-bold gradient-text">Bank Quest</span>
                        </Link>
                        <Link to="/" className="text-gray-600 hover:text-purple-600 font-medium">
                            ← Retour à l'accueil
                        </Link>
                    </div>
                </nav>
            </header>

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-bold gradient-text mb-4">Démo Interactive</h1>
                        <p className="text-xl text-gray-600">Testez Bank Quest avec différents thèmes de banque</p>
                    </div>

                    {/* Theme Selector */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8 max-w-4xl mx-auto">
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                            Choisissez le thème de votre banque :
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(themes).map(([key, theme]) => (
                                <button
                                    key={key}
                                    onClick={() => setCurrentTheme(key)}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        currentTheme === key
                                            ? 'border-purple-500 bg-purple-50 scale-105'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="text-3xl mb-2">{theme.logo}</div>
                                    <div className="text-sm font-semibold text-gray-800">{theme.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Game */}
                    <BankQuestGame
                        theme={currentTheme}
                        onComplete={(data) => {
                            console.log('Game completed:', data)
                        }}
                    />
                </div>
            </div>
        </div>
    )
}