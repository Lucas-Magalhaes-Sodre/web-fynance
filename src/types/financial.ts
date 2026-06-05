export type FinancialItemType = 'INCOME' | 'EXPENSE';
export type EntryType = 'INCOME' | 'EXPENSE';
export type SavingTransferDirection = 'SAVE_FROM_BALANCE' | 'WITHDRAW_TO_BALANCE';
export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type PaymentStatus = 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO';
export type FinancialGoalStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELED';
export type FinancialInsightType = 'POSITIVE' | 'WARNING' | 'INFO' | 'NEGATIVE';

export type FinancialCategory = {
  id: string;
  userId: string;
  name: string;
  type: EntryType;
  color: string;
  createdAt: string;
  updatedAt: string;
};

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

export type Saving = {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  amount: number;
  date: string;
  month: number;
  year: number;
  goalId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SavingsSummary = {
  monthlyRegisteredSavings: number;
  accumulatedSavings: number;
  suggestedSavings: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
};

export type PaymentSummary = {
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  canceledCount: number;
  paidTotal: number;
  pendingTotal: number;
  overdueTotal: number;
};

export type ValueUpdateScope = 'ONLY_THIS_PERIOD' | 'FROM_THIS_PERIOD_FORWARD' | 'ALL_YEAR';
export type PeriodType = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export type DashboardTotals = {
  totalIncomes: number;
  totalExpenses: number;
  totalSavings: number;
  finalBalance: number;
};

export type PeriodTotals = {
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
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
  type: EntryType | 'SAVING';
  months: Record<number, number>;
  total: number;
};

export type YearControl = {
  year: number;
  months: Array<{ value: number; label: string }>;
  incomeRows: SpreadsheetRow[];
  expenseRows: SpreadsheetRow[];
  savingRows: SpreadsheetRow[];
  monthlySummary: MonthlySummary[];
  totals: {
    totalIncome: number;
    totalExpense: number;
    totalSavings: number;
    finalBalance: number;
    bestMonth: MonthlySummary;
    worstMonth: MonthlySummary;
  };
  items: FinancialItem[];
  savings: Saving[];
  categories: { incomes: string[]; expenses: string[] };
};

export type MonthControl = {
  month: number;
  year: number;
  incomes: FinancialItem[];
  expenses: FinancialItem[];
  savings: Saving[];
  totals: PeriodTotals;
};

export type DayControl = MonthControl & {
  date: string;
};

export type WeekDayControl = {
  date: string;
  incomes: FinancialItem[];
  expenses: FinancialItem[];
  savings: Saving[];
  totals: PeriodTotals;
};

export type WeekControl = {
  startDate: string;
  endDate: string;
  days: WeekDayControl[];
  incomes: FinancialItem[];
  expenses: FinancialItem[];
  savings: Saving[];
  totals: PeriodTotals;
};

export type FinancialCalendarDay = {
  date: string;
  incomes: number;
  expenses: number;
  savings: number;
  pendingBills: number;
  overdueBills: number;
  balance: number;
  items: FinancialItem[];
  savingItems: Saving[];
};

export type FinancialCalendar = {
  month: number;
  year: number;
  days: FinancialCalendarDay[];
};

export type FinancialGoal = {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  targetAmount: number;
  currentAmount: number;
  linkedSavings: number;
  remainingAmount: number;
  progressPercent: number;
  averageMonthlySavings: number;
  estimatedCompletionMonths?: number | null;
  startDate: string;
  targetDate?: string | null;
  category?: string | null;
  status: FinancialGoalStatus;
  createdAt: string;
  updatedAt: string;
};

export type FinancialInsight = {
  type: FinancialInsightType;
  title: string;
  description: string;
  value?: number;
  actionLabel?: string;
  actionTarget?: string;
};

export type FinancialVariation = {
  value: number;
  percentage: number;
};

export type FinancialComparisonMonth = {
  income: number;
  expense: number;
  savings: number;
  balance: number;
};

export type FinancialMonthlyEvolution = FinancialComparisonMonth & {
  month: number;
  label: string;
};

export type FinancialComparison = {
  currentMonth: FinancialComparisonMonth;
  previousMonth: FinancialComparisonMonth;
  incomeVariation: FinancialVariation;
  expenseVariation: FinancialVariation;
  balanceVariation: FinancialVariation;
  savingsVariation: FinancialVariation;
  monthlyEvolution: FinancialMonthlyEvolution[];
  bestMonths: FinancialMonthlyEvolution[];
  worstMonths: FinancialMonthlyEvolution[];
};
