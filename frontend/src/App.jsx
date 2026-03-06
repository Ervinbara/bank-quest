import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import SuperAdminRoute from '@/components/SuperAdminRoute'
import PublicOnlyRoute from '@/components/PublicOnlyRoute'

// Pages publiques
import Home from './pages/Home'
import Demo from './pages/Demo'
import NotFound from './pages/NotFound'
import ClientQuiz from './pages/ClientQuiz'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Support from './pages/Support'
import AccountDeletion from './pages/AccountDeletion'
import CookieConsentBanner from '@/components/common/CookieConsentBanner'
import AppTelemetry from '@/components/common/AppTelemetry'

// Pages d'authentification
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import AuthCallback from './pages/Auth/AuthCallback'

// Dashboard
import DashboardLayout from './components/Dashboard/DashboardLayout'
import Overview from './pages/Dashboard/Overview'
import Clients from './pages/Dashboard/Clients'
import ClientDetail from './pages/Dashboard/ClientDetail'
import Invitations from './pages/Dashboard/Invitations'
import Analytics from './pages/Dashboard/Analytics'
import Questionnaires from './pages/Dashboard/Questionnaires'
import QuestionBank from './pages/Dashboard/QuestionBank'
import Settings from './pages/Dashboard/Settings'
import Admin from './pages/Dashboard/Admin'

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <AppTelemetry />
          <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/quiz/:clientId" element={<ClientQuiz />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/support" element={<Support />} />
          <Route path="/account-deletion" element={<AccountDeletion />} />
          
          {/* Routes d'authentification */}
          <Route
            path="/auth/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/auth/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/auth/forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPassword />
              </PublicOnlyRoute>
            }
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Routes Dashboard (protégées) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:clientId" element={<ClientDetail />} />
            <Route path="invitations" element={<Invitations />} />
            <Route path="questionnaires" element={<Questionnaires />} />
            <Route path="question-bank" element={<QuestionBank />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route
              path="admin"
              element={
                <SuperAdminRoute>
                  <Admin />
                </SuperAdminRoute>
              }
            />
            {/* Capture les sous-routes inconnues du dashboard DANS le layout protégé.
                Sans ce fallback, /dashboard/analytics tomberait sur le * top-level,
                démonterait ProtectedRoute, et causerait le bug "Chargement..." au retour. */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* 404 — uniquement pour les routes hors /dashboard */}
          <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsentBanner />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App
