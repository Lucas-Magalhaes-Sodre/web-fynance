import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageHelpButton } from "@/components/molecules/PageHelpButton";
import { AppDialog } from "@/components/molecules/AppDialog";
import { LoadingActionButton } from "@/components/molecules/LoadingActionButton";

export function ProfilePage() {
  const { user, refreshUser, signOut } = useAuth();
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
      setNotice("Perfil atualizado com sucesso.");
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
      setNotice("Preferências de privacidade atualizadas.");
      setError("");
    } finally {
      setPrivacySaving(false);
    }
  }

  async function exportMyData() {
    setExporting(true);
    try {
      const { data } = await api.get("/users/me/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `minha-receita-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setNotice("Arquivo com seus dados gerado com sucesso.");
      setError("");
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    if (!deletePassword.trim()) {
      setError("Informe sua senha para excluir a conta.");
      return;
    }
    setDeleting(true);
    try {
      await api.delete("/users/me", { data: { password: deletePassword } });
      signOut();
    } catch {
      setError("Não foi possível excluir a conta. Confira sua senha.");
    } finally {
      setDeleting(false);
    }
  }

  const lgpdAcceptedLabel = user?.lgpdAcceptedAt
    ? new Date(user.lgpdAcceptedAt).toLocaleDateString("pt-BR")
    : "Pendente";

  return (
    <Stack spacing={3}>
      <Paper className="glass-card" sx={{ p: { xs: 3, md: 4 }, borderRadius: 5 }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          <AccountCircleIcon color="primary" />
          <Typography color="primary" fontWeight={900}>Meu perfil</Typography>
          <PageHelpButton title="Como funciona Meu perfil?">
            <Typography color="text.secondary">
              Meu perfil reúne os dados básicos da sua conta e algumas informações não sensíveis que ajudam a personalizar seu cadastro.
            </Typography>
            <Typography color="text.secondary">
              Você pode editar nome, telefone, cidade e profissão. O e-mail aparece apenas para consulta, porque ele é usado no acesso à conta.
            </Typography>
            <Typography color="text.secondary">
              Nesta tela também ficam as opções LGPD para consultar o consentimento, exportar seus dados e solicitar a exclusão definitiva da conta.
            </Typography>
          </PageHelpButton>
        </Stack>
        <Typography variant="h3" fontWeight={950} letterSpacing={0}>Dados da conta</Typography>
        <Typography color="text.secondary" fontSize={17}>
          Consulte e atualize informações não sensiveis do seu cadastro.
        </Typography>
      </Paper>

      <Paper className="soft-card" sx={{ p: 3, borderRadius: 4, maxWidth: 760 }}>
        <Stack spacing={2}>
          <TextField label="Nome" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} fullWidth />
          <TextField label="E-mail" value={user?.email ?? ""} fullWidth disabled />
          <TextField label="Telefone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} fullWidth />
          <TextField label="Cidade" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} fullWidth />
          <TextField label="Profissao" value={form.occupation} onChange={(event) => setForm({ ...form, occupation: event.target.value })} fullWidth />
          <Box display="flex" justifyContent="flex-end">
            <LoadingActionButton variant="contained" onClick={saveProfile} disabled={!form.name.trim()} loading={saving} loadingLabel="Salvando...">
              Salvar perfil
            </LoadingActionButton>
          </Box>
        </Stack>
      </Paper>

      <Paper className="soft-card" sx={{ p: 3, borderRadius: 4, maxWidth: 760 }}>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <PrivacyTipIcon color="primary" />
            <Box>
              <Typography variant="h5" fontWeight={950}>Privacidade e LGPD</Typography>
              <Typography color="text.secondary">
                Controle seu consentimento e seus dados pessoais cadastrados no sistema.
              </Typography>
            </Box>
          </Stack>

          <Box>
            <Typography fontWeight={900}>Consentimento</Typography>
            <Typography color="text.secondary">
              Aceite LGPD: {lgpdAcceptedLabel}
              {user?.lgpdConsentVersion ? ` · Versao ${user.lgpdConsentVersion}` : ""}
            </Typography>
          </Box>

          <FormControlLabel
            control={<Checkbox checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} />}
            label="Aceito receber comunicados e novidades do sistema."
          />

          <Box display="flex" justifyContent="flex-end">
            <LoadingActionButton variant="outlined" onClick={savePrivacyConsent} loading={privacySaving} loadingLabel="Salvando...">
              Salvar preferências
            </LoadingActionButton>
          </Box>

          <Divider />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <LoadingActionButton variant="outlined" startIcon={<DownloadIcon />} onClick={exportMyData} loading={exporting} loadingLabel="Gerando...">
              Exportar meus dados
            </LoadingActionButton>
            <Button color="error" variant="outlined" startIcon={<DeleteOutlineIcon />} onClick={() => setDeleteModalOpen(true)}>
              Excluir minha conta
            </Button>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            A exportação gera um arquivo JSON com perfil, categorias, movimentações, economias, metas e cartões vinculados ao seu usuário. A exclusão remove definitivamente sua conta e os registros vinculados.
          </Typography>
        </Stack>
      </Paper>

      <AppDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir conta"
        maxWidth="xs"
        actions={
          <>
            <Button onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
            <LoadingActionButton color="error" variant="contained" onClick={deleteAccount} loading={deleting} loadingLabel="Excluindo...">
              Excluir definitivamente
            </LoadingActionButton>
          </>
        }
      >
        <Stack spacing={2}>
          <Typography color="text.secondary">
            Essa acao remove sua conta e todos os dados financeiros vinculados. Para confirmar, informe sua senha.
          </Typography>
          <TextField
            label="Senha"
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
