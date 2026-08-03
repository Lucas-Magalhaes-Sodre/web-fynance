import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import GroupsIcon from "@mui/icons-material/Groups";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageHelpButton } from "@/components/molecules/PageHelpButton";
import { AppDialog } from "@/components/molecules/AppDialog";
import { LoadingActionButton } from "@/components/molecules/LoadingActionButton";
import { normalizePlanProductKeys, productPlanLabel } from "@/constants/planProducts";
import { usePreferences } from "@/contexts/PreferencesContext";
import { currencyNames, currencySymbols, formatDate, formatMoney, formatMoneyWithCurrency, type AppCurrency } from "@/utils/format";
import { getMyReferralProgram, requestMyReferralWithdrawal, updateMyReferralCoupon, updateMyReferralPayout, type PixKeyType, type ReferralPayoutPreference, type ReferralProgram } from "@/services/referrals";

export function ProfilePage() {
  const { user, refreshUser, signOut } = useAuth();
  const { currency, setCurrency, t } = usePreferences();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    occupation: "",
  });
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [draftCurrency, setDraftCurrency] = useState<AppCurrency>(currency);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [referral, setReferral] = useState<ReferralProgram | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [savingReferral, setSavingReferral] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);
  const [withdrawingReferral, setWithdrawingReferral] = useState(false);
  const [payoutConfirmOpen, setPayoutConfirmOpen] = useState(false);
  const [referralTermsOpen, setReferralTermsOpen] = useState(false);
  const [profileTouched, setProfileTouched] = useState({ name: false });
  const [payoutSubmitted, setPayoutSubmitted] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    preference: "CREDIT" as ReferralPayoutPreference,
    pixKeyType: "EMAIL" as PixKeyType,
    pixKey: "",
    pixHolderName: "",
    referralTermsAccepted: false,
  });

  useEffect(() => {
    setForm({
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      city: user?.city ?? "",
      occupation: user?.occupation ?? "",
    });
    setMarketingConsent(Boolean(user?.marketingConsent));
  }, [user]);

  useEffect(() => {
    setDraftCurrency(currency);
  }, [currency]);

  useEffect(() => {
    getMyReferralProgram()
      .then((data) => {
        setReferral(data);
        setReferralCode(data.coupon.code);
        setPayoutForm({
          preference: data.payout.preference,
          pixKeyType: data.payout.pixKeyType ?? "EMAIL",
          pixKey: data.payout.pixKey ?? "",
          pixHolderName: data.payout.pixHolderName ?? "",
          referralTermsAccepted: Boolean(data.payout.referralTermsAcceptedAt),
        });
      })
      .catch(() => null);
  }, []);

  async function saveProfile() {
    setProfileTouched({ name: true });
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.put("/users/me", {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        occupation: form.occupation.trim() || null,
      });
      await refreshUser();
      setNotice(t("profileUpdated"));
      setError("");
    } finally {
      setSaving(false);
    }
  }

  async function savePrivacyConsent() {
    setPrivacySaving(true);
    try {
      await api.put("/users/me/privacy-consent", {
        lgpdAccepted: true,
        marketingConsent,
      });
      await refreshUser();
      setNotice(t("privacyUpdated"));
      setError("");
    } finally {
      setPrivacySaving(false);
    }
  }

  function saveCurrencyPreference() {
    if (draftCurrency === currency) return;
    setCurrency(draftCurrency);
    setNotice(t("currencyUpdated"));
    setError("");
  }

  async function exportMyData() {
    setExporting(true);
    try {
      const { data } = await api.get("/users/me/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `deluket-finance-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setNotice(t("dataExported"));
      setError("");
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    if (!deletePassword.trim()) {
      setError(t("passwordRequiredDelete"));
      return;
    }
    setDeleting(true);
    try {
      await api.delete("/users/me", { data: { password: deletePassword } });
      signOut();
    } catch {
      setError(t("deleteAccountError"));
    } finally {
      setDeleting(false);
    }
  }

  async function saveReferralCoupon() {
    if (!referralCode.trim() || referralCode.trim().toUpperCase() === referral?.coupon.code) return;
    setSavingReferral(true);
    try {
      const coupon = await updateMyReferralCoupon({ code: referralCode.trim().toUpperCase() });
      const nextReferral = await getMyReferralProgram();
      setReferral({ ...nextReferral, coupon });
      setReferralCode(coupon.code);
      setNotice("Cupom de indicação atualizado com sucesso.");
      setError("");
    } catch (error: any) {
      setError(error.response?.data?.message ?? "Não foi possível alterar o cupom. Tente outro nome.");
    } finally {
      setSavingReferral(false);
    }
  }

  async function copyReferralCoupon() {
    if (!referral?.coupon.code) return;
    await navigator.clipboard.writeText(referral.coupon.code);
    setNotice("Cupom copiado para a área de transferência.");
  }

  async function saveReferralPayout() {
    setPayoutSubmitted(true);
    const errors = payoutValidationErrors();
    if (errors.pixKey || errors.pixHolderName || errors.referralTermsAccepted) {
      setPayoutConfirmOpen(false);
      setError("Preencha os campos obrigatórios antes de salvar a forma de recebimento.");
      return;
    }
    setSavingPayout(true);
    try {
      await updateMyReferralPayout(payoutForm);
      const nextReferral = await getMyReferralProgram();
      setReferral(nextReferral);
      setPayoutConfirmOpen(false);
      setNotice("Forma de recebimento atualizada com sucesso.");
      setError("");
    } catch (error: any) {
      setError(error.response?.data?.message ?? "Não foi possível salvar a forma de recebimento.");
    } finally {
      setSavingPayout(false);
    }
  }

  function payoutValidationErrors() {
    if (payoutForm.preference !== "PIX") {
      return {
        pixKey: "",
        pixHolderName: "",
        referralTermsAccepted: payoutForm.referralTermsAccepted ? "" : "Aceite obrigatório.",
      };
    }
    return {
      pixKey: payoutForm.pixKey.trim() ? "" : "Chave PIX é obrigatória.",
      pixHolderName: payoutForm.pixHolderName.trim() ? "" : "Nome do titular é obrigatório.",
      referralTermsAccepted: payoutForm.referralTermsAccepted ? "" : "Aceite obrigatório.",
    };
  }

  function openPayoutConfirmation() {
    setPayoutSubmitted(true);
    const errors = payoutValidationErrors();
    if (errors.pixKey || errors.pixHolderName || errors.referralTermsAccepted) {
      setError("Preencha os campos obrigatórios antes de salvar a forma de recebimento.");
      return;
    }
    setPayoutConfirmOpen(true);
  }

  async function requestWithdrawal() {
    setWithdrawingReferral(true);
    try {
      await requestMyReferralWithdrawal();
      const nextReferral = await getMyReferralProgram();
      setReferral(nextReferral);
      setNotice("Solicitação de saque enviada. O pagamento PIX será conferido e marcado como pago pelo administrador.");
      setError("");
    } catch (error: any) {
      setError(error.response?.data?.message ?? "Não foi possível solicitar o saque.");
    } finally {
      setWithdrawingReferral(false);
    }
  }

  const lgpdAcceptedLabel = user?.lgpdAcceptedAt
    ? new Date(user.lgpdAcceptedAt).toLocaleDateString("pt-BR")
    : t("consentPending");
  const referralDiscountText = referral?.coupon.discountType === "FIXED"
    ? formatMoney(referral.coupon.discountValue)
    : `${Number(referral?.coupon.discountValue ?? 5).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
  const referralCommissionText = referral?.coupon.commissionType === "FIXED"
    ? formatMoney(referral.coupon.commissionValue)
    : `${Number(referral?.coupon.commissionValue ?? 5).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
  const payoutErrors = payoutValidationErrors();

  return (
    <Stack spacing={3}>
      <Paper className="glass-card" sx={{ p: { xs: 3, md: 4 }, borderRadius: 5 }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          <AccountCircleIcon color="primary" />
          <Typography color="primary" fontWeight={900}>{t("menuProfile")}</Typography>
          <PageHelpButton title={t("profileHelpTitle")}>
            <Typography color="text.secondary">
              {t("profileHelpText1")}
            </Typography>
            <Typography color="text.secondary">
              {t("profileHelpText2")}
            </Typography>
            <Typography color="text.secondary">
              {t("profileHelpText3")}
            </Typography>
          </PageHelpButton>
        </Stack>
        <Typography variant="h3" fontWeight={950} letterSpacing={0}>{t("profileAccountData")}</Typography>
        <Typography color="text.secondary" fontSize={17}>
          {t("profileSubtitle")}
        </Typography>
      </Paper>

      <Box
        sx={{
          columnCount: { xs: 1, lg: 2 },
          columnGap: 3,
          "& > .profile-section": {
            breakInside: "avoid",
            mb: 3,
            display: "inline-block",
            width: "100%",
          },
        }}
      >
        <Paper className="soft-card profile-section" sx={{ p: 3, borderRadius: 4 }}>
          <Stack spacing={2}>
            <TextField
              label={t("name")}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              onBlur={() => setProfileTouched({ name: true })}
              required
              error={profileTouched.name && !form.name.trim()}
              helperText={profileTouched.name && !form.name.trim() ? "Nome é obrigatório." : undefined}
              fullWidth
            />
            <TextField label={t("email")} value={user?.email ?? ""} fullWidth disabled />
            <TextField label={t("phone")} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} fullWidth />
            <TextField label={t("city")} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} fullWidth />
            <TextField label={t("occupation")} value={form.occupation} onChange={(event) => setForm({ ...form, occupation: event.target.value })} fullWidth />
            <Box display="flex" justifyContent="flex-end">
              <LoadingActionButton variant="contained" onClick={saveProfile} disabled={!form.name.trim()} loading={saving} loadingLabel={t("saving")}>
                {t("saveProfile")}
              </LoadingActionButton>
            </Box>
          </Stack>
        </Paper>

        <Paper className="soft-card profile-section" sx={{ p: 3, borderRadius: 4 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <GroupsIcon color="primary" sx={{ mt: 0.35 }} />
              <Box>
                <Typography variant="h5" fontWeight={950}>Indique e ganhe comissão</Typography>
                <Typography color="text.secondary">
                  Compartilhe seu cupom. Quem usar ganha <strong>{referralDiscountText} de desconto</strong> ao contratar um plano, e você recebe <strong>{referralCommissionText} de comissão</strong> após a confirmação do pagamento.
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setReferralTermsOpen(true)}
                  sx={{ alignSelf: "flex-start", mt: 0.5, px: 0, fontWeight: 900 }}
                >
                  Ver termos e condições
                </Button>
              </Box>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "flex-start" }}>
              <TextField
                label="Meu cupom"
                value={referralCode}
                onChange={(event) => setReferralCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 24))}
                helperText="3 a 24 caracteres. O sistema valida se já existe antes de salvar."
                fullWidth
              />
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={copyReferralCoupon}
                disabled={!referral?.coupon.code}
                sx={{ minHeight: 56, px: 2.5 }}
              >
                Copiar
              </Button>
            </Stack>
            <Box display="flex" justifyContent="flex-end">
              <LoadingActionButton
                variant="contained"
                onClick={saveReferralCoupon}
                loading={savingReferral}
                loadingLabel="Salvando..."
                disabled={!referralCode.trim() || referralCode.trim().toUpperCase() === referral?.coupon.code}
              >
                Salvar cupom
              </LoadingActionButton>
            </Box>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Paper sx={{ p: 1.5, borderRadius: 3, boxShadow: "none", bgcolor: "action.hover" }}>
                  <Typography variant="caption" color="text.secondary">Indicações</Typography>
                  <Typography fontWeight={950}>{referral?.summary.indications ?? 0}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 1.5, borderRadius: 3, boxShadow: "none", bgcolor: "action.hover" }}>
                  <Typography variant="caption" color="text.secondary">Comissões pendentes</Typography>
                  <Typography fontWeight={950}>{formatMoney(referral?.summary.pendingAmount ?? 0)}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 1.5, borderRadius: 3, boxShadow: "none", bgcolor: "action.hover" }}>
                  <Typography variant="caption" color="text.secondary">Disponível para desconto</Typography>
                  <Typography fontWeight={950}>{formatMoney(referral?.summary.availableCreditAmount ?? 0)}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 1.5, borderRadius: 3, boxShadow: "none", bgcolor: "action.hover" }}>
                  <Typography variant="caption" color="text.secondary">Disponível para PIX</Typography>
                  <Typography fontWeight={950}>{formatMoney(referral?.summary.availableCashAmount ?? 0)}</Typography>
                </Paper>
              </Grid>
            </Grid>
            <Divider />
            <Stack spacing={1.5}>
              <Typography fontWeight={950}>Como quer receber sua comissão?</Typography>
              <TextField
                select
                label="Forma de recebimento"
                value={payoutForm.preference}
                onChange={(event) => setPayoutForm((current) => ({ ...current, preference: event.target.value as ReferralPayoutPreference }))}
                fullWidth
              >
                <MenuItem value="CREDIT">Usar como desconto nos planos</MenuItem>
                <MenuItem value="PIX">Receber em dinheiro por PIX</MenuItem>
              </TextField>
              {payoutForm.preference === "PIX" ? (
                <Stack spacing={1.5}>
                  <Alert severity="info" sx={{ borderRadius: 3 }}>
                    Para receber em dinheiro, a comissão fica disponível em até {referral?.summary.cashAvailabilityDays ?? 14} dias após a solicitação do saque PIX ou após mudar para PIX. Saque mínimo: {formatMoney(referral?.summary.minimumWithdrawalAmount ?? 20)}.
                  </Alert>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <TextField select label="Tipo de chave PIX" value={payoutForm.pixKeyType} onChange={(event) => setPayoutForm((current) => ({ ...current, pixKeyType: event.target.value as PixKeyType }))} required fullWidth>
                      <MenuItem value="EMAIL">E-mail</MenuItem>
                      <MenuItem value="PHONE">Telefone</MenuItem>
                      <MenuItem value="RANDOM">Chave aleatória</MenuItem>
                      <MenuItem value="CPF_CNPJ">CPF/CNPJ</MenuItem>
                    </TextField>
                    <TextField
                      label="Chave PIX"
                      value={payoutForm.pixKey}
                      onChange={(event) => setPayoutForm((current) => ({ ...current, pixKey: event.target.value }))}
                      required
                      error={payoutSubmitted && Boolean(payoutErrors.pixKey)}
                      helperText={payoutSubmitted ? payoutErrors.pixKey : undefined}
                      fullWidth
                    />
                  </Stack>
                  <TextField
                    label="Nome do titular da chave"
                    value={payoutForm.pixHolderName}
                    onChange={(event) => setPayoutForm((current) => ({ ...current, pixHolderName: event.target.value }))}
                    required
                    error={payoutSubmitted && Boolean(payoutErrors.pixHolderName)}
                    helperText={payoutSubmitted ? payoutErrors.pixHolderName : undefined}
                    fullWidth
                  />
                </Stack>
              ) : (
                <Alert severity="success" sx={{ borderRadius: 3 }}>
                  Como desconto, o saldo disponível pode ser usado imediatamente na contratação de um plano e não exige dados PIX.
                </Alert>
              )}
              <FormControlLabel
                control={<Checkbox checked={payoutForm.referralTermsAccepted} onChange={(event) => setPayoutForm((current) => ({ ...current, referralTermsAccepted: event.target.checked }))} />}
                label={
                  <Typography variant="body2" color="text.secondary">
                    Li e aceito as regras do programa de indicação, incluindo prazo de liberação, saque mínimo, validação antifraude e pagamento PIX manual.
                  </Typography>
                }
              />
              {payoutSubmitted && payoutErrors.referralTermsAccepted ? (
                <Typography variant="caption" color="error">{payoutErrors.referralTermsAccepted}</Typography>
              ) : null}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="flex-end">
                <LoadingActionButton variant="outlined" onClick={requestWithdrawal} loading={withdrawingReferral} loadingLabel="Solicitando..." disabled={payoutForm.preference !== "PIX" || (referral?.summary.availableCashAmount ?? 0) < (referral?.summary.minimumWithdrawalAmount ?? 20)}>
                  Solicitar saque PIX
                </LoadingActionButton>
                <LoadingActionButton variant="contained" onClick={openPayoutConfirmation} loading={savingPayout} loadingLabel="Salvando...">
                  Salvar forma de recebimento
                </LoadingActionButton>
              </Stack>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              As comissões ficam sujeitas à confirmação e regras comerciais definidas pela administração.
            </Typography>
          </Stack>
        </Paper>

        <Paper className="soft-card profile-section" sx={{ p: 3, borderRadius: 4 }}>
          <Stack spacing={1.2}>
            <Typography variant="h5" fontWeight={950}>Meu plano</Typography>
            {user?.access?.hasPaidAccess ? (
              <Alert severity="success" sx={{ borderRadius: 3 }}>
                Você está atualmente com um plano ativo.
              </Alert>
            ) : user?.trialEndsAt ? (
              <Alert severity="info" sx={{ borderRadius: 3 }}>
                Você está no teste grátis até {formatDate(user.trialEndsAt)}.
              </Alert>
            ) : null}
            <Typography color="text.secondary">
              Plano: <strong>{user?.planNameSnapshot ?? "Teste grátis / sem plano pago"}</strong>
            </Typography>
            <Typography color="text.secondary">
              Valor: <strong>{user?.planPriceSnapshot ? formatMoney(user.planPriceSnapshot) : "-"}</strong>
            </Typography>
            {user?.couponCodeSnapshot ? (
              <Typography color="text.secondary">
                Cupom: <strong>{user.couponCodeSnapshot}</strong>
                {user.couponDiscountSnapshot ? ` · desconto de ${formatMoney(user.couponDiscountSnapshot)}` : ""}
              </Typography>
            ) : null}
            <Typography color="text.secondary">
              Duração: <strong>{user?.planDurationMonthsSnapshot ? `${user.planDurationMonthsSnapshot} mês(es)` : "-"}</strong>
            </Typography>
            <Typography color="text.secondary">
              Vencimento: <strong>{user?.subscriptionCurrentPeriodEnd ? formatDate(user.subscriptionCurrentPeriodEnd) : user?.trialEndsAt ? `Teste até ${formatDate(user.trialEndsAt)}` : "-"}</strong>
            </Typography>
            <Box>
              <Typography color="text.secondary" mb={1}>Itens inclusos</Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {normalizePlanProductKeys(user?.access?.productKeys ?? user?.planProductKeysSnapshot).map((key) => (
                  <Chip key={key} size="small" label={productPlanLabel(key, user?.planProductLabelsSnapshot)} variant="outlined" sx={{ fontWeight: 800 }} />
                ))}
                {(user?.planIncludedItemsSnapshot ?? []).map((label) => (
                  <Chip key={label} size="small" label={label} variant="outlined" sx={{ fontWeight: 800 }} />
                ))}
              </Stack>
            </Box>
            <Box display="flex" justifyContent="flex-end" pt={1}>
              <Button component={Link} to="/app/billing" variant="contained">
                Ver planos e contratação
              </Button>
            </Box>
          </Stack>
        </Paper>

        <Paper className="soft-card profile-section" sx={{ p: 3, borderRadius: 4 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <AttachMoneyIcon color="primary" sx={{ mt: 0.35 }} />
              <Box>
                <Typography variant="h5" fontWeight={950}>{t("profileCurrencyTitle")}</Typography>
                <Typography color="text.secondary">
                  {t("profileCurrencyText")}
                </Typography>
              </Box>
            </Stack>

            <FormControl fullWidth>
              <InputLabel id="profile-currency-label">{t("currency")}</InputLabel>
              <Select
                labelId="profile-currency-label"
                label={t("currency")}
                value={draftCurrency}
                onChange={(event) => setDraftCurrency(event.target.value as AppCurrency)}
              >
                {(Object.keys(currencyNames) as AppCurrency[]).map((item) => (
                  <MenuItem key={item} value={item}>
                    {currencySymbols[item]} {item} - {currencyNames[item]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Alert severity="info" sx={{ borderRadius: 3 }}>
              {t("profileCurrencyPreview")} <strong>{formatMoneyWithCurrency(1234.56, draftCurrency)}</strong>
            </Alert>

            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={saveCurrencyPreference}
                disabled={draftCurrency === currency}
              >
                {t("savePreferences")}
              </Button>
            </Box>
          </Stack>
        </Paper>

        <Paper className="soft-card profile-section" sx={{ p: 3, borderRadius: 4 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PrivacyTipIcon color="primary" />
              <Box flex={1}>
                <Typography variant="h5" fontWeight={950}>{t("profilePrivacyData")}</Typography>
                <Typography color="text.secondary">
                  {t("profilePrivacyDataText")}
                </Typography>
              </Box>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {t("lgpdAccepted")}: <strong>{lgpdAcceptedLabel}</strong>
              </Typography>
              <Button variant="outlined" onClick={() => setPrivacyModalOpen(true)}>
                {t("managePrivacyData")}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>

      <AppDialog
        open={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        title={t("privacyLgpd")}
        maxWidth="sm"
        actions={<Button onClick={() => setPrivacyModalOpen(false)}>{t("close")}</Button>}
      >
        <Stack spacing={2.5}>
          <Typography color="text.secondary">
            {t("privacyLgpdText")}
          </Typography>

          <Box>
            <Typography fontWeight={900}>{t("consent")}</Typography>
            <Typography color="text.secondary">
              {t("lgpdAccepted")}: {lgpdAcceptedLabel}
              {user?.lgpdConsentVersion ? ` · ${t("version")} ${user.lgpdConsentVersion}` : ""}
            </Typography>
          </Box>

          <FormControlLabel
            control={<Checkbox checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} />}
            label={t("registerMarketingConsent")}
          />

          <Box display="flex" justifyContent="flex-end">
            <LoadingActionButton variant="outlined" onClick={savePrivacyConsent} loading={privacySaving} loadingLabel={t("saving")}>
              {t("savePreferences")}
            </LoadingActionButton>
          </Box>

          <Divider />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <LoadingActionButton variant="outlined" startIcon={<DownloadIcon />} onClick={exportMyData} loading={exporting} loadingLabel={t("generating")}>
              {t("exportMyData")}
            </LoadingActionButton>
            <Button color="error" variant="outlined" startIcon={<DeleteOutlineIcon />} onClick={() => setDeleteModalOpen(true)}>
              {t("deleteMyAccount")}
            </Button>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            {t("profileExportNote")}
          </Typography>
        </Stack>
      </AppDialog>

      <AppDialog
        open={referralTermsOpen}
        onClose={() => setReferralTermsOpen(false)}
        title="Termos e condições do programa de indicação"
        maxWidth="md"
        actions={<Button onClick={() => setReferralTermsOpen(false)}>Fechar</Button>}
      >
        <Stack spacing={2.5}>
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            Este resumo explica as regras do programa de indicação do Deluket Finance. Ao participar, o usuário declara que leu e concorda com as condições abaixo.
          </Alert>

          <Box>
            <Typography fontWeight={950}>1. Como funciona</Typography>
            <Typography color="text.secondary">
              Cada usuário recebe um cupom próprio para indicar o sistema. Quando uma pessoa indicada usa esse cupom e contrata um plano pago, ela recebe <strong>{referralDiscountText} de desconto</strong> e o indicador recebe <strong>{referralCommissionText} de comissão</strong> após a confirmação do pagamento.
            </Typography>
          </Box>

          <Box>
            <Typography fontWeight={950}>2. Validação da comissão</Typography>
            <Typography color="text.secondary">
              A comissão só é considerada válida quando o pagamento do novo usuário for confirmado e não houver cancelamento, estorno, chargeback, fraude, autoindicação ou uso indevido do programa.
            </Typography>
          </Box>

          <Box>
            <Typography fontWeight={950}>3. Receber como desconto</Typography>
            <Typography color="text.secondary">
              Ao escolher receber como desconto, o saldo de comissão disponível pode ser usado imediatamente na contratação ou renovação de planos dentro do sistema. Valores já usados como desconto ficam registrados e não podem ser sacados novamente por PIX.
            </Typography>
          </Box>

          <Box>
            <Typography fontWeight={950}>4. Receber em dinheiro por PIX</Typography>
            <Typography color="text.secondary">
              Para receber em dinheiro, é necessário informar chave PIX e nome do titular. A comissão fica disponível em até {referral?.summary.cashAvailabilityDays ?? 14} dias após a solicitação do saque PIX ou após a mudança para recebimento por PIX, o que acontecer por último. O saque mínimo é de {formatMoney(referral?.summary.minimumWithdrawalAmount ?? 20)}.
            </Typography>
          </Box>

          <Box>
            <Typography fontWeight={950}>5. Pagamento manual</Typography>
            <Typography color="text.secondary">
              O pagamento por PIX é feito manualmente pelo administrador após conferência. Quando o pagamento for marcado como pago no admin, o valor correspondente fica liquidado no histórico para evitar duplicidade.
            </Typography>
          </Box>

          <Box>
            <Typography fontWeight={950}>6. Alteração da forma de recebimento</Typography>
            <Typography color="text.secondary">
              O usuário pode alternar entre desconto em planos e recebimento por PIX sem perder o histórico de comissões. A mudança não duplica valores: cada comissão pode ser usada ou paga apenas uma vez.
            </Typography>
          </Box>

          <Box>
            <Typography fontWeight={950}>7. Uso correto do programa</Typography>
            <Typography color="text.secondary">
              Não é permitido criar contas falsas, indicar a si mesmo, simular compras, compartilhar cupons de forma enganosa ou praticar qualquer tentativa de manipular o programa. Casos suspeitos podem ser bloqueados ou cancelados pela administração.
            </Typography>
          </Box>

          <Box>
            <Typography fontWeight={950}>8. Dados PIX e privacidade</Typography>
            <Typography color="text.secondary">
              Os dados PIX informados são usados apenas para viabilizar o pagamento da comissão e seguem as regras de privacidade e LGPD do sistema.
            </Typography>
          </Box>
        </Stack>
      </AppDialog>

      <AppDialog
        open={payoutConfirmOpen}
        onClose={() => setPayoutConfirmOpen(false)}
        title="Confirmar forma de recebimento"
        maxWidth="sm"
        actions={
          <>
            <Button onClick={() => setPayoutConfirmOpen(false)}>Cancelar</Button>
            <LoadingActionButton variant="contained" onClick={saveReferralPayout} loading={savingPayout} loadingLabel="Salvando...">
              Confirmar
            </LoadingActionButton>
          </>
        }
      >
        <Stack spacing={2}>
          {payoutForm.preference === "PIX" ? (
            <Alert severity="warning" sx={{ borderRadius: 3 }}>
              Ao mudar para receber em dinheiro, os valores passam a respeitar o prazo de até {referral?.summary.cashAvailabilityDays ?? 14} dias após a solicitação do saque PIX ou a partir desta mudança, o que acontecer por último. O saque mínimo é {formatMoney(referral?.summary.minimumWithdrawalAmount ?? 20)} e o pagamento será feito manualmente por PIX após conferência do administrador.
            </Alert>
          ) : (
            <Alert severity="success" sx={{ borderRadius: 3 }}>
              Ao mudar para desconto em planos, o saldo de comissão disponível poderá ser usado imediatamente na contratação. Valores já solicitados para PIX não serão duplicados como desconto.
            </Alert>
          )}
          <Typography color="text.secondary">
            Essa mudança não apaga o histórico das suas comissões e não duplica pagamentos. Cada valor usado como desconto ou solicitado por PIX fica registrado no sistema.
          </Typography>
        </Stack>
      </AppDialog>

      <AppDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t("deleteAccount")}
        maxWidth="xs"
        actions={
          <>
            <Button onClick={() => setDeleteModalOpen(false)}>{t("cancel")}</Button>
            <LoadingActionButton color="error" variant="contained" onClick={deleteAccount} loading={deleting} loadingLabel={t("deleting")}>
              {t("deleteForever")}
            </LoadingActionButton>
          </>
        }
      >
        <Stack spacing={2}>
          <Typography color="text.secondary">
            {t("deleteAccountWarning")}
          </Typography>
          <TextField
            label={t("password")}
            type="password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
            fullWidth
          />
        </Stack>
      </AppDialog>

      <Snackbar open={Boolean(notice)} autoHideDuration={3000} onClose={() => setNotice("")}>
        <Alert severity="success" variant="filled" onClose={() => setNotice("")}>{notice}</Alert>
      </Snackbar>
      <Snackbar open={Boolean(error)} autoHideDuration={4000} onClose={() => setError("")}>
        <Alert severity="error" variant="filled" onClose={() => setError("")}>{error}</Alert>
      </Snackbar>
    </Stack>
  );
}
