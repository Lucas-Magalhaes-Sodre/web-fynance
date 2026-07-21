import CookieIcon from "@mui/icons-material/Cookie";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { AppDialog } from "@/components/molecules/AppDialog";
import { api } from "@/services/api";

const COOKIE_CONSENT_KEY = "@minha-receita:cookie-consent";
const COOKIE_VISITOR_KEY = "@minha-receita:cookie-visitor-id";
const COOKIE_CONSENT_VERSION = "2026-07-21";

type CookieConsent = {
  version: string;
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  acceptedAt: string;
};

function getCookieVisitorId() {
  const currentVisitorId = localStorage.getItem(COOKIE_VISITOR_KEY);
  if (currentVisitorId) return currentVisitorId;

  const visitorId = crypto.randomUUID();
  localStorage.setItem(COOKIE_VISITOR_KEY, visitorId);
  return visitorId;
}

async function saveCookieConsent(consent: Omit<CookieConsent, "version" | "necessary" | "acceptedAt">) {
  const payload: CookieConsent = {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    preferences: consent.preferences,
    analytics: consent.analytics,
    marketing: consent.marketing,
    acceptedAt: new Date().toISOString(),
  };

  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(payload));

  try {
    await api.post("/privacy/cookie-consent", {
      visitorId: getCookieVisitorId(),
      version: payload.version,
      necessary: payload.necessary,
      preferences: payload.preferences,
      analytics: payload.analytics,
      marketing: payload.marketing,
      sourcePath: window.location.pathname,
    });
  } catch {
    // A preferencia local continua valendo mesmo se o registro remoto falhar.
  }
}

function hasValidCookieConsent() {
  const rawConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!rawConsent) return false;

  try {
    const consent = JSON.parse(rawConsent) as Partial<CookieConsent>;
    return consent.version === COOKIE_CONSENT_VERSION;
  } catch {
    return false;
  }
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    setVisible(!hasValidCookieConsent());
  }, []);

  async function acceptNecessary() {
    await saveCookieConsent({ preferences: false, analytics: false, marketing: false });
    setVisible(false);
    setSettingsOpen(false);
  }

  async function acceptAll() {
    await saveCookieConsent({ preferences: true, analytics: true, marketing: true });
    setVisible(false);
    setSettingsOpen(false);
  }

  async function saveSettings() {
    await saveCookieConsent({ preferences, analytics, marketing });
    setVisible(false);
    setSettingsOpen(false);
  }

  if (!visible) return null;

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          inset: "auto 16px 16px 16px",
          zIndex: 1600,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <Paper
          elevation={8}
          sx={{
            width: "min(960px, 100%)",
            p: { xs: 2, md: 2.5 },
            borderRadius: 4,
            border: "1px solid rgba(15,118,110,0.16)",
            boxShadow: "0 24px 70px rgba(15,23,42,0.18)",
            pointerEvents: "auto",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
            <Stack direction="row" spacing={1.5} flex={1}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(15,118,110,0.1)",
                  color: "#0F766E",
                  flexShrink: 0,
                }}
              >
                <CookieIcon />
              </Box>
              <Box>
                <Typography fontWeight={950}>Cookies e privacidade</Typography>
                <Typography color="text.secondary" fontSize={14} lineHeight={1.55}>
                  Usamos cookies necessários para login e segurança. Com sua autorização, também podemos usar preferências, métricas e comunicação para melhorar a experiência.
                </Typography>
              </Box>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end">
              <Button variant="text" onClick={acceptNecessary}>
                Apenas necessários
              </Button>
              <Button variant="outlined" onClick={() => setSettingsOpen(true)}>
                Configurar
              </Button>
              <Button variant="contained" onClick={acceptAll}>
                Aceitar todos
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>

      <AppDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Preferências de cookies"
        maxWidth="sm"
        actions={
          <>
            <Button onClick={acceptNecessary}>Apenas necessários</Button>
            <Button variant="contained" onClick={saveSettings}>Salvar escolhas</Button>
          </>
        }
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography fontWeight={900}>Cookies necessários</Typography>
              <Typography color="text.secondary">
                Mantêm login, segurança e funcionamento básico. Eles ficam sempre ativos.
              </Typography>
            </Box>
            <Tooltip title="Obrigatório">
              <span>
                <Checkbox checked disabled />
              </span>
            </Tooltip>
          </Stack>

          <FormControlLabel
            control={<Checkbox checked={preferences} onChange={(event) => setPreferences(event.target.checked)} />}
            label="Preferências de uso, como sessão e ajustes de interface."
          />
          <FormControlLabel
            control={<Checkbox checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />}
            label="Métricas anônimas para entender uso e melhorar o produto."
          />
          <FormControlLabel
            control={<Checkbox checked={marketing} onChange={(event) => setMarketing(event.target.checked)} />}
            label="Marketing e comunicação personalizada."
          />

          <Typography variant="caption" color="text.secondary">
            Salvamos um identificador aleatorio no navegador para registrar sua escolha de consentimento. Você pode limpar essa preferência apagando os dados do site no navegador.
          </Typography>
        </Stack>
      </AppDialog>
    </>
  );
}
