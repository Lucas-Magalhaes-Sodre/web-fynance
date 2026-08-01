import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [draftCurrency, setDraftCurrency] = useState<AppCurrency>(currency);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

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

  async function saveProfile() {
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

  const lgpdAcceptedLabel = user?.lgpdAcceptedAt
    ? new Date(user.lgpdAcceptedAt).toLocaleDateString("pt-BR")
    : t("consentPending");

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

      <Paper className="soft-card" sx={{ p: 3, borderRadius: 4, maxWidth: 760 }}>
        <Stack spacing={2}>
          <TextField label={t("name")} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} fullWidth />
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

      <Paper className="soft-card" sx={{ p: 3, borderRadius: 4, maxWidth: 760 }}>
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

      <Paper className="soft-card" sx={{ p: 3, borderRadius: 4, maxWidth: 760 }}>
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

      <Paper className="soft-card" sx={{ p: 3, borderRadius: 4, maxWidth: 760 }}>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <PrivacyTipIcon color="primary" />
            <Box>
              <Typography variant="h5" fontWeight={950}>{t("privacyLgpd")}</Typography>
              <Typography color="text.secondary">
                {t("privacyLgpdText")}
              </Typography>
            </Box>
          </Stack>

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
      </Paper>

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
