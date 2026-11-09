import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import PWAInstallBanner from './components/common/PWAInstallBanner';
import HomePage from './pages/HomePage';
import VenueListPage from './pages/VenueListPage';
import VenueDetailPage from './pages/VenueDetailPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import DashboardPage from './pages/DashboardPage';
import AddVenuePage from './pages/AddVenuePage';
import ComparePage from './pages/ComparePage';
import MapPage from './pages/MapPage';
import AboutPage from './pages/AboutPage';
import MessagesPage from './pages/MessagesPage';
import SubscriptionPage from './pages/SubscriptionPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'Inter, sans-serif', fontSize: 14 },
            success: { iconTheme: { primary: '#1B6B4A', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/"                element={<><Navbar /><HomePage /></>} />
          <Route path="/lieux"           element={<><Navbar /><VenueListPage /></>} />
          <Route path="/lieux/:slug"     element={<><Navbar /><VenueDetailPage /></>} />
          <Route path="/carte"           element={<><Navbar /><MapPage /></>} />
          <Route path="/a-propos"        element={<><Navbar /><AboutPage /></>} />
          <Route path="/connexion"       element={<LoginPage />} />
          <Route path="/inscription"     element={<RegisterPage />} />
          <Route path="/tableau-de-bord" element={<><Navbar /><DashboardPage /></>} />
          <Route path="/ajouter-lieu"    element={<><Navbar /><AddVenuePage /></>} />
          <Route path="/comparer"        element={<><Navbar /><ComparePage /></>} />
          <Route path="/messages"        element={<><Navbar /><MessagesPage /></>} />
          <Route path="/abonnement"      element={<><Navbar /><SubscriptionPage /></>} />
          <Route path="/admin"           element={<AdminPage />} />
          <Route path="*" element={
            <><Navbar />
              <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                <h1 style={{ fontSize: '4rem', color: 'var(--surface-3)' }}>404</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Page introuvable</p>
                <a href="/" className="btn btn-primary">Retour à l'accueil</a>
              </div>
            </>
          } />
        </Routes>
        <PWAInstallBanner />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;