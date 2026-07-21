import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CreditCardsPage } from './pages/CreditCardsPage';
import { FinancialControlPage } from './pages/FinancialControlPage';
import { FinancialCategoriesPage } from './pages/FinancialCategoriesPage';
import { ProfilePage } from './pages/ProfilePage';
import { FinancialGoalsPage } from './pages/FinancialGoalsPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EconomyPage } from './pages/EconomyPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { CookieConsentBanner } from './components/molecules/CookieConsentBanner';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="control" element={<FinancialControlPage />} />
            <Route path="cards" element={<CreditCardsPage />} />
            <Route path="categories" element={<FinancialCategoriesPage />} />
            <Route path="economy" element={<EconomyPage />} />
            <Route path="savings" element={<Navigate to="/app/economy" replace />} />
            <Route path="goals" element={<FinancialGoalsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<FinancialCategoriesPage />} />
            <Route path="categories" element={<Navigate to="/app/settings" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieConsentBanner />
    </>
  );
}
