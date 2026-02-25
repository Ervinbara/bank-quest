import { useState } from 'react'
import { Link } from 'react-router-dom'
import { isValidEmail } from '@/services/authService'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email) {
      setError('L\'email est requis')
      return
    }
    
    if (!isValidEmail(email)) {
      setError('Email invalide')
      return
    }

    setLoading(true)
    setError('')

    // Simuler l'envoi d'un email
    setTimeout(() => {
      setSuccess(true)
      setLoading(false)
    }, 1500)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-red-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Email envoyé !</h1>
          <p className="text-gray-600 mb-8">
            Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>.
            Vérifiez votre boîte de réception.
          </p>
          <Link
            to="/auth/login"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-all"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔑</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Mot de passe oublié ?</h1>
          <p className="text-gray-600">
            Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email professionnel
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                error 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-gray-200 focus:border-purple-500'
              } focus:outline-none`}
              placeholder="vous@exemple.fr"
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/auth/login" className="text-sm font-semibold text-purple-600 hover:text-purple-700">
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}