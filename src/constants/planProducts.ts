import type { SvgIconComponent } from '@mui/icons-material';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import CakeIcon from '@mui/icons-material/Cake';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FlagIcon from '@mui/icons-material/Flag';
import SavingsIcon from '@mui/icons-material/Savings';
import SettingsIcon from '@mui/icons-material/Settings';

export const planProducts = [
  { key: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { key: 'financial-control', label: 'Controle financeiro', icon: CalendarMonthIcon },
  { key: 'cards', label: 'Cartões', icon: CreditCardIcon },
  { key: 'savings', label: 'Economias', icon: SavingsIcon },
  { key: 'goals', label: 'Metas', icon: FlagIcon },
  { key: 'birthdays', label: 'Aniversários', icon: CakeIcon },
  { key: 'vacation-calculator', label: 'Calculadora de Férias', icon: BeachAccessIcon },
  { key: 'settings', label: 'Configurações', icon: SettingsIcon },
] as const satisfies Array<{ key: string; label: string; icon: SvgIconComponent }>;

export type PlanProductKey = (typeof planProducts)[number]['key'];
export const planProductKeys = planProducts.map((product) => product.key);

export function normalizePlanProductKeys(keys?: string[] | null) {
  const allowed = new Set<string>(planProductKeys);
  const source = keys ?? planProductKeys;
  return Array.from(new Set(source.filter((key) => allowed.has(key))));
}

export function productLabel(key: string) {
  return planProducts.find((product) => product.key === key)?.label ?? key;
}

export function productPlanLabel(key: string, labels?: Record<string, string> | null) {
  return labels?.[key]?.trim() || productLabel(key);
}
