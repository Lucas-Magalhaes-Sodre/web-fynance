import { api } from './client';
import type {
  DayControl,
  FinancialItem,
  MonthControl,
  PaymentStatus,
  PaymentSummary,
  PeriodType,
  Saving,
  SavingsSummary,
  ValueUpdateScope,
  WeekControl,
  YearControl
} from '../types/financial';

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
};

export type SavingPayload = {
  title: string;
  description?: string | null;
  amount: number;
  date: string;
  month?: number;
  year?: number;
  goalId?: string | null;
};

export async function getYearControl(year: number) {
  const { data } = await api.get<YearControl>('/financial-control/year', { params: { year } });
  return data;
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

export async function getSavingsSummary(month: number, year: number) {
  const { data } = await api.get<{ summary: SavingsSummary }>('/savings/summary', { params: { month, year } });
  return data.summary;
}
