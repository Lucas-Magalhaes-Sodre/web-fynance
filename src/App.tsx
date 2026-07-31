import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { AdminSubscriptionsPage } from './pages/AdminSubscriptionsPage';
import { BillingPage } from './pages/BillingPage';
import { CreditCardsPage } from './pages/CreditCardsPage';
import { FinancialControlPage } from './pages/FinancialControlPage';
import { FinancialCategoriesPage } from './pages/FinancialCategoriesPage';
import { ProfilePage } from './pages/ProfilePage';
import { FinancialGoalsPage } from './pages/FinancialGoalsPage';
import { BirthdaysPage } from './pages/BirthdaysPage';
import { VacationCalculatorPage } from './modules/vacation-calculator/pages/VacationCalculatorPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LegalPage } from './pages/LegalPage';
import { EconomyPage } from './pages/EconomyPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { ProductAccessRoute } from './routes/ProductAccessRoute';
import { CookieConsentBanner } from './components/molecules/CookieConsentBanner';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/legal/:document" element={<LegalPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />}>
            <Route element={<ProductAccessRoute productKey="dashboard" />}>
              <Route index element={<DashboardPage />} />
            </Route>
            <Route path="billing" element={<BillingPage />} />
            <Route path="admin/subscriptions" element={<AdminSubscriptionsPage />} />
            <Route element={<ProductAccessRoute productKey="financial-control" />}>
              <Route path="control" element={<FinancialControlPage />} />
            </Route>
            <Route element={<ProductAccessRoute productKey="cards" />}>
              <Route path="cards" element={<CreditCardsPage />} />
            </Route>
            <Route element={<ProductAccessRoute productKey="savings" />}>
              <Route path="economy" element={<EconomyPage />} />
            </Route>
            <Route path="savings" element={<Navigate to="/app/economy" replace />} />
            <Route element={<ProductAccessRoute productKey="goals" />}>
              <Route path="goals" element={<FinancialGoalsPage />} />
            </Route>
            <Route element={<ProductAccessRoute productKey="birthdays" />}>
              <Route path="birthdays" element={<BirthdaysPage />} />
            </Route>
            <Route element={<ProductAccessRoute productKey="vacation-calculator" />}>
              <Route path="vacation-calculator" element={<VacationCalculatorPage />} />
            </Route>
            <Route path="profile" element={<ProfilePage />} />
            <Route element={<ProductAccessRoute productKey="settings" />}>
              <Route path="settings" element={<FinancialCategoriesPage />} />
            </Route>
            <Route path="categories" element={<Navigate to="/app/settings" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieConsentBanner />
    </>
  );
}
