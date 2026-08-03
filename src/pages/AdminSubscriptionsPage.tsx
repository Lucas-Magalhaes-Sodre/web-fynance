import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AddIcon from "@mui/icons-material/Add";
import CampaignIcon from "@mui/icons-material/Campaign";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { MoneyTextField } from "@/components/molecules/MoneyTextField";
import { type ChangeEvent, useEffect, useState } from "react";
import { AppDialog } from "@/components/molecules/AppDialog";
import { AppDateField } from "@/components/molecules/AppDateField";
import { FeedbackSnackbar } from "@/components/molecules/FeedbackSnackbar";
import { LoadingActionButton } from "@/components/molecules/LoadingActionButton";
import {
  normalizePlanProductKeys,
  planProducts,
  productPlanLabel,
} from "@/constants/planProducts";
import { useAuth } from "@/contexts/AuthContext";
import type {
  PaymentProvider,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
} from "@/interfaces/financial";
import {
  getAdminBillingOverview,
  getAdminSettings,
  grantAdminTrial,
  anonymizeAdminSubscriptionUser,
  createAdminBillingCoupon,
  createAdminBillingPlan,
  createAdminMarketingBanner,
  deleteAdminMarketingBanner,
  deactivateAdminBillingCoupon,
  deactivateAdminBillingPlan,
  listAdminBillingCoupons,
  listAdminBillingPlans,
  listAdminMarketingBanners,
  listAdminReferralCommissions,
  listAdminReferralCoupons,
  listAdminReferralWithdrawals,
  listAdminSubscriptionUsers,
  reorderAdminBillingPlans,
  reorderAdminMarketingBanners,
  updateAdminSettings,
  updateAdminBillingCoupon,
  updateAdminBillingPlan,
  updateAdminMarketingBanner,
  updateAdminReferralCommission,
  updateAdminReferralCoupon,
  updateAdminReferralWithdrawal,
  updateAdminSubscriptionUser,
  type AdminBillingOverview,
  type AdminSubscriptionUser,
  type BillingCoupon,
  type BillingPlan,
  type PaginationInfo,
  type ReferralWithdrawal,
} from "@/services/billing";
import type { MarketingBanner, ReferralCommission, ReferralCoupon } from "@/services/referrals";
import {
  currencyToNumber,
  formatDate,
  formatMoney,
} from "@/utils/format";

const statuses: SubscriptionStatus[] = [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
  "BLOCKED",
  "MANUAL",
];
type AdminAccessOption = SubscriptionStatus | "LIFETIME";
const accessOptions: AdminAccessOption[] = [...statuses, "LIFETIME"];
const roles: UserRole[] = ["USER", "ADMIN"];

const statusLabels: Record<SubscriptionStatus, string> = {
  TRIALING: "Teste grátis",
  ACTIVE: "Ativo",
  PAST_DUE: "Pagamento pendente",
  CANCELED: "Cancelado",
  BLOCKED: "Bloqueado",
  MANUAL: "Liberação manual",
};

const roleLabels: Record<UserRole, string> = {
  USER: "Usuário",
  ADMIN: "Administrador",
};

const providerLabels: Record<PaymentProvider, string> = {
  NONE: "Nenhum",
  MERCADO_PAGO: "Mercado Pago",
  STRIPE: "Stripe",
};

const planLabels: Record<SubscriptionPlan, string> = {
  FREE: "Grátis",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
  LIFETIME: "Vitalício",
};

const accessOptionLabels: Record<AdminAccessOption, string> = {
  ...statusLabels,
  LIFETIME: "Acesso vitalício",
};

function couponDiscountFormValue(coupon: BillingCoupon) {
  return coupon.discountType === "FIXED"
    ? formatMoney(coupon.discountValue)
    : String(coupon.discountValue);
}

function couponDiscountPayloadValue(type: string, value: string) {
  return type === "FIXED"
    ? currencyToNumber(value)
    : Number(value.replace(",", "."));
}

function looseNumber(value: string) {
  const parsed = Number(value.replace(/[^\d,.]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function trialEndLabel(date?: string | null) {
  if (!date) return "-";
  const end = new Date(date);
  if (Number.isNaN(end.getTime())) return "-";

  const today = new Date();
  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const days = Math.ceil((endOnly.getTime() - todayOnly.getTime()) / 86400000);
  if (days < 0) return `${formatDate(date)} · encerrado`;
  if (days === 0) return `${formatDate(date)} · termina hoje`;
  if (days === 1) return `${formatDate(date)} · amanhã`;
  return `${formatDate(date)} · em ${days} dias`;
}

function expirationLabel(date?: string | null) {
  if (!date) return "-";
  const end = new Date(date);
  if (Number.isNaN(end.getTime())) return "-";

  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const days = Math.ceil((endOnly.getTime() - todayOnly.getTime()) / 86400000);
  if (days < 0) return `${formatDate(date)} · expirado`;
  if (days === 0) return `${formatDate(date)} · expira hoje`;
  if (days === 1) return `${formatDate(date)} · expira amanhã`;
  return `${formatDate(date)} · expira em ${days} dias`;
}

function userAccessOption(user: AdminSubscriptionUser): AdminAccessOption {
  return user.subscriptionPlan === "LIFETIME" ? "LIFETIME" : user.subscriptionStatus ?? "TRIALING";
}

function currentMonthName() {
  const name = new Date().toLocaleDateString("pt-BR", { month: "long" });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function isAdminAccess(user: AdminSubscriptionUser) {
  return user.role === "ADMIN";
}

function isLifetimeAccess(user: AdminSubscriptionUser) {
  return user.subscriptionPlan === "LIFETIME";
}

function hasActivePaidPlan(user: AdminSubscriptionUser) {
  return Boolean(user.access?.hasPaidAccess) && !isLifetimeAccess(user);
}

function canRenewTrial(user: AdminSubscriptionUser) {
  return !isAdminAccess(user) && !isLifetimeAccess(user) && !hasActivePaidPlan(user) && user.subscriptionStatus === "TRIALING";
}

function canGrantManualAccess(user: AdminSubscriptionUser) {
  return !isAdminAccess(user) && !isLifetimeAccess(user) && !hasActivePaidPlan(user) && user.subscriptionStatus !== "TRIALING";
}

function daysFieldCopy(user: AdminSubscriptionUser) {
  if (user.subscriptionStatus === "TRIALING") {
    return {
      label: "Dias de teste",
      helperText: "Para renovar teste",
    };
  }

  return {
    label: "Dias de liberação",
    helperText: "Para liberar acesso manual",
  };
}

const bannerImageRules = {
  width: 1600,
  height: 500,
  minWidth: 1200,
  minHeight: 360,
  minRatio: 2.6,
  maxRatio: 4.2,
};

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = String(reader.result ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function cropBannerImage(image: HTMLImageElement) {
  const targetRatio = bannerImageRules.width / bannerImageRules.height;
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;

  if (sourceRatio > targetRatio) {
    sourceWidth = image.naturalHeight * targetRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / targetRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }

  const canvas = document.createElement("canvas");
  canvas.width = bannerImageRules.width;
  canvas.height = bannerImageRules.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponível.");
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

export function AdminSubscriptionsPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminSubscriptionUser[]>([]);
  const [usersPagination, setUsersPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [adminTab, setAdminTab] = useState<"PLANS" | "COUPONS" | "REFERRALS" | "BANNERS" | "USERS" | "SETTINGS">(
    "PLANS",
  );
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [coupons, setCoupons] = useState<BillingCoupon[]>([]);
  const [referralCoupons, setReferralCoupons] = useState<ReferralCoupon[]>([]);
  const [referralCommissions, setReferralCommissions] = useState<ReferralCommission[]>([]);
  const [referralWithdrawals, setReferralWithdrawals] = useState<ReferralWithdrawal[]>([]);
  const [marketingBanners, setMarketingBanners] = useState<MarketingBanner[]>([]);
  const [overview, setOverview] = useState<AdminBillingOverview | null>(null);
  const [defaultTrialDays, setDefaultTrialDays] = useState("14");
  const [contactEmails, setContactEmails] = useState("");
  const [contactPhones, setContactPhones] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [daysByUser, setDaysByUser] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BillingPlan | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<BillingCoupon | null>(
    null,
  );
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [editingReferralCoupon, setEditingReferralCoupon] = useState<ReferralCoupon | null>(null);
  const [savingReferralCoupon, setSavingReferralCoupon] = useState(false);
  const [withdrawalAction, setWithdrawalAction] = useState<{ withdrawal: ReferralWithdrawal; status: "PAID" | "CANCELED" } | null>(null);
  const [savingWithdrawal, setSavingWithdrawal] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<MarketingBanner | null>(null);
  const [savingBanner, setSavingBanner] = useState(false);
  const [bannerError, setBannerError] = useState("");
  const [anonymizeUser, setAnonymizeUser] =
    useState<AdminSubscriptionUser | null>(null);
  const [manualAccessUser, setManualAccessUser] =
    useState<AdminSubscriptionUser | null>(null);
  const [blockUser, setBlockUser] = useState<AdminSubscriptionUser | null>(
    null,
  );
  const [anonymizeEmail, setAnonymizeEmail] = useState("");
  const [anonymizeNote, setAnonymizeNote] = useState("");
  const [anonymizing, setAnonymizing] = useState(false);
  const [userFilters, setUserFilters] = useState({
    search: "",
    subscriptionStatus: "",
    role: "",
    billingPlanId: "",
  });
  const [draggingPlanId, setDraggingPlanId] = useState<string | null>(null);
  const [draggingBannerId, setDraggingBannerId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    originalPrice: "",
    price: "",
    currency: "BRL",
    durationMonths: "1",
    productKeys: normalizePlanProductKeys(),
    productLabels: {} as Record<string, string>,
    includedItems: [] as string[],
    active: "true",
    sortOrder: "0",
  });
  const [couponForm, setCouponForm] = useState({
    code: "",
    description: "",
    discountType: "PERCENT",
    discountValue: "",
    active: "true",
    startsAt: "",
    expiresAt: "",
    usageLimit: "",
    billingPlanId: "",
  });
  const [referralCouponForm, setReferralCouponForm] = useState({
    code: "",
    active: "true",
    discountType: "PERCENT",
    discountValue: "10",
    commissionType: "PERCENT",
    commissionValue: "10",
    planCommissions: {} as Record<string, { type: "PERCENT" | "FIXED"; value: number }>,
  });
  const [bannerForm, setBannerForm] = useState({
    variant: "REFERRAL" as "REFERRAL" | "PHOTO",
    title: "",
    subtitle: "",
    imageUrl: "",
    ctaLabel: "",
    ctaPath: "",
    location: "DASHBOARD",
    active: "true",
    sortOrder: "10",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadUsers(
    page = usersPagination.page,
    pageSize = usersPagination.pageSize,
    filters = userFilters,
  ) {
    const usersResult = await listAdminSubscriptionUsers({
      page,
      pageSize,
      search: filters.search || undefined,
      subscriptionStatus: (filters.subscriptionStatus || undefined) as
        | SubscriptionStatus
        | undefined,
      role: (filters.role || undefined) as UserRole | undefined,
      billingPlanId: filters.billingPlanId || undefined,
    });
    setUsers(usersResult.users);
    setUsersPagination(usersResult.pagination);
  }

  async function load() {
    const safe = async <T,>(promise: Promise<T>, fallback: T) => {
      try {
        return await promise;
      } catch {
        return fallback;
      }
    };
    const [
      overviewResult,
      settingsResult,
      plansResult,
      couponsResult,
      referralCouponsResult,
      referralCommissionsResult,
      referralWithdrawalsResult,
      marketingBannersResult,
    ] =
      await Promise.all([
        safe(getAdminBillingOverview(), null),
        safe(getAdminSettings(), null),
        safe(listAdminBillingPlans(), []),
        safe(listAdminBillingCoupons(), []),
        safe(listAdminReferralCoupons(), []),
        safe(listAdminReferralCommissions(), []),
        safe(listAdminReferralWithdrawals(), []),
        safe(listAdminMarketingBanners(), []),
      ]);
    if (overviewResult) setOverview(overviewResult);
    if (settingsResult) {
      setDefaultTrialDays(String(settingsResult.defaultTrialDays));
      setContactEmails(settingsResult.contactEmails.join("\n"));
      setContactPhones(settingsResult.contactPhones.join("\n"));
      setContactMessage(settingsResult.contactMessage ?? "");
    }
    setPlans(plansResult);
    setCoupons(couponsResult);
    setReferralCoupons(referralCouponsResult);
    setReferralCommissions(referralCommissionsResult);
    setReferralWithdrawals(referralWithdrawalsResult);
    setMarketingBanners(marketingBannersResult);
    await loadUsers(1, usersPagination.pageSize);
  }

  useEffect(() => {
    load();
  }, []);

  function accessDaysForUser(user: AdminSubscriptionUser) {
    return Math.max(1, Number(daysByUser[user.id] || 14));
  }

  function manualAccessUntilForUser(user: AdminSubscriptionUser) {
    const date = new Date();
    date.setDate(date.getDate() + accessDaysForUser(user));
    return date;
  }

  async function grantTrial(userId: string) {
    setError("");
    setSavingId(userId);
    try {
      await grantAdminTrial(userId, Number(daysByUser[userId] || 14));
      await Promise.all([
        loadUsers(),
        getAdminBillingOverview().then(setOverview),
      ]);
      setNotice("Teste renovado com sucesso.");
    } catch {
      setError("Não foi possível renovar o teste agora.");
    } finally {
      setSavingId(null);
    }
  }

  async function setStatus(
    userId: string,
    subscriptionStatus: SubscriptionStatus,
  ) {
    setError("");
    setSavingId(userId);
    try {
      await updateAdminSubscriptionUser(userId, {
        subscriptionStatus,
        ...(subscriptionStatus !== "ACTIVE" ? { subscriptionPlan: "FREE" as const } : {}),
        subscriptionCurrentPeriodEnd: subscriptionStatus === "ACTIVE" ? undefined : null,
        accessBlockedAt:
          subscriptionStatus === "BLOCKED" ? new Date().toISOString() : null,
      });
      await Promise.all([
        loadUsers(),
        getAdminBillingOverview().then(setOverview),
      ]);
      setNotice("Status do usuário atualizado com sucesso.");
      return true;
    } catch {
      setError("Não foi possível alterar o status.");
      return false;
    } finally {
      setSavingId(null);
    }
  }

  async function setAccessOption(targetUser: AdminSubscriptionUser, option: AdminAccessOption) {
    const userId = targetUser.id;
    if (option === "LIFETIME") {
      await grantLifetimeAccess(userId);
      return;
    }

    if (option === "MANUAL") {
      setManualAccessUser(targetUser);
      return;
    }

    if (targetUser.subscriptionPlan === "LIFETIME") {
      setError("");
      setSavingId(userId);
      try {
        await updateAdminSubscriptionUser(userId, {
          subscriptionStatus: option,
          subscriptionPlan: "FREE",
          trialEndsAt: option === "TRIALING" ? targetUser.trialEndsAt ?? null : null,
          manualAccessUntil: null,
          accessBlockedAt: option === "BLOCKED" ? new Date().toISOString() : null,
          subscriptionCurrentPeriodEnd: null,
        });
        await Promise.all([
          loadUsers(),
          getAdminBillingOverview().then(setOverview),
        ]);
        setNotice("Status do usuário atualizado com sucesso.");
      } catch {
        setError("Não foi possível alterar o status.");
      } finally {
        setSavingId(null);
      }
      return;
    }

    await setStatus(userId, option);
  }

  async function grantLifetimeAccess(userId: string) {
    setError("");
    setSavingId(userId);
    try {
      await updateAdminSubscriptionUser(userId, {
        subscriptionStatus: "ACTIVE",
        subscriptionPlan: "LIFETIME",
        trialEndsAt: null,
        manualAccessUntil: null,
        accessBlockedAt: null,
        subscriptionCurrentPeriodEnd: null,
      });
      await Promise.all([
        loadUsers(),
        getAdminBillingOverview().then(setOverview),
      ]);
      setNotice("Acesso vitalício liberado com sucesso.");
    } catch {
      setError("Não foi possível liberar acesso vitalício.");
    } finally {
      setSavingId(null);
    }
  }

  async function grantManualAccess(userId: string) {
    const days = Math.max(1, Number(daysByUser[userId] || 14));
    const manualAccessUntil = new Date();
    manualAccessUntil.setDate(manualAccessUntil.getDate() + days);
    setError("");
    setSavingId(userId);
    try {
      await updateAdminSubscriptionUser(userId, {
        subscriptionStatus: "MANUAL",
        subscriptionPlan: "FREE",
        manualAccessUntil: manualAccessUntil.toISOString(),
        trialEndsAt: null,
        accessBlockedAt: null,
        subscriptionCurrentPeriodEnd: null,
      });
      await Promise.all([
        loadUsers(),
        getAdminBillingOverview().then(setOverview),
      ]);
      setNotice(`Acesso manual liberado até ${formatDate(manualAccessUntil.toISOString())}.`);
      return true;
    } catch {
      setError("Não foi possível liberar acesso manual.");
      return false;
    } finally {
      setSavingId(null);
    }
  }

  async function setRole(userId: string, role: UserRole) {
    setError("");
    if (userId === currentUser?.id && role === "USER") {
      setError("Você não pode remover seu próprio acesso administrativo.");
      return;
    }
    setSavingId(userId);
    try {
      await updateAdminSubscriptionUser(userId, { role });
      await Promise.all([
        loadUsers(),
        getAdminBillingOverview().then(setOverview),
      ]);
      setNotice("Perfil do usuário atualizado com sucesso.");
    } catch {
      setError("Não foi possível alterar o perfil do usuário.");
    } finally {
      setSavingId(null);
    }
  }

  async function saveSettings() {
    setError("");
    setSavingSettings(true);
    try {
      const days = Math.max(0, Number(defaultTrialDays) || 0);
      const settings = await updateAdminSettings({
        defaultTrialDays: days,
        contactEmails: contactEmails.split(/[\n,;]/).map((item) => item.trim()).filter(Boolean),
        contactPhones: contactPhones.split(/[\n,;]/).map((item) => item.trim()).filter(Boolean),
        contactMessage: contactMessage.trim(),
      });
      setDefaultTrialDays(String(settings.defaultTrialDays));
      setContactEmails(settings.contactEmails.join("\n"));
      setContactPhones(settings.contactPhones.join("\n"));
      setContactMessage(settings.contactMessage ?? "");
      await load();
      setNotice("Configurações salvas com sucesso.");
    } catch {
      setError("Não foi possível salvar as configurações.");
    } finally {
      setSavingSettings(false);
    }
  }

  function openNewPlan() {
    setEditingPlan(null);
    setPlanForm({
      name: "",
      description: "",
      originalPrice: "",
      price: "",
      currency: "BRL",
      durationMonths: "1",
      productKeys: normalizePlanProductKeys(),
      productLabels: {},
      includedItems: [],
      active: "true",
      sortOrder: String((plans.length + 1) * 10),
    });
    setPlanModalOpen(true);
  }

  function openEditPlan(plan: BillingPlan) {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description ?? "",
      originalPrice: plan.originalPrice ? formatMoney(plan.originalPrice) : "",
      price: formatMoney(plan.price),
      currency: plan.currency,
      durationMonths: String(plan.durationMonths),
      productKeys: normalizePlanProductKeys(plan.productKeys),
      productLabels: plan.productLabels ?? {},
      includedItems: plan.includedItems ?? [],
      active: String(plan.active),
      sortOrder: String(plan.sortOrder),
    });
    setPlanModalOpen(true);
  }

  async function savePlan() {
    setError("");
    setSavingPlan(true);
    try {
      const payload = {
        name: planForm.name.trim(),
        description: planForm.description.trim() || null,
        originalPrice: planForm.originalPrice
          ? currencyToNumber(planForm.originalPrice)
          : null,
        price: currencyToNumber(planForm.price),
        currency: planForm.currency.trim().toUpperCase() || "BRL",
        durationMonths: Number(planForm.durationMonths),
        productKeys: normalizePlanProductKeys(planForm.productKeys),
        productLabels: planForm.productLabels,
        includedItems: planForm.includedItems
          .map((item) => item.trim())
          .filter(Boolean),
        active: planForm.active === "true",
        sortOrder: Number(planForm.sortOrder),
      };
      if (editingPlan) {
        await updateAdminBillingPlan(editingPlan.id, payload);
        setNotice("Plano atualizado com sucesso.");
      } else {
        await createAdminBillingPlan(payload);
        setNotice("Plano criado com sucesso.");
      }
      setPlanModalOpen(false);
      await load();
    } catch {
      setError("Não foi possível salvar o plano.");
    } finally {
      setSavingPlan(false);
    }
  }

  async function deactivatePlan(planId: string) {
    setSavingPlan(true);
    try {
      await deactivateAdminBillingPlan(planId);
      await load();
      setNotice("Plano desativado com sucesso.");
    } finally {
      setSavingPlan(false);
    }
  }

  function openNewCoupon() {
    setEditingCoupon(null);
    setCouponForm({
      code: "",
      description: "",
      discountType: "PERCENT",
      discountValue: "",
      active: "true",
      startsAt: "",
      expiresAt: "",
      usageLimit: "",
      billingPlanId: "",
    });
    setCouponModalOpen(true);
  }

  function openEditCoupon(coupon: BillingCoupon) {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      description: coupon.description ?? "",
      discountType: coupon.discountType,
      discountValue: couponDiscountFormValue(coupon),
      active: String(coupon.active),
      startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 10) : "",
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
      billingPlanId: coupon.billingPlanId ?? "",
    });
    setCouponModalOpen(true);
  }

  async function saveCoupon() {
    setError("");
    setSavingCoupon(true);
    try {
      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        description: couponForm.description.trim() || null,
        discountType: couponForm.discountType as "PERCENT" | "FIXED",
        discountValue: couponDiscountPayloadValue(
          couponForm.discountType,
          couponForm.discountValue,
        ),
        active: couponForm.active === "true",
        startsAt: couponForm.startsAt || null,
        expiresAt: couponForm.expiresAt || null,
        usageLimit: couponForm.usageLimit
          ? Number(couponForm.usageLimit)
          : null,
        billingPlanId: couponForm.billingPlanId || null,
      };
      if (editingCoupon) {
        await updateAdminBillingCoupon(editingCoupon.id, payload);
        setNotice("Cupom atualizado com sucesso.");
      } else {
        await createAdminBillingCoupon(payload);
        setNotice("Cupom criado com sucesso.");
      }
      setCouponModalOpen(false);
      setCoupons(await listAdminBillingCoupons());
    } catch {
      setError("Não foi possível salvar o cupom.");
    } finally {
      setSavingCoupon(false);
    }
  }

  async function deactivateCoupon(couponId: string) {
    setSavingCoupon(true);
    try {
      await deactivateAdminBillingCoupon(couponId);
      setCoupons(await listAdminBillingCoupons());
      setNotice("Cupom desativado com sucesso.");
    } finally {
      setSavingCoupon(false);
    }
  }

  function openEditReferralCoupon(coupon: ReferralCoupon) {
    setEditingReferralCoupon(coupon);
    setReferralCouponForm({
      code: coupon.code,
      active: String(coupon.active),
      discountType: coupon.discountType,
      discountValue: coupon.discountType === "FIXED" ? formatMoney(coupon.discountValue) : String(coupon.discountValue),
      commissionType: coupon.commissionType,
      commissionValue: coupon.commissionType === "FIXED" ? formatMoney(coupon.commissionValue) : String(coupon.commissionValue),
      planCommissions: (coupon.planCommissions ?? {}) as Record<string, { type: "PERCENT" | "FIXED"; value: number }>,
    });
  }

  async function saveReferralCoupon() {
    if (!editingReferralCoupon) return;
    setSavingReferralCoupon(true);
    setError("");
    try {
      await updateAdminReferralCoupon(editingReferralCoupon.id, {
        code: referralCouponForm.code.trim().toUpperCase(),
        active: referralCouponForm.active === "true",
        discountType: referralCouponForm.discountType as "PERCENT" | "FIXED",
        discountValue: referralCouponForm.discountType === "FIXED"
          ? currencyToNumber(referralCouponForm.discountValue)
          : Number(referralCouponForm.discountValue.replace(",", ".")),
        commissionType: referralCouponForm.commissionType as "PERCENT" | "FIXED",
        commissionValue: referralCouponForm.commissionType === "FIXED"
          ? currencyToNumber(referralCouponForm.commissionValue)
          : Number(referralCouponForm.commissionValue.replace(",", ".")),
        planCommissions: referralCouponForm.planCommissions,
      });
      setEditingReferralCoupon(null);
      setReferralCoupons(await listAdminReferralCoupons());
      setNotice("Cupom de indicação atualizado com sucesso.");
    } catch (error: any) {
      setError(error.response?.data?.message ?? "Não foi possível atualizar o cupom de indicação.");
    } finally {
      setSavingReferralCoupon(false);
    }
  }

  async function changeReferralCommissionStatus(commission: ReferralCommission, status: ReferralCommission["status"]) {
    setError("");
    try {
      await updateAdminReferralCommission(commission.id, { status, notes: commission.notes ?? null });
      setReferralCommissions(await listAdminReferralCommissions());
      setNotice("Comissão atualizada com sucesso.");
    } catch {
      setError("Não foi possível atualizar a comissão.");
    }
  }

  async function confirmWithdrawalAction() {
    if (!withdrawalAction) return;
    setSavingWithdrawal(true);
    setError("");
    try {
      await updateAdminReferralWithdrawal(withdrawalAction.withdrawal.id, {
        status: withdrawalAction.status,
        adminNotes: withdrawalAction.status === "PAID" ? "Pagamento PIX confirmado pelo administrador." : "Solicitação cancelada pelo administrador.",
      });
      setReferralWithdrawals(await listAdminReferralWithdrawals());
      setWithdrawalAction(null);
      setNotice(withdrawalAction.status === "PAID" ? "Pagamento de comissão marcado como pago." : "Solicitação de saque cancelada.");
    } catch {
      setError("Não foi possível atualizar a solicitação de saque.");
    } finally {
      setSavingWithdrawal(false);
    }
  }

  function openNewBanner() {
    setEditingBanner(null);
    setBannerError("");
    setError("");
    setBannerForm({
      variant: "REFERRAL",
      title: "",
      subtitle: "",
      imageUrl: "",
      ctaLabel: "Ver meu cupom",
      ctaPath: "/app/profile",
      location: "DASHBOARD",
      active: "true",
      sortOrder: String((marketingBanners.length + 1) * 10),
    });
    setBannerModalOpen(true);
  }

  function openEditBanner(banner: MarketingBanner) {
    setEditingBanner(banner);
    setBannerError("");
    setError("");
    setBannerForm({
      variant: banner.variant ?? "REFERRAL",
      title: banner.title,
      subtitle: banner.subtitle,
      imageUrl: banner.imageUrl ?? "",
      ctaLabel: banner.ctaLabel ?? "",
      ctaPath: banner.ctaPath ?? "",
      location: banner.location,
      active: String(banner.active),
      sortOrder: String(banner.sortOrder),
    });
    setBannerModalOpen(true);
  }

  async function saveBanner() {
    setSavingBanner(true);
    setBannerError("");
    try {
      if (bannerForm.variant === "PHOTO" && !bannerForm.imageUrl.trim()) {
        setBannerError("Envie uma imagem para o banner do tipo foto.");
        return;
      }
      const payload = {
        variant: bannerForm.variant,
        title: bannerForm.title.trim(),
        subtitle: bannerForm.subtitle.trim(),
        imageUrl: bannerForm.imageUrl.trim() || null,
        ctaLabel: bannerForm.ctaLabel.trim() || null,
        ctaPath: bannerForm.ctaPath.trim() || null,
        location: "DASHBOARD",
        active: bannerForm.active === "true",
        sortOrder: Number(bannerForm.sortOrder),
      };
      if (editingBanner) {
        await updateAdminMarketingBanner(editingBanner.id, payload);
        setNotice("Banner atualizado com sucesso.");
      } else {
        await createAdminMarketingBanner(payload);
        setNotice("Banner criado com sucesso.");
      }
      setBannerModalOpen(false);
      setMarketingBanners(await listAdminMarketingBanners());
    } catch {
      setBannerError("Não foi possível salvar o banner.");
    } finally {
      setSavingBanner(false);
    }
  }

  async function updateBannerImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBannerError("");
    if (!file.type.startsWith("image/")) {
      setBannerError("Selecione um arquivo de imagem válido.");
      return;
    }
    try {
      const image = await loadImageFromFile(file);
      const ratio = image.naturalWidth / image.naturalHeight;
      if (
        image.naturalWidth < bannerImageRules.minWidth ||
        image.naturalHeight < bannerImageRules.minHeight ||
        ratio < bannerImageRules.minRatio ||
        ratio > bannerImageRules.maxRatio
      ) {
        setBannerError(
          `Imagem fora do formato de banner. Use uma imagem horizontal entre ${bannerImageRules.minRatio.toFixed(1)}:1 e ${bannerImageRules.maxRatio.toFixed(1)}:1, com pelo menos ${bannerImageRules.minWidth}x${bannerImageRules.minHeight}px. O recomendado é ${bannerImageRules.width}x${bannerImageRules.height}px.`,
        );
        return;
      }
      const imageUrl = cropBannerImage(image);
      if (imageUrl.length > 1_500_000) {
        setBannerError("A imagem ficou grande demais após otimização. Tente uma imagem mais leve.");
        return;
      }
      setBannerForm((current) => ({ ...current, variant: "PHOTO", imageUrl }));
      setNotice(`Imagem validada e ajustada para ${bannerImageRules.width}x${bannerImageRules.height}px.`);
    } catch {
      setBannerError("Não foi possível ler a imagem selecionada.");
    }
  }

  async function deleteBanner(bannerId: string) {
    setSavingBanner(true);
    setError("");
    try {
      await deleteAdminMarketingBanner(bannerId);
      setMarketingBanners(await listAdminMarketingBanners());
      setNotice("Banner excluído com sucesso.");
    } catch {
      setError("Não foi possível excluir o banner.");
    } finally {
      setSavingBanner(false);
    }
  }

  async function dropPlan(targetPlanId: string) {
    if (!draggingPlanId || draggingPlanId === targetPlanId) return;
    const fromIndex = plans.findIndex((plan) => plan.id === draggingPlanId);
    const toIndex = plans.findIndex((plan) => plan.id === targetPlanId);
    if (fromIndex < 0 || toIndex < 0) return;
    const nextPlans = [...plans];
    const [dragged] = nextPlans.splice(fromIndex, 1);
    nextPlans.splice(toIndex, 0, dragged);
    setPlans(nextPlans);
    setDraggingPlanId(null);
    try {
      setPlans(
        await reorderAdminBillingPlans(nextPlans.map((plan) => plan.id)),
      );
      setNotice("Ordem dos planos salva com sucesso.");
    } catch {
      setError("Não foi possível salvar a ordem dos planos.");
      setPlans(await listAdminBillingPlans());
    }
  }

  function handleUsersPageChange(_event: unknown, nextPage: number) {
    loadUsers(nextPage + 1, usersPagination.pageSize);
  }

  function handleUsersPageSizeChange(event: ChangeEvent<HTMLInputElement>) {
    loadUsers(1, Number(event.target.value));
  }

  function applyUserFilters() {
    loadUsers(1, usersPagination.pageSize);
  }

  function clearUserFilters() {
    const nextFilters = {
      search: "",
      subscriptionStatus: "",
      role: "",
      billingPlanId: "",
    };
    setUserFilters(nextFilters);
    loadUsers(1, usersPagination.pageSize, nextFilters);
  }

  function openAnonymizeUser(user: AdminSubscriptionUser) {
    setAnonymizeUser(user);
    setAnonymizeEmail("");
    setAnonymizeNote("");
  }

  async function confirmAnonymizeUser() {
    if (!anonymizeUser) return;
    setError("");
    setAnonymizing(true);
    try {
      await anonymizeAdminSubscriptionUser(anonymizeUser.id, {
        confirmationEmail: anonymizeEmail.trim(),
        note: anonymizeNote.trim() || undefined,
      });
      setAnonymizeUser(null);
      await Promise.all([
        loadUsers(),
        getAdminBillingOverview().then(setOverview),
      ]);
      setNotice("Usuário anonimizado com sucesso.");
    } catch (error: any) {
      setError(
        error.response?.data?.message ??
          "Não foi possível anonimizar o usuário.",
      );
    } finally {
      setAnonymizing(false);
    }
  }

  async function confirmManualAccess() {
    if (!manualAccessUser) return;
    const userId = manualAccessUser.id;
    const success = await grantManualAccess(userId);
    if (success) {
      setManualAccessUser(null);
    }
  }

  async function confirmBlockUser() {
    if (!blockUser) return;
    const userId = blockUser.id;
    const success = await setStatus(userId, "BLOCKED");
    if (success) {
      setBlockUser(null);
    }
  }

  async function dropBanner(targetBannerId: string) {
    if (!draggingBannerId || draggingBannerId === targetBannerId) return;
    const fromIndex = marketingBanners.findIndex((banner) => banner.id === draggingBannerId);
    const toIndex = marketingBanners.findIndex((banner) => banner.id === targetBannerId);
    if (fromIndex < 0 || toIndex < 0) return;
    const nextBanners = [...marketingBanners];
    const [dragged] = nextBanners.splice(fromIndex, 1);
    nextBanners.splice(toIndex, 0, dragged);
    setMarketingBanners(nextBanners);
    setDraggingBannerId(null);
    try {
      setMarketingBanners(
        await reorderAdminMarketingBanners(nextBanners.map((banner) => banner.id)),
      );
      setNotice("Ordem dos banners salva com sucesso.");
    } catch {
      setError("Não foi possível salvar a ordem dos banners.");
      setMarketingBanners(await listAdminMarketingBanners());
    }
  }

  return (
    <Stack spacing={3}>
      <Paper
        className="glass-card"
        sx={{ p: { xs: 3, md: 4 }, borderRadius: 5 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
          <AdminPanelSettingsIcon color="primary" />
          <Typography color="primary" fontWeight={900}>
            Admin
          </Typography>
        </Stack>
        <Typography variant="h3" fontWeight={950} letterSpacing={0}>
          Assinaturas e acessos
        </Typography>
        <Typography color="text.secondary" fontSize={17}>
          Controle testes gratuitos, liberações manuais, bloqueios e status de
          pagamento.
        </Typography>
      </Paper>

      {error ? (
        <Paper
          sx={{
            p: 2,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "error.main",
          }}
        >
          <Typography color="error">{error}</Typography>
        </Paper>
      ) : null}

      <Grid container spacing={2}>
        {[
          [
            "Faturamento recebido estimado",
            overview ? formatMoney(overview.realizedRevenueEstimate) : "-",
          ],
          [
            `Faturamento ${currentMonthName()}`,
            overview ? formatMoney(overview.currentMonthRevenue) : "-",
          ],
          [
            "Receita mensal recorrente",
            overview
              ? formatMoney(overview.currentMonthlyRecurringRevenue)
              : "-",
          ],
          [
            "Novos planos no mês",
            overview
              ? `${overview.currentMonthNewPaidPlans} · +${formatMoney(overview.currentMonthMonthlyRevenueIncrease)}/mês`
              : "-",
          ],
          [
            "Chance em testes gratuitos",
            overview ? formatMoney(overview.projectedTrialRevenue) : "-",
          ],
          [
            "Usuários pagantes ativos",
            overview ? String(overview.activePaidUsers) : "-",
          ],
          ["Em teste grátis", overview ? String(overview.trialUsers) : "-"],
          ["Bloqueados", overview ? String(overview.blockedUsers) : "-"],
        ].map(([label, value]) => (
          <Grid item xs={12} sm={6} md={4} key={label}>
            <Paper
              className="soft-card"
              sx={{ p: 2.5, borderRadius: 4, height: "100%" }}
            >
              <Typography color="text.secondary" fontWeight={800}>
                {label}
              </Typography>
              <Typography variant="h5" fontWeight={950}>
                {value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper className="soft-card" sx={{ px: 2, borderRadius: 3 }}>
        <Tabs value={adminTab} onChange={(_, value) => setAdminTab(value)}>
          <Tab value="PLANS" label="Planos" />
          <Tab value="COUPONS" label="Cupons" />
          <Tab value="REFERRALS" label="Indicações" />
          <Tab value="BANNERS" label="Banners de marketing" />
          <Tab value="USERS" label="Usuários" />
          <Tab value="SETTINGS" label="Configurações" />
        </Tabs>
      </Paper>

      {adminTab === "PLANS" ? (
        <>
          <Paper className="soft-card" sx={{ p: 2.5, borderRadius: 4 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Box flex={1}>
                <Typography fontWeight={950}>
                  Configuração do teste grátis
                </Typography>
                <Typography color="text.secondary">
                  Esse padrão será usado para novos cadastros e para a oferta
                  exibida no sistema.
                </Typography>
              </Box>
              <TextField
                type="number"
                label="Dias padrão"
                value={defaultTrialDays}
                onChange={(event) => setDefaultTrialDays(event.target.value)}
                inputProps={{ min: 0 }}
                sx={{ width: { xs: "100%", sm: 160 } }}
              />
              <LoadingActionButton
                variant="contained"
                onClick={saveSettings}
                loading={savingSettings}
                loadingLabel="Salvando..."
              >
                Salvar padrão
              </LoadingActionButton>
            </Stack>
          </Paper>

          <Paper
            className="soft-card"
            sx={{ borderRadius: 4, overflow: "hidden" }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              sx={{ p: 2.5 }}
            >
              <Box>
                <Typography variant="h5" fontWeight={950}>
                  Planos
                </Typography>
                <Typography color="text.secondary">
                  Alterações valem para novas contratações e renovações futuras;
                  usuários ativos mantêm o valor contratado no snapshot.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openNewPlan}
              >
                Novo plano
              </Button>
            </Stack>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={48}></TableCell>
                  <TableCell>Plano</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Duração</TableCell>
                  <TableCell>Itens inclusos</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow
                    key={plan.id}
                    draggable
                    onDragStart={() => setDraggingPlanId(plan.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => dropPlan(plan.id)}
                    onDragEnd={() => setDraggingPlanId(null)}
                    sx={{
                      cursor: "grab",
                      opacity: draggingPlanId === plan.id ? 0.55 : 1,
                      "&:active": { cursor: "grabbing" },
                    }}
                  >
                    <TableCell>
                      <DragIndicatorIcon color="disabled" />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={900}>{plan.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {plan.description || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {plan.originalPrice && plan.originalPrice > plan.price ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            textDecoration: "line-through",
                            display: "block",
                          }}
                        >
                          {formatMoney(plan.originalPrice)}
                        </Typography>
                      ) : null}
                      <Typography fontWeight={900}>
                        {formatMoney(plan.price)}
                      </Typography>
                    </TableCell>
                    <TableCell>{plan.durationMonths} mês(es)</TableCell>
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        {[
                          ...normalizePlanProductKeys(plan.productKeys).map(
                            (key) => productPlanLabel(key, plan.productLabels),
                          ),
                          ...(plan.includedItems ?? []),
                        ]
                          .slice(0, 3)
                          .map((label) => (
                            <Chip
                              key={label}
                              size="small"
                              label={label}
                              variant="outlined"
                              sx={{ fontWeight: 800 }}
                            />
                          ))}
                        {[
                          ...normalizePlanProductKeys(plan.productKeys),
                          ...(plan.includedItems ?? []),
                        ].length > 3 ? (
                          <Chip
                            size="small"
                            label={`+${[...normalizePlanProductKeys(plan.productKeys), ...(plan.includedItems ?? [])].length - 3}`}
                            variant="outlined"
                            sx={{ fontWeight: 800 }}
                          />
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={plan.active ? "Ativo" : "Inativo"}
                        color={plan.active ? "success" : "default"}
                        variant="outlined"
                        sx={{ fontWeight: 900 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => openEditPlan(plan)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        disabled={!plan.active || savingPlan}
                        onClick={() => deactivatePlan(plan.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      ) : null}

      {adminTab === "COUPONS" ? (
        <Paper
          className="soft-card"
          sx={{ borderRadius: 4, overflow: "hidden" }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={2}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ p: 2.5 }}
          >
            <Box>
              <Typography variant="h5" fontWeight={950}>
                Cupons de desconto
              </Typography>
              <Typography color="text.secondary">
                Crie cupons percentuais ou de valor fixo para todos os planos ou
                para um plano específico.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openNewCoupon}
            >
              Novo cupom
            </Button>
          </Stack>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cupom</TableCell>
                <TableCell>Desconto</TableCell>
                <TableCell>Plano</TableCell>
                <TableCell>Uso</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {coupons.map((coupon) => {
                const linkedPlan = plans.find(
                  (plan) => plan.id === coupon.billingPlanId,
                );
                return (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <Typography fontWeight={900}>{coupon.code}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {coupon.description || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {coupon.discountType === "PERCENT"
                        ? `${coupon.discountValue}%`
                        : formatMoney(coupon.discountValue)}
                    </TableCell>
                    <TableCell>
                      {linkedPlan?.name ?? "Todos os planos"}
                    </TableCell>
                    <TableCell>
                      {coupon.usedCount}
                      {coupon.usageLimit ? `/${coupon.usageLimit}` : ""}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={coupon.active ? "Ativo" : "Inativo"}
                        color={coupon.active ? "success" : "default"}
                        variant="outlined"
                        sx={{ fontWeight: 900 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => openEditCoupon(coupon)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        disabled={!coupon.active || savingCoupon}
                        onClick={() => deactivateCoupon(coupon.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {!coupons.length ? (
            <Box p={3}>
              <Typography color="text.secondary">
                Nenhum cupom cadastrado.
              </Typography>
            </Box>
          ) : null}
        </Paper>
      ) : null}

      {adminTab === "REFERRALS" ? (
        <Stack spacing={2}>
          <Paper className="soft-card" sx={{ borderRadius: 4, overflow: "hidden" }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ p: 2.5 }}>
              <Box>
                <Typography variant="h5" fontWeight={950}>
                  Cupons de indicação
                </Typography>
                <Typography color="text.secondary">
                  Cada usuário tem um cupom próprio. Ajuste desconto, comissão geral e comissões especiais quando necessário.
                </Typography>
              </Box>
            </Stack>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuário</TableCell>
                  <TableCell>Cupom</TableCell>
                  <TableCell>Desconto</TableCell>
                  <TableCell>Comissão</TableCell>
                  <TableCell>Indicações</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {referralCoupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <Typography fontWeight={900}>{coupon.user?.name ?? "-"}</Typography>
                      <Typography variant="caption" color="text.secondary">{coupon.user?.email ?? "-"}</Typography>
                    </TableCell>
                    <TableCell><Typography fontWeight={900}>{coupon.code}</Typography></TableCell>
                    <TableCell>{coupon.discountType === "PERCENT" ? `${coupon.discountValue}%` : formatMoney(coupon.discountValue)}</TableCell>
                    <TableCell>{coupon.commissionType === "PERCENT" ? `${coupon.commissionValue}%` : formatMoney(coupon.commissionValue)}</TableCell>
                    <TableCell>{coupon._count?.commissions ?? 0}</TableCell>
                    <TableCell>
                      <Chip size="small" label={coupon.active ? "Ativo" : "Inativo"} color={coupon.active ? "success" : "default"} variant="outlined" sx={{ fontWeight: 900 }} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => openEditReferralCoupon(coupon)}>
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!referralCoupons.length ? (
              <Box p={3}><Typography color="text.secondary">Nenhum cupom de indicação gerado ainda.</Typography></Box>
            ) : null}
          </Paper>

          <Paper className="soft-card" sx={{ borderRadius: 4, overflow: "hidden" }}>
            <Box sx={{ p: 2.5 }}>
              <Typography variant="h5" fontWeight={950}>Saques PIX de comissão</Typography>
              <Typography color="text.secondary">Confira os dados PIX, faça o pagamento manual e marque como pago somente após confirmar o envio.</Typography>
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuário</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>PIX</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Solicitado em</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {referralWithdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      <Typography fontWeight={900}>{withdrawal.user?.name ?? "-"}</Typography>
                      <Typography variant="caption" color="text.secondary">{withdrawal.user?.email ?? "-"}</Typography>
                    </TableCell>
                    <TableCell>{formatMoney(withdrawal.amount)}</TableCell>
                    <TableCell>
                      <Typography fontWeight={900}>{withdrawal.pixHolderName}</Typography>
                      <Typography variant="caption" color="text.secondary">{withdrawal.pixKeyType} · {withdrawal.pixKey}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={withdrawal.status === "REQUESTED" ? "Solicitado" : withdrawal.status === "PAID" ? "Pago" : "Cancelado"}
                        color={withdrawal.status === "PAID" ? "success" : withdrawal.status === "CANCELED" ? "default" : "warning"}
                        variant="outlined"
                        sx={{ fontWeight: 900 }}
                      />
                    </TableCell>
                    <TableCell>{formatDate(withdrawal.requestedAt)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" disabled={withdrawal.status !== "REQUESTED"} onClick={() => setWithdrawalAction({ withdrawal, status: "PAID" })}>
                        Marcar pago
                      </Button>
                      <Button size="small" color="error" disabled={withdrawal.status !== "REQUESTED"} onClick={() => setWithdrawalAction({ withdrawal, status: "CANCELED" })}>
                        Cancelar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!referralWithdrawals.length ? (
              <Box p={3}><Typography color="text.secondary">Nenhuma solicitação de saque PIX ainda.</Typography></Box>
            ) : null}
          </Paper>

          <Paper className="soft-card" sx={{ borderRadius: 4, overflow: "hidden" }}>
            <Box sx={{ p: 2.5 }}>
              <Typography variant="h5" fontWeight={950}>Comissões</Typography>
              <Typography color="text.secondary">Acompanhe valores gerados por indicações e atualize o status de pagamento.</Typography>
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Indicador</TableCell>
                  <TableCell>Indicado</TableCell>
                  <TableCell>Cupom</TableCell>
                  <TableCell>Plano</TableCell>
                  <TableCell>Base</TableCell>
                  <TableCell>Comissão</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {referralCommissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <Typography fontWeight={900}>{commission.referrerUser?.name ?? "-"}</Typography>
                      <Typography variant="caption" color="text.secondary">{commission.referrerUser?.email ?? "-"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={900}>{commission.referredUser?.name ?? "-"}</Typography>
                      <Typography variant="caption" color="text.secondary">{commission.referredUser?.email ?? "-"}</Typography>
                    </TableCell>
                    <TableCell>{commission.referralCoupon?.code ?? "-"}</TableCell>
                    <TableCell>{commission.billingPlan?.name ?? "-"}</TableCell>
                    <TableCell>{formatMoney(commission.baseAmount)}</TableCell>
                    <TableCell>{formatMoney(commission.amount)}</TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={commission.status}
                        onChange={(event) => changeReferralCommissionStatus(commission, event.target.value as ReferralCommission["status"])}
                        sx={{ minWidth: 140 }}
                      >
                        <MenuItem value="PENDING">Pendente</MenuItem>
                        <MenuItem value="APPROVED">Aprovada</MenuItem>
                        <MenuItem value="PAID">Paga</MenuItem>
                        <MenuItem value="CANCELED">Cancelada</MenuItem>
                      </TextField>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!referralCommissions.length ? (
              <Box p={3}><Typography color="text.secondary">Nenhuma comissão gerada ainda.</Typography></Box>
            ) : null}
          </Paper>
        </Stack>
      ) : null}

      {adminTab === "BANNERS" ? (
        <Paper className="soft-card" sx={{ borderRadius: 4, overflow: "hidden" }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ p: 2.5 }}>
            <Box>
              <Typography variant="h5" fontWeight={950}>Banners de marketing</Typography>
              <Typography color="text.secondary">Configure banners da dashboard. Outros locais serão liberados quando o sistema tiver novas áreas de banner.</Typography>
            </Box>
            <Button variant="contained" startIcon={<CampaignIcon />} onClick={openNewBanner}>Novo banner</Button>
          </Stack>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={48}></TableCell>
                <TableCell>Banner</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Local</TableCell>
                <TableCell>CTA</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {marketingBanners.map((banner) => (
                <TableRow
                  key={banner.id}
                  draggable
                  onDragStart={() => setDraggingBannerId(banner.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => dropBanner(banner.id)}
                  onDragEnd={() => setDraggingBannerId(null)}
                  sx={{
                    cursor: "grab",
                    opacity: draggingBannerId === banner.id ? 0.55 : 1,
                    "&:active": { cursor: "grabbing" },
                  }}
                >
                  <TableCell>
                    <DragIndicatorIcon color="disabled" />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {banner.imageUrl ? (
                        <Box
                          component="img"
                          src={banner.imageUrl}
                          alt=""
                          sx={{ width: 56, height: 40, objectFit: "cover", borderRadius: 1.5, border: "1px solid", borderColor: "divider" }}
                        />
                      ) : null}
                      <Box>
                        <Typography fontWeight={900}>{banner.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{banner.subtitle}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>{(banner.variant ?? "REFERRAL") === "PHOTO" ? "Foto" : "Modelo pronto"}</TableCell>
                  <TableCell>{banner.location === "DASHBOARD" ? "Dashboard" : banner.location}</TableCell>
                  <TableCell>{banner.ctaLabel || "-"}{banner.ctaPath ? ` · ${banner.ctaPath}` : ""}</TableCell>
                  <TableCell>
                    <Chip size="small" label={banner.active ? "Ativo" : "Inativo"} color={banner.active ? "success" : "default"} variant="outlined" sx={{ fontWeight: 900 }} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => openEditBanner(banner)}><EditIcon /></IconButton>
                    <IconButton color="error" disabled={savingBanner} onClick={() => deleteBanner(banner.id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!marketingBanners.length ? (
            <Box p={3}><Typography color="text.secondary">Nenhum banner cadastrado ainda.</Typography></Box>
          ) : null}
        </Paper>
      ) : null}

      {adminTab === "USERS" ? (
        <Paper
          className="soft-card"
          sx={{ borderRadius: 4, overflow: "hidden" }}
        >
          <Stack
            spacing={2}
            sx={{ p: 2.5, borderBottom: "1px solid", borderColor: "divider" }}
          >
            <Typography variant="h5" fontWeight={950}>
              Usuários
            </Typography>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <TextField
                label="Buscar nome ou e-mail"
                value={userFilters.search}
                onChange={(event) =>
                  setUserFilters((current) => ({
                    ...current,
                    search: event.target.value,
                  }))
                }
                size="small"
                sx={{ minWidth: { md: 260 } }}
              />
              <TextField
                select
                label="Status"
                value={userFilters.subscriptionStatus}
                onChange={(event) =>
                  setUserFilters((current) => ({
                    ...current,
                    subscriptionStatus: event.target.value,
                  }))
                }
                size="small"
                sx={{ minWidth: { md: 180 } }}
              >
                <MenuItem value="">Todos</MenuItem>
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {statusLabels[status]}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Perfil"
                value={userFilters.role}
                onChange={(event) =>
                  setUserFilters((current) => ({
                    ...current,
                    role: event.target.value,
                  }))
                }
                size="small"
                sx={{ minWidth: { md: 160 } }}
              >
                <MenuItem value="">Todos</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {roleLabels[role]}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Plano"
                value={userFilters.billingPlanId}
                onChange={(event) =>
                  setUserFilters((current) => ({
                    ...current,
                    billingPlanId: event.target.value,
                  }))
                }
                size="small"
                sx={{ minWidth: { md: 190 } }}
              >
                <MenuItem value="">Todos</MenuItem>
                {plans
                  .filter((plan) => plan.active)
                  .map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </MenuItem>
                  ))}
              </TextField>
              <Button variant="contained" onClick={applyUserFilters}>
                Filtrar
              </Button>
              <Button variant="outlined" onClick={clearUserFilters}>
                Limpar
              </Button>
            </Stack>
          </Stack>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Usuário</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Perfil</TableCell>
                <TableCell>Plano</TableCell>
                <TableCell>Fim do teste</TableCell>
                <TableCell>Acesso manual até</TableCell>
                <TableCell>Provedor</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => {
                const adminAccess = isAdminAccess(user);
                const lifetimeAccess = isLifetimeAccess(user);
                const activePaidPlan = hasActivePaidPlan(user);
                const showDaysField = canRenewTrial(user) || canGrantManualAccess(user);
                const daysCopy = daysFieldCopy(user);
                const disableAccessControls = savingId === user.id || adminAccess;
                const disableRoleControl = savingId === user.id || user.id === currentUser?.id;

                return (
                <TableRow key={user.id}>
                  <TableCell>
                    <Typography fontWeight={900}>{user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={1}>
                      <Chip
                        size="small"
                        label={
                          adminAccess
                            ? "Administrador vitalício"
                            : user.subscriptionPlan === "LIFETIME"
                            ? "Acesso vitalício"
                            : statusLabels[
                                user.subscriptionStatus ?? "TRIALING"
                              ]
                        }
                        color={user.access?.canAccess ? "success" : "error"}
                        variant="outlined"
                        sx={{ alignSelf: "flex-start", fontWeight: 900 }}
                      />
                      {adminAccess ? (
                        <Typography variant="caption" color="text.secondary">
                          Administradores têm acesso vitalício automático.
                        </Typography>
                      ) : (
                        <TextField
                          select
                          size="small"
                          value={userAccessOption(user)}
                          onChange={(event) =>
                            setAccessOption(
                              user,
                              event.target.value as AdminAccessOption,
                            )
                          }
                          disabled={disableAccessControls}
                          helperText="Use Acesso vitalício para não expirar"
                        >
                          {accessOptions.map((status) => (
                            <MenuItem key={status} value={status}>
                              {accessOptionLabels[status]}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={user.role ?? "USER"}
                      onChange={(event) =>
                        setRole(user.id, event.target.value as UserRole)
                      }
                      disabled={disableRoleControl}
                      sx={{ minWidth: 150 }}
                      helperText={user.id === currentUser?.id ? "Seu próprio perfil não pode ser alterado aqui" : undefined}
                    >
                      {roles.map((role) => (
                        <MenuItem key={role} value={role}>
                          {roleLabels[role]}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={800}>
                      {adminAccess
                        ? "Vitalício"
                        : user.planNameSnapshot ??
                        planLabels[user.subscriptionPlan ?? "FREE"]}
                    </Typography>
                    {!adminAccess && user.planPriceSnapshot ? (
                      <Typography variant="caption" color="text.secondary">
                        {formatMoney(user.planPriceSnapshot)}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {adminAccess || lifetimeAccess
                      ? "Não se aplica"
                      : trialEndLabel(user.trialEndsAt)}
                  </TableCell>
                  <TableCell>
                    {adminAccess || lifetimeAccess || activePaidPlan
                      ? "Não se aplica"
                      : expirationLabel(user.manualAccessUntil)}
                  </TableCell>
                  <TableCell>
                    {providerLabels[user.paymentProvider ?? "NONE"]}
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      {showDaysField ? (
                        <TextField
                          size="small"
                          label={daysCopy.label}
                          helperText={daysCopy.helperText}
                          value={daysByUser[user.id] ?? "14"}
                          onChange={(event) =>
                            setDaysByUser((current) => ({
                              ...current,
                              [user.id]: event.target.value,
                            }))
                          }
                          sx={{ width: 118 }}
                        />
                      ) : null}
                      {canRenewTrial(user) ? (
                        <LoadingActionButton
                          loading={savingId === user.id}
                          disabled={savingId === user.id}
                          onClick={() => grantTrial(user.id)}
                        >
                          Renovar teste
                        </LoadingActionButton>
                      ) : null}
                      {canGrantManualAccess(user) && !activePaidPlan ? (
                        <LoadingActionButton
                          loading={savingId === user.id}
                          disabled={savingId === user.id}
                          onClick={() => setManualAccessUser(user)}
                        >
                          Liberar por dias
                        </LoadingActionButton>
                      ) : null}
                      {!adminAccess && !lifetimeAccess ? (
                        <Button
                          color="error"
                          disabled={savingId === user.id}
                          onClick={() => setBlockUser(user)}
                        >
                          Bloquear
                        </Button>
                      ) : null}
                      {!adminAccess ? (
                        <IconButton
                          color="error"
                          disabled={
                            savingId === user.id || user.id === currentUser?.id
                          }
                          onClick={() => openAnonymizeUser(user)}
                        >
                          <PersonOffIcon />
                        </IconButton>
                      ) : null}
                    </Stack>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {!users.length ? (
            <Box p={3}>
              <Typography color="text.secondary">
                Nenhum usuário encontrado.
              </Typography>
            </Box>
          ) : null}
          <TablePagination
            component="div"
            count={usersPagination.total}
            page={Math.max(0, usersPagination.page - 1)}
            rowsPerPage={usersPagination.pageSize}
            onPageChange={handleUsersPageChange}
            onRowsPerPageChange={handleUsersPageSizeChange}
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="Usuários por página"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count}`
            }
          />
        </Paper>
      ) : null}

      {adminTab === "SETTINGS" ? (
        <Paper className="soft-card" sx={{ p: 2.5, borderRadius: 4 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h5" fontWeight={950}>
                Rodapé da área logada
              </Typography>
              <Typography color="text.secondary">
                Configure os contatos que aparecerão no rodapé para usuários logados.
              </Typography>
            </Box>
            <TextField
              label="E-mails de contato"
              value={contactEmails}
              onChange={(event) => setContactEmails(event.target.value)}
              helperText="Informe um e-mail por linha, vírgula ou ponto e vírgula. Máximo de 5."
              multiline
              minRows={2}
              fullWidth
            />
            <TextField
              label="Telefones de contato"
              value={contactPhones}
              onChange={(event) => setContactPhones(event.target.value)}
              helperText="Informe um telefone por linha, vírgula ou ponto e vírgula. Máximo de 5."
              multiline
              minRows={2}
              fullWidth
            />
            <TextField
              label="Mensagem curta"
              value={contactMessage}
              onChange={(event) => setContactMessage(event.target.value)}
              helperText="Opcional. Ex.: Atendimento em dias úteis, das 9h às 18h."
              inputProps={{ maxLength: 180 }}
              multiline
              minRows={2}
              fullWidth
            />
            <Box display="flex" justifyContent="flex-end">
              <LoadingActionButton
                variant="contained"
                onClick={saveSettings}
                loading={savingSettings}
                loadingLabel="Salvando..."
              >
                Salvar contatos
              </LoadingActionButton>
            </Box>
          </Stack>
        </Paper>
      ) : null}

      <AppDialog
        open={Boolean(withdrawalAction)}
        onClose={() => setWithdrawalAction(null)}
        title={withdrawalAction?.status === "PAID" ? "Confirmar pagamento PIX" : "Cancelar solicitação de saque"}
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setWithdrawalAction(null)}>Voltar</Button>
            <LoadingActionButton
              variant="contained"
              color={withdrawalAction?.status === "CANCELED" ? "error" : "primary"}
              onClick={confirmWithdrawalAction}
              loading={savingWithdrawal}
              loadingLabel="Salvando..."
            >
              {withdrawalAction?.status === "PAID" ? "Confirmar pagamento" : "Confirmar cancelamento"}
            </LoadingActionButton>
          </>
        }
      >
        {withdrawalAction ? (
          <Stack spacing={2}>
            <Alert severity={withdrawalAction.status === "PAID" ? "warning" : "info"} sx={{ borderRadius: 3 }}>
              {withdrawalAction.status === "PAID"
                ? "Marque como pago somente depois de conferir e realizar o PIX. Esta ação mantém o valor liquidado e evita pagamento duplicado."
                : "Ao cancelar, o valor reservado volta a ficar disponível para o usuário conforme a forma de recebimento configurada."}
            </Alert>
            <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "none", bgcolor: "action.hover" }}>
              <Typography fontWeight={900}>{withdrawalAction.withdrawal.user?.name}</Typography>
              <Typography color="text.secondary">{withdrawalAction.withdrawal.user?.email}</Typography>
              <Typography mt={1}>Valor: <strong>{formatMoney(withdrawalAction.withdrawal.amount)}</strong></Typography>
              <Typography>PIX: <strong>{withdrawalAction.withdrawal.pixKeyType} · {withdrawalAction.withdrawal.pixKey}</strong></Typography>
              <Typography>Titular: <strong>{withdrawalAction.withdrawal.pixHolderName}</strong></Typography>
            </Paper>
          </Stack>
        ) : null}
      </AppDialog>

      <AppDialog
        open={Boolean(editingReferralCoupon)}
        onClose={() => setEditingReferralCoupon(null)}
        title="Editar cupom de indicação"
        maxWidth="md"
        actions={
          <>
            <Button onClick={() => setEditingReferralCoupon(null)}>Cancelar</Button>
            <LoadingActionButton variant="contained" onClick={saveReferralCoupon} loading={savingReferralCoupon} loadingLabel="Salvando...">
              Salvar
            </LoadingActionButton>
          </>
        }
      >
        <Stack spacing={2}>
          {editingReferralCoupon ? (
            <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "none", bgcolor: "action.hover" }}>
              <Typography fontWeight={900}>{editingReferralCoupon.user?.name}</Typography>
              <Typography color="text.secondary">{editingReferralCoupon.user?.email}</Typography>
            </Paper>
          ) : null}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Nome do cupom"
              value={referralCouponForm.code}
              onChange={(event) => setReferralCouponForm((current) => ({ ...current, code: event.target.value.toUpperCase().slice(0, 24) }))}
              helperText="3 a 24 caracteres. Letras, números, hífen ou underline."
              fullWidth
            />
            <TextField
              select
              label="Status"
              value={referralCouponForm.active}
              onChange={(event) => setReferralCouponForm((current) => ({ ...current, active: event.target.value }))}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="true">Ativo</MenuItem>
              <MenuItem value="false">Inativo</MenuItem>
            </TextField>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              label="Tipo de desconto"
              value={referralCouponForm.discountType}
              onChange={(event) => setReferralCouponForm((current) => ({ ...current, discountType: event.target.value }))}
              fullWidth
            >
              <MenuItem value="PERCENT">Percentual</MenuItem>
              <MenuItem value="FIXED">Valor fixo</MenuItem>
            </TextField>
            {referralCouponForm.discountType === "FIXED" ? (
              <MoneyTextField
                label="Desconto"
                value={referralCouponForm.discountValue}
                onValueChange={(discountValue) => setReferralCouponForm((current) => ({ ...current, discountValue }))}
                fullWidth
              />
            ) : (
              <TextField
                label="Desconto (%)"
                value={referralCouponForm.discountValue}
                onChange={(event) => setReferralCouponForm((current) => ({ ...current, discountValue: event.target.value }))}
                fullWidth
              />
            )}
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              label="Tipo de comissão padrão"
              value={referralCouponForm.commissionType}
              onChange={(event) => setReferralCouponForm((current) => ({ ...current, commissionType: event.target.value }))}
              fullWidth
            >
              <MenuItem value="PERCENT">Percentual</MenuItem>
              <MenuItem value="FIXED">Valor fixo</MenuItem>
            </TextField>
            {referralCouponForm.commissionType === "FIXED" ? (
              <MoneyTextField
                label="Comissão padrão"
                value={referralCouponForm.commissionValue}
                onValueChange={(commissionValue) => setReferralCouponForm((current) => ({ ...current, commissionValue }))}
                fullWidth
              />
            ) : (
              <TextField
                label="Comissão padrão (%)"
                value={referralCouponForm.commissionValue}
                onChange={(event) => setReferralCouponForm((current) => ({ ...current, commissionValue: event.target.value }))}
                fullWidth
              />
            )}
          </Stack>
          <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "none", bgcolor: "action.hover" }}>
            <Typography fontWeight={900} mb={1}>Comissão diferente por plano</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Opcional. Se não preencher, vale a comissão padrão acima.
            </Typography>
            <Stack spacing={1.5}>
              {plans.map((plan) => {
                const override = referralCouponForm.planCommissions[plan.id];
                return (
                  <Stack key={plan.id} direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                    <Typography fontWeight={800} sx={{ minWidth: 180 }}>{plan.name}</Typography>
                    <TextField
                      select
                      size="small"
                      label="Tipo"
                      value={override?.type ?? ""}
                      onChange={(event) => setReferralCouponForm((current) => {
                        const next = { ...current.planCommissions };
                        if (!event.target.value) {
                          delete next[plan.id];
                        } else {
                          next[plan.id] = { type: event.target.value as "PERCENT" | "FIXED", value: next[plan.id]?.value ?? 0 };
                        }
                        return { ...current, planCommissions: next };
                      })}
                      sx={{ minWidth: 140 }}
                    >
                      <MenuItem value="">Padrão</MenuItem>
                      <MenuItem value="PERCENT">Percentual</MenuItem>
                      <MenuItem value="FIXED">Valor fixo</MenuItem>
                    </TextField>
                    <TextField
                      size="small"
                      label={override?.type === "FIXED" ? "Valor" : "Percentual"}
                      value={override?.value ?? ""}
                      disabled={!override}
                      onChange={(event) => setReferralCouponForm((current) => ({
                        ...current,
                        planCommissions: {
                          ...current.planCommissions,
                          [plan.id]: { type: override?.type ?? "PERCENT", value: looseNumber(event.target.value) }
                        }
                      }))}
                    />
                  </Stack>
                );
              })}
            </Stack>
          </Paper>
        </Stack>
      </AppDialog>

      <AppDialog
        open={bannerModalOpen}
        onClose={() => setBannerModalOpen(false)}
        title={editingBanner ? "Editar banner" : "Novo banner"}
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setBannerModalOpen(false)}>Cancelar</Button>
            <LoadingActionButton variant="contained" onClick={saveBanner} loading={savingBanner} loadingLabel="Salvando...">
              Salvar
            </LoadingActionButton>
          </>
        }
      >
        <Stack spacing={2}>
          {bannerError ? (
            <Alert severity="error" variant="outlined">
              {bannerError}
            </Alert>
          ) : null}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField select label="Tipo de banner" value={bannerForm.variant} onChange={(event) => setBannerForm((current) => ({ ...current, variant: event.target.value as "REFERRAL" | "PHOTO" }))} fullWidth>
              <MenuItem value="REFERRAL">Modelo pronto</MenuItem>
              <MenuItem value="PHOTO">Foto</MenuItem>
            </TextField>
            <TextField select label="Local" value={bannerForm.location} disabled helperText="Por enquanto os banners aparecem somente na dashboard." fullWidth>
              <MenuItem value="DASHBOARD">Dashboard</MenuItem>
            </TextField>
          </Stack>
          <TextField label="Título" value={bannerForm.title} onChange={(event) => setBannerForm((current) => ({ ...current, title: event.target.value }))} fullWidth />
          <TextField label="Texto" value={bannerForm.subtitle} onChange={(event) => setBannerForm((current) => ({ ...current, subtitle: event.target.value }))} multiline minRows={2} fullWidth />
          <TextField
            label="URL da imagem"
            value={bannerForm.imageUrl}
            onChange={(event) => setBannerForm((current) => ({ ...current, imageUrl: event.target.value }))}
            helperText={bannerForm.variant === "PHOTO" ? "Você pode fazer upload ou informar uma URL pública." : "Opcional. Se preenchida ou enviada, a imagem também será exibida no banner."}
            fullWidth
          />
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(45,212,191,0.08)" : "rgba(240,253,250,0.9)",
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block">
              Dimensões permitidas para banner: imagem horizontal com mínimo de {bannerImageRules.minWidth}x{bannerImageRules.minHeight}px e proporção entre {bannerImageRules.minRatio.toFixed(1)}:1 e {bannerImageRules.maxRatio.toFixed(1)}:1.
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Recomendado: {bannerImageRules.width}x{bannerImageRules.height}px. Ao enviar arquivo, o sistema ajusta automaticamente para esse tamanho.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
            <Button variant="outlined" component="label">
              Fazer upload da imagem
              <input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={updateBannerImage} />
            </Button>
            {bannerForm.imageUrl ? (
              <Button color="error" onClick={() => setBannerForm((current) => ({ ...current, imageUrl: "" }))}>
                Remover imagem
              </Button>
            ) : null}
            <Typography variant="caption" color="text.secondary">
              O sistema valida o formato e ajusta a imagem para banner.
            </Typography>
          </Stack>
          {bannerForm.imageUrl ? (
            <Box
              component="img"
              src={bannerForm.imageUrl}
              alt="Prévia do banner"
              sx={{
                width: "100%",
                aspectRatio: `${bannerImageRules.width} / ${bannerImageRules.height}`,
                objectFit: "cover",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            />
          ) : null}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="Texto do botão" value={bannerForm.ctaLabel} onChange={(event) => setBannerForm((current) => ({ ...current, ctaLabel: event.target.value }))} fullWidth />
            <TextField label="Link de ação do banner" value={bannerForm.ctaPath} onChange={(event) => setBannerForm((current) => ({ ...current, ctaPath: event.target.value }))} helperText="Opcional. Se preencher, clicar no banner leva para este caminho. Ex.: /app/profile" fullWidth />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="Ordem" value={bannerForm.sortOrder} onChange={(event) => setBannerForm((current) => ({ ...current, sortOrder: event.target.value }))} fullWidth />
            <TextField select label="Status" value={bannerForm.active} onChange={(event) => setBannerForm((current) => ({ ...current, active: event.target.value }))} fullWidth>
              <MenuItem value="true">Ativo</MenuItem>
              <MenuItem value="false">Inativo</MenuItem>
            </TextField>
          </Stack>
        </Stack>
      </AppDialog>

      <AppDialog
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title={editingPlan ? "Editar plano" : "Novo plano"}
        maxWidth="md"
        actions={
          <>
            <Button onClick={() => setPlanModalOpen(false)}>Cancelar</Button>
            <LoadingActionButton
              variant="contained"
              onClick={savePlan}
              loading={savingPlan}
              loadingLabel="Salvando..."
            >
              Salvar
            </LoadingActionButton>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField
            label="Nome"
            value={planForm.name}
            onChange={(event) =>
              setPlanForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            fullWidth
          />
          <TextField
            label="Descrição"
            value={planForm.description}
            onChange={(event) =>
              setPlanForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            fullWidth
            multiline
            minRows={2}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <MoneyTextField
              label="Valor cheio/antigo"
              value={planForm.originalPrice}
              onValueChange={(originalPrice) =>
                setPlanForm((current) => ({
                  ...current,
                  originalPrice,
                }))
              }
              helperText="Opcional. Aparece riscado quando for maior que o valor real."
              fullWidth
            />
            <MoneyTextField
              label="Valor real do plano"
              value={planForm.price}
              onValueChange={(price) =>
                setPlanForm((current) => ({
                  ...current,
                  price,
                }))
              }
              fullWidth
            />
            <TextField
              label="Moeda"
              value={planForm.currency}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  currency: event.target.value,
                }))
              }
              sx={{ width: { xs: "100%", sm: 180 } }}
            />
          </Stack>
          <Paper
            sx={{
              p: 2,
              borderRadius: 3,
              boxShadow: "none",
              bgcolor: "action.hover",
            }}
          >
            <Stack spacing={1.25}>
              <Box>
                <Typography fontWeight={900}>
                  Itens inclusos no plano
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Os itens de menu controlam o acesso. Os itens extras aparecem
                  apenas na oferta do plano.
                </Typography>
              </Box>
              <Grid container spacing={1}>
                {planProducts.map((product) => {
                  const Icon = product.icon;
                  const checked = planForm.productKeys.includes(product.key);
                  return (
                    <Grid item xs={12} sm={6} key={product.key}>
                      <Stack spacing={1}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={checked}
                              onChange={(event) =>
                                setPlanForm((current) => {
                                  const currentKeys = new Set(
                                    current.productKeys,
                                  );
                                  const productLabels = {
                                    ...current.productLabels,
                                  };
                                  if (event.target.checked)
                                    currentKeys.add(product.key);
                                  else {
                                    currentKeys.delete(product.key);
                                    delete productLabels[product.key];
                                  }
                                  return {
                                    ...current,
                                    productKeys: normalizePlanProductKeys(
                                      Array.from(currentKeys),
                                    ),
                                    productLabels,
                                  };
                                })
                              }
                            />
                          }
                          label={
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Icon fontSize="small" />
                              <Typography fontWeight={800}>
                                {product.label}
                              </Typography>
                            </Stack>
                          }
                        />
                        {checked ? (
                          <TextField
                            size="small"
                            label="Nome exibido no plano"
                            placeholder={product.label}
                            value={planForm.productLabels[product.key] ?? ""}
                            onChange={(event) =>
                              setPlanForm((current) => ({
                                ...current,
                                productLabels: {
                                  ...current.productLabels,
                                  [product.key]: event.target.value,
                                },
                              }))
                            }
                            helperText="Opcional. Não altera o nome no menu."
                            fullWidth
                          />
                        ) : null}
                      </Stack>
                    </Grid>
                  );
                })}
              </Grid>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  size="small"
                  onClick={() =>
                    setPlanForm((current) => ({
                      ...current,
                      productKeys: normalizePlanProductKeys(),
                    }))
                  }
                >
                  Marcar todos
                </Button>
                <Button
                  size="small"
                  onClick={() =>
                    setPlanForm((current) => ({
                      ...current,
                      productKeys: [],
                      productLabels: {},
                    }))
                  }
                >
                  Limpar
                </Button>
              </Stack>
              <Box>
                <Typography fontWeight={900} mt={1}>
                  Itens extras inclusos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use para promessas comerciais ou detalhes que não são itens do
                  menu.
                </Typography>
              </Box>
              <Stack spacing={1}>
                {planForm.includedItems.map((item, index) => (
                  <Stack
                    key={index}
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    <TextField
                      size="small"
                      label={`Item extra ${index + 1}`}
                      value={item}
                      onChange={(event) =>
                        setPlanForm((current) => ({
                          ...current,
                          includedItems: current.includedItems.map(
                            (currentItem, itemIndex) =>
                              itemIndex === index
                                ? event.target.value
                                : currentItem,
                          ),
                        }))
                      }
                      fullWidth
                    />
                    <IconButton
                      color="error"
                      onClick={() =>
                        setPlanForm((current) => ({
                          ...current,
                          includedItems: current.includedItems.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        }))
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  disabled={planForm.includedItems.length >= 30}
                  onClick={() =>
                    setPlanForm((current) => ({
                      ...current,
                      includedItems: [...current.includedItems, ""],
                    }))
                  }
                  sx={{ alignSelf: "flex-start" }}
                >
                  Adicionar item extra
                </Button>
              </Stack>
            </Stack>
          </Paper>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              type="number"
              label="Duração em meses"
              value={planForm.durationMonths}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  durationMonths: event.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              type="number"
              label="Ordem"
              value={planForm.sortOrder}
              onChange={(event) =>
                setPlanForm((current) => ({
                  ...current,
                  sortOrder: event.target.value,
                }))
              }
              fullWidth
            />
          </Stack>
          <TextField
            select
            label="Status"
            value={planForm.active}
            onChange={(event) =>
              setPlanForm((current) => ({
                ...current,
                active: event.target.value,
              }))
            }
            fullWidth
          >
            <MenuItem value="true">Ativo</MenuItem>
            <MenuItem value="false">Inativo</MenuItem>
          </TextField>
        </Stack>
      </AppDialog>

      <AppDialog
        open={couponModalOpen}
        onClose={() => setCouponModalOpen(false)}
        title={editingCoupon ? "Editar cupom" : "Novo cupom"}
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setCouponModalOpen(false)}>Cancelar</Button>
            <LoadingActionButton
              variant="contained"
              onClick={saveCoupon}
              loading={savingCoupon}
              loadingLabel="Salvando..."
            >
              Salvar
            </LoadingActionButton>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField
            label="Código"
            value={couponForm.code}
            onChange={(event) =>
              setCouponForm((current) => ({
                ...current,
                code: event.target.value.toUpperCase(),
              }))
            }
            fullWidth
          />
          <TextField
            label="Descrição"
            value={couponForm.description}
            onChange={(event) =>
              setCouponForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            fullWidth
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              label="Tipo de desconto"
              value={couponForm.discountType}
              onChange={(event) => {
                const nextType = event.target.value;
                setCouponForm((current) => ({
                  ...current,
                  discountType: nextType,
                  discountValue:
                    nextType === "FIXED"
                      ? current.discountValue
                        ? formatMoney(looseNumber(current.discountValue))
                        : ""
                      : String(
                          currencyToNumber(current.discountValue) ||
                            current.discountValue,
                        ).replace(".", ","),
                }));
              }}
              fullWidth
            >
              <MenuItem value="PERCENT">Percentual</MenuItem>
              <MenuItem value="FIXED">Valor fixo</MenuItem>
            </TextField>
            {couponForm.discountType === "FIXED" ? (
            <MoneyTextField
              label="Valor"
              value={couponForm.discountValue}
              onValueChange={(discountValue) =>
                setCouponForm((current) => ({
                  ...current,
                  discountValue,
                }))
              }
              fullWidth
            />
            ) : (
            <TextField
              label={
                couponForm.discountType === "PERCENT" ? "Percentual" : "Valor"
              }
              value={couponForm.discountValue}
              onChange={(event) =>
                setCouponForm((current) => ({
                  ...current,
                  discountValue:
                    event.target.value,
                }))
              }
              fullWidth
            />
            )}
          </Stack>
          <TextField
            select
            label="Plano"
            value={couponForm.billingPlanId}
            onChange={(event) =>
              setCouponForm((current) => ({
                ...current,
                billingPlanId: event.target.value,
              }))
            }
            fullWidth
          >
            <MenuItem value="">Todos os planos</MenuItem>
            {plans.map((plan) => (
              <MenuItem key={plan.id} value={plan.id}>
                {plan.name}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <AppDateField
              label="Início"
              value={couponForm.startsAt}
              onChange={(value) =>
                setCouponForm((current) => ({
                  ...current,
                  startsAt: value,
                }))
              }
              fullWidth
            />
            <AppDateField
              label="Fim"
              value={couponForm.expiresAt}
              onChange={(value) =>
                setCouponForm((current) => ({
                  ...current,
                  expiresAt: value,
                }))
              }
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              type="number"
              label="Limite de usos"
              value={couponForm.usageLimit}
              onChange={(event) =>
                setCouponForm((current) => ({
                  ...current,
                  usageLimit: event.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              select
              label="Status"
              value={couponForm.active}
              onChange={(event) =>
                setCouponForm((current) => ({
                  ...current,
                  active: event.target.value,
                }))
              }
              fullWidth
            >
              <MenuItem value="true">Ativo</MenuItem>
              <MenuItem value="false">Inativo</MenuItem>
            </TextField>
          </Stack>
        </Stack>
      </AppDialog>

      <AppDialog
        open={Boolean(manualAccessUser)}
        onClose={() => setManualAccessUser(null)}
        title="Confirmar liberação por dias"
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setManualAccessUser(null)}>Cancelar</Button>
            <LoadingActionButton
              variant="contained"
              onClick={confirmManualAccess}
              loading={Boolean(manualAccessUser && savingId === manualAccessUser.id)}
              loadingLabel="Liberando..."
              disabled={!manualAccessUser || savingId === manualAccessUser.id}
            >
              Confirmar liberação
            </LoadingActionButton>
          </>
        }
      >
        <Stack spacing={2}>
          <Typography color="text.secondary">
            Você está prestes a liberar acesso manual para este usuário. O acesso ficará ativo pela quantidade de dias informada e, ao final do período, deixará de valer automaticamente.
          </Typography>
          {manualAccessUser ? (
            <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "none", bgcolor: "action.hover" }}>
              <Typography fontWeight={900}>{manualAccessUser.name}</Typography>
              <Typography color="text.secondary">{manualAccessUser.email}</Typography>
              <Typography color="text.secondary" mt={1}>
                Período: <strong>{accessDaysForUser(manualAccessUser)} dia(s)</strong>
              </Typography>
              <Typography color="text.secondary">
                Acesso manual até: <strong>{formatDate(manualAccessUntilForUser(manualAccessUser).toISOString())}</strong>
              </Typography>
            </Paper>
          ) : null}
          <Typography variant="body2" color="text.secondary">
            Essa ação não cria pagamento, não altera dados financeiros do usuário e não torna o acesso vitalício.
          </Typography>
        </Stack>
      </AppDialog>

      <AppDialog
        open={Boolean(blockUser)}
        onClose={() => setBlockUser(null)}
        title="Confirmar bloqueio"
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setBlockUser(null)}>Cancelar</Button>
            <LoadingActionButton
              color="error"
              variant="contained"
              onClick={confirmBlockUser}
              loading={Boolean(blockUser && savingId === blockUser.id)}
              loadingLabel="Bloqueando..."
              disabled={!blockUser || savingId === blockUser.id}
            >
              Confirmar bloqueio
            </LoadingActionButton>
          </>
        }
      >
        <Stack spacing={2}>
          <Typography color="text.secondary">
            Você está prestes a bloquear o acesso deste usuário. Ele não conseguirá usar as áreas protegidas do sistema enquanto permanecer bloqueado.
          </Typography>
          {blockUser ? (
            <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "none", bgcolor: "action.hover" }}>
              <Typography fontWeight={900}>{blockUser.name}</Typography>
              <Typography color="text.secondary">{blockUser.email}</Typography>
              <Typography color="text.secondary" mt={1}>
                Status atual: <strong>{blockUser.subscriptionPlan === "LIFETIME" ? "Acesso vitalício" : statusLabels[blockUser.subscriptionStatus ?? "TRIALING"]}</strong>
              </Typography>
            </Paper>
          ) : null}
          <Typography variant="body2" color="text.secondary">
            O bloqueio não exclui a conta nem apaga os dados. Para remoção/anonimização, use o ícone ao lado e confirme no modal próprio.
          </Typography>
        </Stack>
      </AppDialog>

      <AppDialog
        open={Boolean(anonymizeUser)}
        onClose={() => setAnonymizeUser(null)}
        title="Anonimizar usuário"
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setAnonymizeUser(null)}>Cancelar</Button>
            <LoadingActionButton
              color="error"
              variant="contained"
              onClick={confirmAnonymizeUser}
              loading={anonymizing}
              loadingLabel="Anonimizando..."
              disabled={
                !anonymizeUser ||
                anonymizeEmail.trim().toLowerCase() !==
                  anonymizeUser.email.toLowerCase()
              }
            >
              Anonimizar usuário
            </LoadingActionButton>
          </>
        }
      >
        <Stack spacing={2}>
          <Typography color="text.secondary">
            Essa ação bloqueia o acesso, remove dados pessoais do cadastro e
            registra auditoria administrativa. Ela não deve ser usada para
            contornar obrigações legais, fiscais ou de pagamento.
          </Typography>
          {anonymizeUser ? (
            <Paper
              sx={{
                p: 2,
                borderRadius: 3,
                boxShadow: "none",
                bgcolor: "action.hover",
              }}
            >
              <Typography fontWeight={900}>{anonymizeUser.name}</Typography>
              <Typography color="text.secondary">
                {anonymizeUser.email}
              </Typography>
            </Paper>
          ) : null}
          <Typography color="text.secondary">
            Para confirmar, digite exatamente o e-mail do usuário.
          </Typography>
          <TextField
            label="E-mail de confirmação"
            value={anonymizeEmail}
            onChange={(event) => setAnonymizeEmail(event.target.value)}
            fullWidth
          />
          <TextField
            label="Observação interna"
            value={anonymizeNote}
            onChange={(event) => setAnonymizeNote(event.target.value)}
            multiline
            minRows={2}
            fullWidth
          />
        </Stack>
      </AppDialog>
      <FeedbackSnackbar message={notice} onClose={() => setNotice("")} />
    </Stack>
  );
}
