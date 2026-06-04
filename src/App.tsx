import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { FinancialItemsPage } from './pages/FinancialItemsPage';
import { FinancialControlPage } from './pages/FinancialControlPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SavingsPage } from './pages/SavingsPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="control" element={<FinancialControlPage />} />
          <Route path="savings" element={<SavingsPage />} />
          <Route path="fixed-expenses" element={<FinancialItemsPage title="Despesas fixas" description="Contas recorrentes do mes." type="FIXED_EXPENSE" />} />
          <Route path="extra-expenses" element={<FinancialItemsPage title="Despesas extras" description="Gastos ocasionais e variaveis." type="EXTRA_EXPENSE" />} />
          <Route path="fixed-incomes" element={<FinancialItemsPage title="Receitas fixas" description="Entradas recorrentes." type="FIXED_INCOME" />} />
          <Route path="extra-incomes" element={<FinancialItemsPage title="Receitas extras" description="Entradas pontuais." type="EXTRA_INCOME" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
