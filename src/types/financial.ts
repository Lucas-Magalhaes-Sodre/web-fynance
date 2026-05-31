export type FinancialItemType = 'INCOME' | 'EXPENSE' | 'FIXED_EXPENSE' | 'EXTRA_EXPENSE' | 'FIXED_INCOME' | 'EXTRA_INCOME';
export type EntryType = 'INCOME' | 'EXPENSE';
export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type PaymentStatus = 'PENDENTE' | 'PAGO' | 'ATRASADO';

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type FinancialItem = {
  id: string;
  userId: string;
  title: string;
  name: string;
  description?: string | null;
  amount: number;
  type: FinancialItemType;
  category: string;
  dueDate?: string | null;
  paymentDate?: string | null;
  status: PaymentStatus;
  dueDay?: number | null;
  isFixed: boolean;
  recurrenceType: RecurrenceType;
  recurrenceGroupId?: string | null;
  date: string;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
};

export type ValueUpdateScope = 'ONLY_THIS_PERIOD' | 'FROM_THIS_PERIOD_FORWARD' | 'ALL_YEAR';
export type PeriodType = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export type DashboardTotals = {
  fixedExpenses: number;
  extraExpenses: number;
  fixedIncomes: number;
  extraIncomes: number;
  totalIncomes: number;
  totalExpenses: number;
  finalBalance: number;
};

export type PeriodTotals = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  paidExpenses: number;
  pendingExpenses: number;
  overdueExpenses: number;
  paidExpensesCount: number;
  pendingExpensesCount: number;
  overdueExpensesCount: number;
};

export type MonthlySummary = PeriodTotals & {
  month: number;
  label: string;
};

export type SpreadsheetRow = {
  category: string;
  type: EntryType;
  months: Record<number, number>;
  total: number;
};

export type YearControl = {
  year: number;
  months: Array<{ value: number; label: string }>;
  incomeRows: SpreadsheetRow[];
  expenseRows: SpreadsheetRow[];
  monthlySummary: MonthlySummary[];
  totals: {
    totalIncome: number;
    totalExpense: number;
    finalBalance: number;
    bestMonth: MonthlySummary;
    worstMonth: MonthlySummary;
  };
  items: FinancialItem[];
  categories: { incomes: string[]; expenses: string[] };
};

export type MonthControl = {
  month: number;
  year: number;
  incomes: FinancialItem[];
  expenses: FinancialItem[];
  totals: PeriodTotals;
};

export type DayControl = MonthControl & {
  date: string;
};

export type WeekDayControl = {
  date: string;
  incomes: FinancialItem[];
  expenses: FinancialItem[];
  totals: PeriodTotals;
};

export type WeekControl = {
  startDate: string;
  endDate: string;
  days: WeekDayControl[];
  incomes: FinancialItem[];
  expenses: FinancialItem[];
  totals: PeriodTotals;
};
