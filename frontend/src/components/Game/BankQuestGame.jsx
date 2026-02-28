import { useState } from 'react'
import { Coins, TrendingUp, Award, ArrowRight, BookOpen } from 'lucide-react'
import { scenarios } from '@/data/scenarios'
import { themes } from '@/data/themes'

export default function BankQuestGame({
                                          theme = 'blue',
                                          onComplete = () => {},
                                          customScenarios = null
                                      }) {
    const [currentScenario, setCurrentScenario] = useState(0)
    const [score, setScore] = useState(0)
    const [selectedChoice, setSelectedChoice] = useState(null)
    const [showFeedback, setShowFeedback] = useState(false)
    const [gameCompleted, setGameCompleted] = useState(false)
    const [learnedConcepts, setLearnedConcepts] = useState([])

    const gameScenarios = customScenarios || scenarios
    const currentTheme = themes[theme] || themes.blue

    const handleChoice = (choice, index) => {
        setSelectedChoice(index)
        setScore(score + choice.points)
        setShowFeedback(true)

        const scenario = gameScenarios[currentScenario]
        if (!learnedConcepts.includes(scenario.concept)) {
            setLearnedConcepts([...learnedConcepts, scenario.concept])
        }
    }

    const nextScenario = () => {
        if (currentScenario < gameScenarios.length - 1) {
            setCurrentScenario(currentScenario + 1)
            setSelectedChoice(null)
            setShowFeedback(false)
        } else {
            setGameCompleted(true)
            onComplete({ score, concepts: learnedConcepts })
        }
    }

    const restartGame = () => {
        setCurrentScenario(0)
        setScore(0)
        setSelectedChoice(null)
        setShowFeedback(false)
        setGameCompleted(false)
        setLearnedConcepts([])
    }

    if (gameCompleted) {
        const maxScore = gameScenarios.reduce((acc) => acc + 20, 0)
        const percentage = Math.round((score / maxScore) * 100)

        return (
            <div className={`min-h-screen bg-gradient-to-br ${currentTheme.primary} flex items-center justify-center p-4`}>
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full">
                    <div className="text-center mb-8">
                        <Award className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">Félicitations !</h1>
                        <p className="text-xl text-gray-600">Vous avez termine FinMate</p>
                    </div>

                    <div className={`bg-gradient-to-r ${currentTheme.secondary} rounded-2xl p-6 mb-6`}>
                        <p className="text-3xl font-bold text-center text-gray-800 mb-2">
                            Score : {score}/{maxScore} ({percentage}%)
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
                            <div
                                className={`bg-gradient-to-r ${currentTheme.primary} h-4 rounded-full transition-all duration-1000`}
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <BookOpen className="text-emerald-700" />
                            Concepts Appris
                        </h2>
                        <div className="space-y-4">
                            {gameScenarios.map((scenario, index) => (
                                <div key={index} className="bg-emerald-50 rounded-xl p-4 border-l-4 border-emerald-500">
                                    <h3 className="font-bold text-emerald-900 mb-2">{scenario.concept}</h3>
                                    <p className="text-gray-700 text-sm">{scenario.lesson}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={restartGame}
                        className={`w-full bg-gradient-to-r ${currentTheme.primary} hover:opacity-90 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105`}
                    >
                        Rejouer
                    </button>
                </div>
            </div>
        )
    }

    const scenario = gameScenarios[currentScenario]

    return (
        <div className={`min-h-screen bg-gradient-to-br ${currentTheme.primary} flex items-center justify-center p-4`}>
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Coins className="text-yellow-500 w-8 h-8" />
                        <span className="text-2xl font-bold text-gray-800">Score: {score}</span>
                    </div>
                    <div className="text-sm text-gray-600 font-semibold">
                        Scénario {currentScenario + 1}/{gameScenarios.length}
                    </div>
                </div>

                <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                            className={`bg-gradient-to-r ${currentTheme.primary} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${((currentScenario + 1) / gameScenarios.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className={`bg-gradient-to-r ${currentTheme.secondary} rounded-2xl p-6 mb-6`}>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">{scenario.title}</h2>
                    <p className="text-gray-700 text-lg">{scenario.description}</p>
                </div>

                <div className="space-y-4 mb-6">
                    {scenario.choices.map((choice, index) => (
                        <button
                            key={index}
                            onClick={() => !showFeedback && handleChoice(choice, index)}
                            disabled={showFeedback}
                            className={`w-full text-left p-4 rounded-xl transition-all duration-200 transform ${
                                showFeedback
                                    ? selectedChoice === index
                                        ? choice.points === 20
                                            ? 'bg-green-100 border-2 border-green-500 scale-105'
                                            : choice.points === 10
                                                ? 'bg-yellow-100 border-2 border-yellow-500'
                                                : 'bg-red-100 border-2 border-red-500'
                                        : 'bg-gray-100 opacity-50'
                                    : 'bg-emerald-50 hover:bg-emerald-100 hover:scale-105 border-2 border-emerald-200 cursor-pointer'
                            }`}
                        >
                            <p className="font-semibold text-gray-800">{choice.text}</p>
                            {showFeedback && selectedChoice === index && (
                                <p className="mt-2 text-sm text-gray-700 italic">{choice.feedback}</p>
                            )}
                        </button>
                    ))}
                </div>

                {showFeedback && (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-xl p-4">
                            <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                💡 Notion Bancaire
                            </h3>
                            <p className="text-gray-700">{scenario.lesson}</p>
                        </div>

                        <button
                            onClick={nextScenario}
                            className={`w-full bg-gradient-to-r ${currentTheme.primary} hover:opacity-90 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2`}
                        >
                            {currentScenario < gameScenarios.length - 1 ? 'Scénario Suivant' : 'Voir les Résultats'}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}


