import { api } from './api';
import type { CouponDiscountType } from '@/interfaces/financial';

export type ReferralCoupon = {
  id: string;
  userId: string;
  code: string;
  active: boolean;
  discountType: CouponDiscountType;
  discountValue: number;
  commissionType: CouponDiscountType;
  commissionValue: number;
  planCommissions?: Record<string, { type: CouponDiscountType; value: number }>;
  user?: { name: string; email: string };
  _count?: { commissions: number };
  createdAt: string;
  updatedAt: string;
};

export type ReferralCommissionStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELED';

export type ReferralCommission = {
  id: string;
  referralCouponId: string;
  referrerUserId: string;
  referredUserId: string;
  billingPlanId?: string | null;
  baseAmount: number;
  amount: number;
  settledAmount?: number;
  remainingAmount?: number;
  availableAt?: string | null;
  status: ReferralCommissionStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  referrerUser?: { name: string; email: string };
  referredUser?: { name: string; email: string };
  billingPlan?: { name: string } | null;
  referralCoupon?: { code: string };
};

export type ReferralPayoutPreference = 'CREDIT' | 'PIX';
export type PixKeyType = 'CPF_CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';

export type ReferralProgram = {
  coupon: ReferralCoupon;
  payout: {
    preference: ReferralPayoutPreference;
    cashAvailabilityDays: number;
    minimumWithdrawalAmount: number;
    pixKeyType?: PixKeyType | null;
    pixKey?: string | null;
    pixHolderName?: string | null;
    referralTermsAcceptedAt?: string | null;
    referralTermsVersion?: string | null;
  };
  summary: {
    totalAmount: number;
    pendingAmount: number;
    approvedAmount: number;
    paidAmount: number;
    availableCreditAmount: number;
    availableCashAmount: number;
    minimumWithdrawalAmount: number;
    cashAvailabilityDays: number;
    indications: number;
  };
  commissions: ReferralCommission[];
};

export type MarketingBanner = {
  id: string;
  key: string;
  variant?: 'REFERRAL' | 'PHOTO';
  title: string;
  subtitle: string;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaPath?: string | null;
  location: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export async function getMyReferralProgram() {
  const { data } = await api.get<{ referral: ReferralProgram }>('/referrals/me');
  return data.referral;
}

export async function updateMyReferralCoupon(payload: { code: string }) {
  const { data } = await api.patch<{ coupon: ReferralCoupon }>('/referrals/me/coupon', payload);
  return data.coupon;
}

export async function updateMyReferralPayout(payload: {
  preference: ReferralPayoutPreference;
  pixKeyType?: PixKeyType | null;
  pixKey?: string | null;
  pixHolderName?: string | null;
  referralTermsAccepted?: boolean;
}) {
  const { data } = await api.patch<{ payout: ReferralProgram['payout'] }>('/referrals/me/payout', payload);
  return data.payout;
}

export async function requestMyReferralWithdrawal() {
  const { data } = await api.post<{ withdrawal: { id: string; amount: number; status: string } }>('/referrals/me/withdrawals', { referralTermsAccepted: true });
  return data.withdrawal;
}

export async function listMarketingBanners(location = 'DASHBOARD') {
  const { data } = await api.get<{ banners: MarketingBanner[] }>('/referrals/banners', { params: { location } });
  return data.banners;
}
