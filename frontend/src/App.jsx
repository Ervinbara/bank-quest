import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

// Pages publiques
import Home from './pages/Home'
import Demo from './pages/Demo'
import NotFound from './pages/NotFound'

// Pages d'authentification
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'

// Dashboard
import DashboardLayout from './components/Dashboard/DashboardLayout'
import Overview from './pages/Dashboard/Overview'
import Clients from './pages/Dashboard/Clients'
import Analytics from './pages/Dashboard/Analytics'
import Settings from './pages/Dashboard/Settings'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/demo" element={<Demo />} />
          
          {/* Routes d'authentification */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          
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
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            {/* Capture les sous-routes inconnues du dashboard DANS le layout protégé.
                Sans ce fallback, /dashboard/analytics tomberait sur le * top-level,
                démonterait ProtectedRoute, et causerait le bug "Chargement..." au retour. */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* 404 — uniquement pour les routes hors /dashboard */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
