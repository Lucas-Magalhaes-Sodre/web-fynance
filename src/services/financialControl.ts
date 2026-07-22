import { api } from './api';
import type {
  DayControl,
  CreditCard,
  CreditCardPurchase,
  CreditCardsOverview,
  EntryType,
  FinancialCategoryType,
  FinancialCategory,
  FinancialCalendar,
  FinancialComparison,
  FinancialGoal,
  FinancialGoalStatus,
  GoalSavingsPage,
  FinancialInsight,
  FinancialItem,
  FinancialReminder,
  MonthControl,
  PaymentStatus,
  PaymentSummary,
  PeriodType,
  Saving,
  SavingsExtract,
  SavingsExtractMode,
  SavingsMovementType,
  SavingsOverview,
  SavingsProjection,
  SavingTransferDirection,
  SavingsSummary,
  ValueUpdateScope,
  WeekControl,
  YearControl
} from '@/interfaces/financial';

export type FinancialEntryPayload = {
  name: string;
  description?: string | null;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  month?: number;
  year?: number;
  dueDate?: string | null;
  paymentDate?: string | null;
  dueDay?: number | null;
  isFixed?: boolean;
  recurrenceType?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  status?: PaymentStatus;
  recurrenceGeneration?: {
    mode: 'ALL_YEAR' | 'FROM_SELECTED_MONTH' | 'CUSTOM';
    startMonth: number;
    startYear: number;
    endMonth: number;
    endYear: number;
  };
};

export type FinancialCategoryPayload = {
  name: string;
  type: FinancialCategoryType;
  color: string;
};

export type SavingPayload = {
  title: string;
  category?: string;
  color?: string;
  description?: string | null;
  amount: number;
  date: string;
  month?: number;
  year?: number;
  isFixed?: boolean;
  recurrenceType?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  recurrenceGroupId?: string | null;
  recurrenceGeneration?: {
    mode: 'ALL_YEAR' | 'FROM_SELECTED_MONTH' | 'CUSTOM';
    startMonth: number;
    startYear: number;
    endMonth: number;
    endYear: number;
  };
  goalId?: string | null;
  hasYield?: boolean;
  yieldRateMonthly?: number | null;
};

export type SavingTransferPayload = {
  direction: SavingTransferDirection;
  title: string;
  category?: string;
  color?: string;
  description?: string | null;
  amount: number;
  date: string;
  month?: number;
  year?: number;
  goalId?: string | null;
};

export type FinancialGoalPayload = {
  title: string;
  description?: string | null;
  targetAmount: number;
  currentAmount?: number;
  startDate: string;
  targetDate?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  color?: string;
  hasYield?: boolean;
  yieldRateMonthly?: number | null;
  status?: FinancialGoalStatus;
};

export type CreditCardPayload = {
  name: string;
  dueDay: number;
  creditLimit?: number | null;
  color?: string;
  isActive?: boolean;
};

export type CreditCardPurchasePayload = {
  cardId: string;
  title: string;
  description?: string | null;
  amount: number;
  purchaseDate: string;
  installments: number;
};

export type FinancialReminderPayload = {
  financialItemId: string;
  title: string;
  message?: string | null;
  remindAt: string;
  offsetDays?: number | null;
};

export async function getYearControl(year: number) {
  const { data } = await api.get<YearControl>('/financial-control/year', { params: { year } });
  return data;
}

export async function listCreditCards(params?: {
  month?: number;
  year?: number;
  cardId?: string;
  cardName?: string;
}) {
  const { data } = await api.get<CreditCardsOverview>('/credit-cards', { params });
  return data;
}

export async function createCreditCard(payload: CreditCardPayload) {
  const { data } = await api.post<{ card: CreditCard }>('/credit-cards', payload);
  return data.card;
}

export async function updateCreditCard(id: string, payload: Partial<CreditCardPayload>) {
  const { data } = await api.put<{ card: CreditCard }>(`/credit-cards/${id}`, payload);
  return data.card;
}

export async function deleteCreditCard(id: string) {
  await api.delete(`/credit-cards/${id}`);
}

export async function createCreditCardPurchase(payload: CreditCardPurchasePayload) {
  const { data } = await api.post<{ purchase: CreditCardPurchase }>('/credit-cards/purchases', payload);
  return data.purchase;
}

export async function updateCreditCardPurchase(id: string, payload: Partial<Omit<CreditCardPurchasePayload, 'cardId'>>) {
  const { data } = await api.put<{ purchase: CreditCardPurchase }>(`/credit-cards/purchases/${id}`, payload);
  return data.purchase;
}

export async function deleteCreditCardPurchase(id: string, payload?: {
  deleteAllInstallments?: boolean;
  installmentNumber?: number;
  month?: number;
  year?: number;
}) {
  await api.delete(`/credit-cards/purchases/${id}`, { data: payload });
}

export async function getMonthControl(month: number, year: number) {
  const { data } = await api.get<MonthControl>('/financial-control/month', { params: { month, year } });
  return data;
}

export async function getWeekControl(startDate: string, endDate: string) {
  const { data } = await api.get<WeekControl>('/financial-control/week', { params: { startDate, endDate } });
  return data;
}

export async function getDayControl(date: string) {
  const { data } = await api.get<DayControl>('/financial-control/day', { params: { date } });
  return data;
}

export async function getFinancialCalendar(month: number, year: number) {
  const { data } = await api.get<FinancialCalendar>('/financial-calendar', { params: { month, year } });
  return data;
}

export async function createEntry(payload: FinancialEntryPayload) {
  const { data } = await api.post<{ item: FinancialItem }>('/financial-items', payload);
  return data.item;
}

export async function updateEntry(id: string, payload: FinancialEntryPayload) {
  const { data } = await api.put<{ item: FinancialItem }>(`/financial-items/${id}`, payload);
  return data.item;
}

export async function deleteEntry(id: string) {
  await api.delete(`/financial-items/${id}`);
}

export async function updateEntryPaymentStatus(id: string, payload: {
  status: PaymentStatus;
  paymentDate?: string | null;
  paidAt?: string | null;
}) {
  const { data } = await api.patch<{ item: FinancialItem }>(`/financial-items/${id}/payment-status`, payload);
  return data.item;
}

export async function getPaymentSummary(params?: {
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await api.get<{ summary: PaymentSummary }>('/financial-items/payment-summary', { params });
  return data.summary;
}

export async function renameCategory(payload: {
  type: 'INCOME' | 'EXPENSE';
  category: string;
  newCategory: string;
  year?: number;
}) {
  const { data } = await api.patch('/financial-items/category', payload);
  return data;
}

export async function deleteCategoryLine(payload: {
  type: 'INCOME' | 'EXPENSE';
  category: string;
  year?: number;
}) {
  const { data } = await api.delete('/financial-items/category', { data: payload });
  return data;
}

export async function listFinancialItems(params?: {
  type?: EntryType;
  status?: PaymentStatus;
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await api.get<{ items: FinancialItem[] }>('/financial-items', { params });
  return data.items;
}

export async function listFinancialReminders(params?: {
  financialItemId?: string;
  status?: 'PENDING' | 'READ' | 'DISMISSED';
  from?: string;
  to?: string;
  dueOnly?: boolean;
}) {
  const { data } = await api.get<{ reminders: FinancialReminder[] }>('/financial-reminders', { params });
  return data.reminders;
}

export async function createFinancialReminder(payload: FinancialReminderPayload) {
  const { data } = await api.post<{ reminder: FinancialReminder }>('/financial-reminders', payload);
  return data.reminder;
}

export async function updateFinancialReminder(id: string, payload: Partial<FinancialReminderPayload> & { status?: 'PENDING' | 'READ' | 'DISMISSED' }) {
  const { data } = await api.put<{ reminder: FinancialReminder }>(`/financial-reminders/${id}`, payload);
  return data.reminder;
}

export async function deleteFinancialReminder(id: string) {
  await api.delete(`/financial-reminders/${id}`);
}

export async function listFinancialCategories(params?: { type?: FinancialCategoryType }) {
  const { data } = await api.get<{ categories: FinancialCategory[] }>('/financial-categories', { params });
  return data.categories;
}

export async function createFinancialCategory(payload: FinancialCategoryPayload) {
  const { data } = await api.post<{ category: FinancialCategory }>('/financial-categories', payload);
  return data.category;
}

export async function updateFinancialCategory(id: string, payload: Partial<FinancialCategoryPayload>) {
  const { data } = await api.put<{ category: FinancialCategory }>(`/financial-categories/${id}`, payload);
  return data.category;
}

export async function deleteFinancialCategory(id: string) {
  await api.delete(`/financial-categories/${id}`);
}

export async function updateEntryValue(id: string, payload: {
  amount: number;
  date: string;
  scope: ValueUpdateScope;
  periodType: PeriodType;
  description?: string | null;
}) {
  const { data } = await api.patch(`/financial-items/${id}/value`, payload);
  return data;
}

export async function listSavings(params?: {
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
  category?: string;
  goalId?: string;
}) {
  const { data } = await api.get<{ savings: Saving[] }>('/savings', { params });
  return data.savings;
}

export async function createSaving(payload: SavingPayload) {
  const { data } = await api.post<{ saving: Saving }>('/savings', payload);
  return data.saving;
}

export async function updateSaving(id: string, payload: Partial<SavingPayload>) {
  const { data } = await api.put<{ saving: Saving }>(`/savings/${id}`, payload);
  return data.saving;
}

export async function deleteSaving(id: string) {
  await api.delete(`/savings/${id}`);
}

export async function transferSaving(payload: SavingTransferPayload) {
  const { data } = await api.post<{ saving: Saving; income?: FinancialItem | null }>('/savings/transfer', payload);
  return data;
}

export async function getSavingsSummary(month: number, year: number) {
  const { data } = await api.get<{ summary: SavingsSummary }>('/savings/summary', { params: { month, year } });
  return data.summary;
}

export async function getSavingsOverview() {
  const { data } = await api.get<{ overview: SavingsOverview }>('/savings/overview');
  return data.overview;
}

export async function getSavingsExtract(params: {
  mode: SavingsExtractMode;
  page?: number;
  limit?: number;
  categoryId?: string;
  subItemId?: string;
  movementType?: SavingsMovementType;
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await api.get<SavingsExtract>('/savings/extract', { params });
  return data;
}

export async function getSavingsProjection(targetDate: string) {
  const { data } = await api.get<{ projection: SavingsProjection }>('/savings/projection', {
    params: { targetDate },
  });
  return data.projection;
}

export async function listFinancialGoals(params?: { status?: FinancialGoalStatus }) {
  const { data } = await api.get<{ goals: FinancialGoal[] }>('/financial-goals', { params });
  return data.goals;
}

export async function createFinancialGoal(payload: FinancialGoalPayload) {
  const { data } = await api.post<{ goal: FinancialGoal }>('/financial-goals', payload);
  return data.goal;
}

export async function updateFinancialGoal(id: string, payload: Partial<FinancialGoalPayload>) {
  const { data } = await api.put<{ goal: FinancialGoal }>(`/financial-goals/${id}`, payload);
  return data.goal;
}

export async function deleteFinancialGoal(id: string) {
  await api.delete(`/financial-goals/${id}`);
}

export async function listFinancialGoalSavings(id: string, params?: { page?: number; limit?: number }) {
  const { data } = await api.get<GoalSavingsPage>(`/financial-goals/${id}/savings`, { params });
  return data;
}

export async function getFinancialInsights(month: number, year: number) {
  const { data } = await api.get<{ insights: FinancialInsight[] }>('/financial-insights', { params: { month, year } });
  return data.insights;
}

export async function getFinancialComparison(month: number, year: number) {
  const { data } = await api.get<FinancialComparison>('/financial-comparison', { params: { month, year } });
  return data;
}
