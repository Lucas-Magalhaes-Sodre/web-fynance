import { api } from './api';
import type { CouponDiscountType, SubscriptionPlan, SubscriptionStatus, User, UserRole } from '@/interfaces/financial';
import type { MarketingBanner, PixKeyType, ReferralCommission, ReferralCommissionStatus, ReferralCoupon } from './referrals';

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
  | 'billingPlanId'
  | 'planNameSnapshot'
  | 'planPriceSnapshot'
  | 'planDurationMonthsSnapshot'
  | 'planProductKeysSnapshot'
  | 'planProductLabelsSnapshot'
  | 'planIncludedItemsSnapshot'
  | 'couponCodeSnapshot'
  | 'couponDiscountSnapshot'
  | 'subscriptionCurrentPeriodEnd'
  | 'lastPaymentAt'
  | 'access'
>;

export type AdminSubscriptionUser = User;

export type PaginationInfo = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type BillingPlan = {
  id: string;
  name: string;
  description?: string | null;
  originalPrice?: number | null;
  price: number;
  currency: string;
  durationMonths: number;
  productKeys: string[];
  productLabels?: Record<string, string>;
  includedItems: string[];
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type BillingCoupon = {
  id: string;
  code: string;
  description?: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  active: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  billingPlanId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CouponValidationResult = {
  code: string;
  description?: string | null;
  discountType: CouponDiscountType;
  discountValue: number;
  kind?: 'PROMOTIONAL' | 'REFERRAL';
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
};

export type AdminBillingOverview = {
  usersTotal: number;
  activePaidUsers: number;
  trialUsers: number;
  blockedUsers: number;
  currentMonthlyRecurringRevenue: number;
  realizedRevenueEstimate: number;
  currentMonthRevenue: number;
  currentMonthNewPaidPlans: number;
  currentMonthMonthlyRevenueIncrease: number;
  projectedTrialRevenue: number;
  defaultTrialDays: number;
};

export type AdminSettings = {
  defaultTrialDays: number;
  contactEmails: string[];
  contactPhones: string[];
  contactMessage: string;
};

export async function getBillingStatus() {
  const { data } = await api.get<{ billing: BillingStatus }>('/billing/me');
  return data.billing;
}

export async function getBillingPublicSettings() {
  const { data } = await api.get<{ settings: AdminSettings }>('/billing/public-settings');
  return data.settings;
}

export async function listBillingPlans() {
  const { data } = await api.get<{ plans: BillingPlan[] }>('/billing/plans');
  return data.plans;
}

export async function validateBillingCoupon(payload: { planId: string; couponCode: string }) {
  const { data } = await api.post<{ coupon: CouponValidationResult }>('/billing/coupons/validate', payload);
  return data.coupon;
}

export async function createCheckout(payload: { provider: 'MERCADO_PAGO' | 'STRIPE'; planId: string; couponCode?: string; useReferralCredit?: boolean; legalAccepted: true }) {
  const { data } = await api.post<{ checkout: { provider: string; planId: string; planName: string; url: string } }>('/billing/checkout', payload);
  return data.checkout;
}

export type ReferralWithdrawal = {
  id: string;
  userId: string;
  amount: number;
  status: 'REQUESTED' | 'PAID' | 'CANCELED';
  pixKeyType: PixKeyType;
  pixKey: string;
  pixHolderName: string;
  requestedAt: string;
  paidAt?: string | null;
  canceledAt?: string | null;
  adminNotes?: string | null;
  user?: { name: string; email: string };
  settlementsCount?: number;
};

export async function listAdminSubscriptionUsers(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  subscriptionStatus?: SubscriptionStatus;
  role?: UserRole;
  billingPlanId?: string;
} = {}) {
  const { data } = await api.get<{ users: AdminSubscriptionUser[]; pagination: PaginationInfo }>('/admin/subscriptions/users', {
    params
  });
  return data;
}

export async function updateAdminSubscriptionUser(
  userId: string,
  payload: {
    subscriptionStatus?: SubscriptionStatus;
    trialEndsAt?: string | null;
    manualAccessUntil?: string | null;
    accessBlockedAt?: string | null;
    subscriptionCurrentPeriodEnd?: string | null;
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

export async function anonymizeAdminSubscriptionUser(userId: string, payload: { confirmationEmail: string; note?: string }) {
  const { data } = await api.post<{ user: AdminSubscriptionUser }>(`/admin/subscriptions/users/${userId}/anonymize`, payload);
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

export async function listAdminBillingPlans() {
  const { data } = await api.get<{ plans: BillingPlan[] }>('/admin/subscriptions/plans');
  return data.plans;
}

export async function createAdminBillingPlan(payload: Omit<BillingPlan, 'id' | 'createdAt' | 'updatedAt'>) {
  const { data } = await api.post<{ plan: BillingPlan }>('/admin/subscriptions/plans', payload);
  return data.plan;
}

export async function updateAdminBillingPlan(planId: string, payload: Omit<BillingPlan, 'id' | 'createdAt' | 'updatedAt'>) {
  const { data } = await api.put<{ plan: BillingPlan }>(`/admin/subscriptions/plans/${planId}`, payload);
  return data.plan;
}

export async function deactivateAdminBillingPlan(planId: string) {
  const { data } = await api.delete<{ plan: BillingPlan }>(`/admin/subscriptions/plans/${planId}`);
  return data.plan;
}

export async function reorderAdminBillingPlans(planIds: string[]) {
  const { data } = await api.put<{ plans: BillingPlan[] }>('/admin/subscriptions/plans/order', { planIds });
  return data.plans;
}

export async function reorderAdminMarketingBanners(bannerIds: string[]) {
  const { data } = await api.put<{ banners: MarketingBanner[] }>('/admin/marketing-banners/order', { bannerIds });
  return data.banners;
}

export async function listAdminBillingCoupons() {
  const { data } = await api.get<{ coupons: BillingCoupon[] }>('/admin/subscriptions/coupons');
  return data.coupons;
}

export async function createAdminBillingCoupon(payload: Omit<BillingCoupon, 'id' | 'createdAt' | 'updatedAt' | 'usedCount'>) {
  const { data } = await api.post<{ coupon: BillingCoupon }>('/admin/subscriptions/coupons', payload);
  return data.coupon;
}

export async function updateAdminBillingCoupon(couponId: string, payload: Omit<BillingCoupon, 'id' | 'createdAt' | 'updatedAt' | 'usedCount'>) {
  const { data } = await api.put<{ coupon: BillingCoupon }>(`/admin/subscriptions/coupons/${couponId}`, payload);
  return data.coupon;
}

export async function deactivateAdminBillingCoupon(couponId: string) {
  const { data } = await api.delete<{ coupon: BillingCoupon }>(`/admin/subscriptions/coupons/${couponId}`);
  return data.coupon;
}

export async function listAdminReferralCoupons() {
  const { data } = await api.get<{ coupons: ReferralCoupon[] }>('/admin/referrals/coupons');
  return data.coupons;
}

export async function updateAdminReferralCoupon(couponId: string, payload: {
  code: string;
  active: boolean;
  discountType: CouponDiscountType;
  discountValue: number;
  commissionType: CouponDiscountType;
  commissionValue: number;
  planCommissions?: Record<string, { type: CouponDiscountType; value: number }>;
}) {
  const { data } = await api.put<{ coupon: ReferralCoupon }>(`/admin/referrals/coupons/${couponId}`, payload);
  return data.coupon;
}

export async function listAdminReferralCommissions() {
  const { data } = await api.get<{ commissions: ReferralCommission[] }>('/admin/referrals/commissions');
  return data.commissions;
}

export async function updateAdminReferralCommission(commissionId: string, payload: { status: ReferralCommissionStatus; notes?: string | null }) {
  const { data } = await api.put<{ commission: ReferralCommission }>(`/admin/referrals/commissions/${commissionId}`, payload);
  return data.commission;
}

export async function listAdminReferralWithdrawals() {
  const { data } = await api.get<{ withdrawals: ReferralWithdrawal[] }>('/admin/referrals/withdrawals');
  return data.withdrawals;
}

export async function updateAdminReferralWithdrawal(withdrawalId: string, payload: { status: 'PAID' | 'CANCELED'; adminNotes?: string | null }) {
  const { data } = await api.put<{ withdrawal: ReferralWithdrawal }>(`/admin/referrals/withdrawals/${withdrawalId}`, payload);
  return data.withdrawal;
}

export async function listAdminMarketingBanners() {
  const { data } = await api.get<{ banners: MarketingBanner[] }>('/admin/marketing-banners');
  return data.banners;
}

export async function createAdminMarketingBanner(payload: Omit<MarketingBanner, 'id' | 'key' | 'createdAt' | 'updatedAt'>) {
  const { data } = await api.post<{ banner: MarketingBanner }>('/admin/marketing-banners', payload);
  return data.banner;
}

export async function updateAdminMarketingBanner(bannerId: string, payload: Omit<MarketingBanner, 'id' | 'key' | 'createdAt' | 'updatedAt'>) {
  const { data } = await api.put<{ banner: MarketingBanner }>(`/admin/marketing-banners/${bannerId}`, payload);
  return data.banner;
}

export async function deleteAdminMarketingBanner(bannerId: string) {
  const { data } = await api.delete<{ banner: MarketingBanner }>(`/admin/marketing-banners/${bannerId}`);
  return data.banner;
}
