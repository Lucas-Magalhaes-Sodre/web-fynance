import { api } from './api';
import type { SubscriptionPlan, SubscriptionStatus, User, UserRole } from '@/interfaces/financial';

export type BillingStatus = Pick<
  User,
  | 'id'
  | 'email'
  | 'role'
  | 'subscriptionStatus'
  | 'trialEndsAt'
  | 'manualAccessUntil'
  | 'accessBlockedAt'
  | 'paymentProvider'
  | 'providerCustomerId'
  | 'providerSubscriptionId'
  | 'subscriptionPlan'
  | 'subscriptionCurrentPeriodEnd'
  | 'lastPaymentAt'
  | 'access'
>;

export type AdminSubscriptionUser = User;

export type AdminBillingOverview = {
  usersTotal: number;
  activePaidUsers: number;
  trialUsers: number;
  blockedUsers: number;
  currentMonthlyRecurringRevenue: number;
  realizedRevenueEstimate: number;
  projectedTrialRevenue: number;
  defaultTrialDays: number;
};

export type AdminSettings = {
  defaultTrialDays: number;
};

export async function getBillingStatus() {
  const { data } = await api.get<{ billing: BillingStatus }>('/billing/me');
  return data.billing;
}

export async function getBillingPublicSettings() {
  const { data } = await api.get<{ settings: AdminSettings }>('/billing/public-settings');
  return data.settings;
}

export async function createCheckout(payload: { provider: 'MERCADO_PAGO' | 'STRIPE'; plan: 'MONTHLY' | 'YEARLY' }) {
  const { data } = await api.post<{ checkout: { provider: string; plan: string; url: string } }>('/billing/checkout', payload);
  return data.checkout;
}

export async function listAdminSubscriptionUsers() {
  const { data } = await api.get<{ users: AdminSubscriptionUser[] }>('/admin/subscriptions/users');
  return data.users;
}

export async function updateAdminSubscriptionUser(
  userId: string,
  payload: {
    subscriptionStatus?: SubscriptionStatus;
    trialEndsAt?: string | null;
    manualAccessUntil?: string | null;
    accessBlockedAt?: string | null;
    subscriptionPlan?: SubscriptionPlan;
    role?: UserRole;
    note?: string;
  },
) {
  const { data } = await api.patch<{ user: AdminSubscriptionUser }>(`/admin/subscriptions/users/${userId}`, payload);
  return data.user;
}

export async function grantAdminTrial(userId: string, days: number) {
  const { data } = await api.post<{ user: AdminSubscriptionUser }>(`/admin/subscriptions/users/${userId}/grant-trial`, { days });
  return data.user;
}

export async function getAdminBillingOverview() {
  const { data } = await api.get<{ overview: AdminBillingOverview }>('/admin/subscriptions/overview');
  return data.overview;
}

export async function getAdminSettings() {
  const { data } = await api.get<{ settings: AdminSettings }>('/admin/settings');
  return data.settings;
}

export async function updateAdminSettings(payload: AdminSettings) {
  const { data } = await api.put<{ settings: AdminSettings }>('/admin/settings', payload);
  return data.settings;
}
