import { api } from './client';
import type { DayControl, FinancialItem, MonthControl, PeriodType, ValueUpdateScope, WeekControl, YearControl } from '../types/financial';

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
  status?: 'PENDENTE' | 'PAGO' | 'ATRASADO';
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
