import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RestoreIcon from "@mui/icons-material/Restore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "@/components/atoms/EmptyState";
import { AppDialog } from "@/components/molecules/AppDialog";
import { PageHelpButton } from "@/components/molecules/PageHelpButton";
import { useConfirmDialog } from "@/components/molecules/ConfirmDialog";
import {
  createCreditCard,
  createCreditCardPurchase,
  deleteCreditCardPurchase,
  listCreditCards,
  updateCreditCard,
  updateCreditCardPurchase,
  type CreditCardPayload,
  type CreditCardPurchasePayload,
} from "@/services/financialControl";
import type { CreditCard, CreditCardPurchase } from "@/interfaces/financial";
import { financeColors, formatDate, formatMoney, isoDate, months } from "@/utils/format";

const current = new Date();
const currentMonth = current.getMonth() + 1;
const currentYear = current.getFullYear();

type CardForm = {
  name: string;
  dueDay: string;
  creditLimit: string;
  color: string;
};

type PurchaseForm = {
  title: string;
  description: string;
  amount: string;
  amountMode: "TOTAL" | "INSTALLMENT";
  purchaseDate: string;
  installments: string;
};

const emptyCardForm: CardForm = { name: "", dueDay: "10", creditLimit: "", color: "#0F766E" };
const emptyPurchaseForm: PurchaseForm = {
  title: "",
  description: "",
  amount: "",
  amountMode: "TOTAL",
  purchaseDate: isoDate(),
  installments: "1",
};

function cardPayload(form: CardForm): CreditCardPayload {
  const limit = form.creditLimit.trim() ? Number(form.creditLimit) : null;
  return {
    name: form.name.trim(),
    dueDay: Number(form.dueDay),
    creditLimit: limit && limit > 0 ? limit : null,
    color: form.color,
  };
}

function purchasePayload(form: PurchaseForm, cardId: string): CreditCardPurchasePayload {
  const installments = Math.max(1, Number(form.installments));
  const amount = Number(form.amount);
  return {
    cardId,
    title: form.title.trim(),
    description: form.description.trim() || null,
    amount: form.amountMode === "INSTALLMENT" ? amount * installments : amount,
    purchaseDate: form.purchaseDate,
    installments,
  };
}

function usageText(card: CreditCard) {
  if (!card.creditLimit) return "Sem limite informado";
  return `${formatMoney(card.usedAmount)} de ${formatMoney(card.creditLimit)}`;
}

function isValidHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function CreditCardsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const cardFilter = searchParams.get("card") ?? "";
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [cardTab, setCardTab] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [detailYear, setDetailYear] = useState(currentYear);
  const [selectedDetailMonth, setSelectedDetailMonth] = useState(currentMonth);
  const [cardForm, setCardForm] = useState<CardForm>(emptyCardForm);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseForm>(emptyPurchaseForm);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<CreditCardPurchase | null>(null);
  const [deletingPurchase, setDeletingPurchase] = useState<CreditCardPurchase | null>(null);
  const [deleteAllInstallments, setDeleteAllInstallments] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { confirm, dialog } = useConfirmDialog();

  const selectedCard = useMemo(
    () => cards.find((card) => card.id === selectedCardId) ?? null,
    [cards, selectedCardId],
  );

  const visibleCards = useMemo(
    () => cards.filter((card) => (cardTab === "ACTIVE" ? card.isActive : !card.isActive)),
    [cardTab, cards],
  );

  const selectedMonthSummary = useMemo(
    () => selectedCard?.monthlySummary.find((summary) => summary.month === selectedDetailMonth) ?? null,
    [selectedCard, selectedDetailMonth],
  );

  const maxMonthlyAmount = useMemo(() => {
    return Math.max(1, ...(selectedCard?.monthlySummary.map((summary) => summary.statementAmount) ?? [0]));
  }, [selectedCard]);

  const yearOptions = useMemo(() => {
    const options = new Set<number>();
    for (let value = currentYear - 5; value <= currentYear + 5; value += 1) options.add(value);
    options.add(detailYear);
    return Array.from(options).sort((a, b) => a - b);
  }, [detailYear]);

  async function loadCards(cardName = cardFilter) {
    setLoading(true);
    setError("");
    try {
      const overview = await listCreditCards({
        month: currentMonth,
        year: detailYear,
        cardName: cardName || undefined,
      });
      setCards(overview.cards);
      setSelectedCardId((currentId) => {
        const matching = overview.cards.find((card) => card.id === currentId);
        if (matching) return matching.id;
        return overview.cards[0]?.id ?? "";
      });
      if (cardName && overview.cards.length) {
        setSelectedCardId(overview.cards[0].id);
        setDetailOpen(true);
        setSearchParams({ card: overview.cards[0].name });
      }
    } catch {
      setError("Nao foi possivel carregar os cartoes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCards(cardFilter);
  }, [detailYear, cardFilter]);

  function resetCardForm() {
    setEditingCard(null);
    setCardForm(emptyCardForm);
    setCardModalOpen(false);
  }

  function resetPurchaseForm() {
    setEditingPurchase(null);
    setPurchaseForm(emptyPurchaseForm);
  }

  function openCreateCard() {
    setEditingCard(null);
    setCardForm(emptyCardForm);
    setCardModalOpen(true);
  }

  function startCardEdit(card: CreditCard) {
    setEditingCard(card);
    setCardForm({
      name: card.name,
      dueDay: String(card.dueDay),
      creditLimit: card.creditLimit ? String(card.creditLimit) : "",
      color: card.color,
    });
    setCardModalOpen(true);
  }

  function openDetails(card: CreditCard) {
    setSelectedCardId(card.id);
    setSelectedDetailMonth(currentMonth);
    setDetailOpen(true);
    setSearchParams({ card: card.name });
  }

  function closeDetails() {
    setDetailOpen(false);
    resetPurchaseForm();
    setSearchParams({});
  }

  async function saveCard(event: FormEvent) {
    event.preventDefault();
    const payload = cardPayload(cardForm);
    if (!payload.name || payload.dueDay < 1 || payload.dueDay > 31 || !isValidHexColor(cardForm.color)) return;
    setSaving(true);
    try {
      const card = editingCard
        ? await updateCreditCard(editingCard.id, payload)
        : await createCreditCard(payload);
      resetCardForm();
      await loadCards("");
      setSelectedCardId(card.id);
    } finally {
      setSaving(false);
    }
  }

  async function toggleCardActive(card: CreditCard) {
    const confirmed = await confirm({
      title: card.isActive ? "Inativar cartao" : "Reativar cartao",
      description: card.isActive
        ? `"${card.name}" saira da lista principal, mas todo o historico sera mantido.`
        : `"${card.name}" voltara para a lista principal de cartoes.`,
      confirmLabel: card.isActive ? "Inativar" : "Reativar",
      tone: card.isActive ? "danger" : "primary",
    });
    if (!confirmed) return;
    await updateCreditCard(card.id, { isActive: !card.isActive });
    await loadCards("");
  }

  async function savePurchase(event: FormEvent) {
    event.preventDefault();
    if (!selectedCard) return;
    const payload = purchasePayload(purchaseForm, selectedCard.id);
    if (!payload.title || payload.amount <= 0 || Number.isNaN(payload.amount)) return;
    setSaving(true);
    try {
      if (editingPurchase) {
        const { cardId: _cardId, ...updatePayload } = payload;
        await updateCreditCardPurchase(editingPurchase.id, updatePayload);
      } else {
        await createCreditCardPurchase(payload);
      }
      resetPurchaseForm();
      await loadCards(cardFilter);
    } finally {
      setSaving(false);
    }
  }

  async function removePurchase(purchase: CreditCardPurchase) {
    if (purchase.installments > 1 && purchase.installmentNumber) {
      setDeletingPurchase(purchase);
      setDeleteAllInstallments(false);
      return;
    }

    const confirmed = await confirm({
      title: "Excluir compra",
      description: `Deseja excluir "${purchase.title}" do detalhamento deste cartao?`,
      confirmLabel: "Excluir",
      tone: "danger",
    });
    if (!confirmed) return;
    await deleteCreditCardPurchase(purchase.id, { deleteAllInstallments: true });
    await loadCards(cardFilter);
  }

  async function confirmPurchaseDelete() {
    if (!deletingPurchase) return;
    setSaving(true);
    try {
      await deleteCreditCardPurchase(deletingPurchase.id, {
        deleteAllInstallments,
        installmentNumber: deletingPurchase.installmentNumber,
        month: selectedDetailMonth,
        year: detailYear,
      });
      setDeletingPurchase(null);
      setDeleteAllInstallments(false);
      await loadCards(cardFilter);
    } finally {
      setSaving(false);
    }
  }

  function startPurchaseEdit(purchase: CreditCardPurchase) {
    setEditingPurchase(purchase);
    setPurchaseForm({
      title: purchase.title,
      description: purchase.description ?? "",
      amount: String(purchase.amount),
      amountMode: "TOTAL",
      purchaseDate: purchase.purchaseDate.slice(0, 10),
      installments: String(purchase.installments),
    });
  }

  return (
    <Stack spacing={3}>
      <Paper className="glass-card" sx={{ p: { xs: 3, md: 4 }, borderRadius: 5 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <CreditCardIcon sx={{ color: financeColors.expense }} />
              <Typography variant="h3" fontWeight={950} letterSpacing="-0.04em">
                Cartoes
              </Typography>
              <PageHelpButton title="Como funciona Cartões?">
                <Typography color="text.secondary">
                  A área de Cartões ajuda a controlar limite, uso mensal, vencimento e compras parceladas de cada cartão.
                </Typography>
                <Typography color="text.secondary">
                  Cadastre um cartão com limite e dia de vencimento. Depois, registre compras detalhadas informando valor, data e número de parcelas.
                </Typography>
                <Typography color="text.secondary">
                  O sistema distribui as parcelas por mês e conecta o valor ao controle financeiro, facilitando a leitura das despesas do cartão.
                </Typography>
              </PageHelpButton>
            </Stack>
            <Typography color="text.secondary" fontSize={17}>
              Acompanhe limite, uso mensal e compras detalhadas por cartao.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateCard} sx={{ alignSelf: { xs: "stretch", md: "center" } }}>
            Adicionar cartao
          </Button>
        </Stack>
      </Paper>

      {loading ? <EmptyState message="Carregando cartoes..." /> : null}
      {error ? <EmptyState message={error} /> : null}

      {!loading && !error ? (
        <Stack spacing={2}>
          <Paper className="soft-card" sx={{ px: 2, borderRadius: 3 }}>
            <Tabs value={cardTab} onChange={(_, value) => setCardTab(value)}>
              <Tab value="ACTIVE" label={`Ativos (${cards.filter((card) => card.isActive).length})`} />
              <Tab value="INACTIVE" label={`Inativos (${cards.filter((card) => !card.isActive).length})`} />
            </Tabs>
          </Paper>
          <Grid container spacing={2}>
          {visibleCards.map((card) => (
            <Grid item xs={12} md={6} xl={4} key={card.id}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                  color: "white",
                  background: `linear-gradient(135deg, ${card.color}, rgba(15,23,42,0.92))`,
                  boxShadow: "0 18px 42px rgba(15,23,42,0.18)",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    width: 180,
                    height: 180,
                    right: -70,
                    top: -80,
                    borderRadius: "50%",
                    border: "28px solid rgba(255,255,255,0.11)",
                  },
                }}
              >
                <Stack spacing={2} height="100%" sx={{ position: "relative", zIndex: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box minWidth={0}>
                      <Typography variant="h6" fontWeight={950} noWrap>
                        {card.name}
                      </Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.74)" }}>Vence dia {card.dueDay}</Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => startCardEdit(card)} sx={{ color: "white", bgcolor: "rgba(255,255,255,0.12)" }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Detalhes">
                        <IconButton size="small" onClick={() => openDetails(card)} sx={{ color: "white", bgcolor: "rgba(255,255,255,0.12)" }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={card.isActive ? "Inativar" : "Reativar"}>
                        <IconButton size="small" onClick={() => toggleCardActive(card)} sx={{ color: "white", bgcolor: "rgba(255,255,255,0.12)" }}>
                          {card.isActive ? <VisibilityOffIcon fontSize="small" /> : <RestoreIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Typography sx={{ color: "rgba(255,255,255,0.74)" }} textTransform="capitalize">{months[currentMonth - 1]}</Typography>
                      <Typography fontWeight={950}>{formatMoney(card.statementAmount)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Typography sx={{ color: "rgba(255,255,255,0.74)" }}>Limite usado</Typography>
                      <Typography fontWeight={850}>{usageText(card)}</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={card.usedPercent ?? 0}
                      sx={{
                        mt: 1,
                        height: 9,
                        borderRadius: 99,
                        bgcolor: "rgba(255,255,255,0.18)",
                        "& .MuiLinearProgress-bar": { bgcolor: "white" },
                      }}
                    />
                  </Box>

                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Typography sx={{ color: "rgba(255,255,255,0.74)" }}>Total no ano</Typography>
                    <Typography fontWeight={900}>{formatMoney(card.yearStatementAmount)}</Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          ))}
          {!visibleCards.length ? (
            <Grid item xs={12}>
              <EmptyState message={cardTab === "ACTIVE" ? "Nenhum cartao ativo cadastrado." : "Nenhum cartao inativo."} />
            </Grid>
          ) : null}
          </Grid>
        </Stack>
      ) : null}

      <AppDialog
        open={cardModalOpen}
        onClose={resetCardForm}
        title={editingCard ? "Editar cartao" : "Adicionar cartao"}
        eyebrow="Cartao de credito"
        actions={
          <>
            <Button onClick={resetCardForm}>Cancelar</Button>
            <Button type="submit" form="credit-card-form" variant="contained" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
        <Stack component="form" id="credit-card-form" spacing={2} onSubmit={saveCard}>
          <TextField label="Nome ou apelido" value={cardForm.name} onChange={(event) => setCardForm({ ...cardForm, name: event.target.value })} required />
          <TextField label="Vencimento mensal" type="number" value={cardForm.dueDay} onChange={(event) => setCardForm({ ...cardForm, dueDay: event.target.value })} inputProps={{ min: 1, max: 31 }} required />
          <TextField label="Limite do cartao" type="number" value={cardForm.creditLimit} onChange={(event) => setCardForm({ ...cardForm, creditLimit: event.target.value })} inputProps={{ min: 0, step: 0.01 }} helperText="Opcional" />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Cor do cartao"
              type="color"
              value={cardForm.color}
              onChange={(event) => setCardForm({ ...cardForm, color: event.target.value.toUpperCase() })}
              sx={{ minWidth: 140 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Hexadecimal"
              value={cardForm.color}
              error={Boolean(cardForm.color) && !isValidHexColor(cardForm.color)}
              helperText={Boolean(cardForm.color) && !isValidHexColor(cardForm.color) ? "Use #RRGGBB" : " "}
              onChange={(event) => setCardForm({ ...cardForm, color: event.target.value.toUpperCase() })}
              fullWidth
            />
          </Stack>
        </Stack>
      </AppDialog>

      <Dialog
        open={detailOpen}
        onClose={closeDetails}
        fullWidth
        maxWidth="xl"
        PaperProps={{ sx: { height: "90vh", borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Box minWidth={0}>
              <Typography variant="h5" fontWeight={950} noWrap>
                {selectedCard?.name ?? "Detalhes do cartao"}
              </Typography>
              <Typography color="text.secondary">
                {selectedCard ? `Vencimento dia ${selectedCard.dueDay} · ${usageText(selectedCard)}` : ""}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField select size="small" label="Mes" value={selectedDetailMonth} onChange={(event) => setSelectedDetailMonth(Number(event.target.value))}>
                {months.map((label, index) => (
                  <MenuItem key={label} value={index + 1}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField select size="small" label="Ano" value={detailYear} onChange={(event) => setDetailYear(Number(event.target.value))}>
                {yearOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <IconButton onClick={closeDetails}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "#F8FAFC" }}>
          {selectedCard ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5} mb={1.5}>
                    <Typography fontWeight={950}>Comparativo mensal</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <IconButton size="small" onClick={() => setDetailYear((value) => value - 1)}>
                        <ChevronLeftIcon fontSize="small" />
                      </IconButton>
                      <Typography fontWeight={950} sx={{ minWidth: 48, textAlign: "center" }}>
                        {detailYear}
                      </Typography>
                      <IconButton size="small" onClick={() => setDetailYear((value) => value + 1)}>
                        <ChevronRightIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
                      alignItems: "end",
                      gap: { xs: 0.5, md: 1 },
                      minHeight: 190,
                      pb: 0.5,
                      width: "100%",
                    }}
                  >
                    {selectedCard.monthlySummary.map((summary) => (
                      <Box
                        key={summary.month}
                        onClick={() => setSelectedDetailMonth(summary.month)}
                        sx={{
                          display: "grid",
                          gridTemplateRows: "112px auto auto",
                          justifyItems: "center",
                          gap: 0.6,
                          minWidth: 0,
                          cursor: "pointer",
                          borderRadius: 2,
                          px: { xs: 0.25, md: 0.5 },
                          py: 1,
                          bgcolor: selectedDetailMonth === summary.month ? "rgba(234,88,12,0.08)" : "transparent",
                          border: selectedDetailMonth === summary.month ? "1px solid rgba(234,88,12,0.18)" : "1px solid transparent",
                        }}
                      >
                        <Box
                          sx={{
                            height: 112,
                            width: { xs: 12, sm: 16, md: 18 },
                            borderRadius: 99,
                            bgcolor: "rgba(15,23,42,0.08)",
                            display: "flex",
                            alignItems: "flex-end",
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              width: "100%",
                              height: `${Math.max(3, (summary.statementAmount / maxMonthlyAmount) * 100)}%`,
                              borderRadius: 99,
                              bgcolor:
                                summary.month === currentMonth && detailYear === currentYear
                                  ? financeColors.expense
                                  : "#0F766E",
                              transition: "height 180ms ease",
                            }}
                          />
                        </Box>
                        <Typography variant="caption" fontWeight={900} textTransform="capitalize" textAlign="center" noWrap>
                          {summary.label.replace(".", "")}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          textAlign="center"
                          noWrap
                          sx={{ maxWidth: "100%", fontSize: { xs: 9, sm: 10, md: 11 } }}
                        >
                          {formatMoney(summary.statementAmount)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} lg={5}>
                <Stack spacing={2}>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography fontWeight={950} mb={1.5}>
                      {editingPurchase ? "Editar despesa" : "Adicionar despesa detalhada"}
                    </Typography>
                    <Grid component="form" id="credit-card-purchase-form" container spacing={1.5} onSubmit={savePurchase}>
                      <Grid item xs={12}>
                        <ToggleButtonGroup
                          exclusive
                          size="small"
                          value={purchaseForm.amountMode}
                          onChange={(_, value) => value && setPurchaseForm({ ...purchaseForm, amountMode: value })}
                        >
                          <ToggleButton value="TOTAL">Sei o valor total</ToggleButton>
                          <ToggleButton value="INSTALLMENT">Sei o valor da parcela</ToggleButton>
                        </ToggleButtonGroup>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Nome da despesa" value={purchaseForm.title} onChange={(event) => setPurchaseForm({ ...purchaseForm, title: event.target.value })} required />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={purchaseForm.amountMode === "TOTAL" ? "Valor total" : "Valor da parcela"}
                          type="number"
                          value={purchaseForm.amount}
                          onChange={(event) => setPurchaseForm({ ...purchaseForm, amount: event.target.value })}
                          inputProps={{ min: 0, step: 0.01 }}
                          required
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField fullWidth label="Parcelas" type="number" value={purchaseForm.installments} onChange={(event) => setPurchaseForm({ ...purchaseForm, installments: event.target.value })} inputProps={{ min: 1, max: 240 }} required />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField fullWidth label="Data" type="date" value={purchaseForm.purchaseDate} onChange={(event) => setPurchaseForm({ ...purchaseForm, purchaseDate: event.target.value })} InputLabelProps={{ shrink: true }} required />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth label="Observacao" value={purchaseForm.description} onChange={(event) => setPurchaseForm({ ...purchaseForm, description: event.target.value })} />
                      </Grid>
                      <Grid item xs={12}>
                        <Stack direction="row" spacing={1}>
                          <Button type="submit" variant="contained" disabled={saving}>
                            {editingPurchase ? "Salvar despesa" : "Adicionar despesa"}
                          </Button>
                          {editingPurchase ? <Button onClick={resetPurchaseForm}>Cancelar</Button> : null}
                        </Stack>
                      </Grid>
                    </Grid>
                  </Paper>

                </Stack>
              </Grid>

              <Grid item xs={12} lg={7}>
                <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
                  <Box p={2} pb={0}>
                    <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" spacing={1}>
                      <Typography fontWeight={950} textTransform="capitalize">
                        Despesas de {months[selectedDetailMonth - 1]} de {detailYear}
                      </Typography>
                      <Typography color="text.secondary">
                        Total {formatMoney(selectedMonthSummary?.statementAmount ?? 0)}
                      </Typography>
                    </Stack>
                  </Box>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Despesa</TableCell>
                        <TableCell>Data</TableCell>
                        <TableCell>Parcela</TableCell>
                        <TableCell align="right">Valor no mes</TableCell>
                        <TableCell align="right">Acoes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedMonthSummary ? [
                        ...selectedMonthSummary.purchases.map((purchase) => (
                          <TableRow key={`${selectedMonthSummary.month}:${purchase.id}`} hover>
                            <TableCell>
                              <Typography fontWeight={850}>{purchase.title}</Typography>
                              {purchase.description ? <Typography variant="caption" color="text.secondary">{purchase.description}</Typography> : null}
                            </TableCell>
                            <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                            <TableCell>{purchase.installmentNumber}/{purchase.installments}</TableCell>
                            <TableCell align="right">{formatMoney(purchase.installmentAmount ?? 0)}</TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => startPurchaseEdit(purchase)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => removePurchase(purchase)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )),
                        ...(selectedMonthSummary.otherAmount > 0
                          ? [
                          <TableRow key={`${selectedMonthSummary.month}:others`}>
                            <TableCell sx={{ fontWeight: 850 }}>Outros</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell align="right">{formatMoney(selectedMonthSummary.otherAmount)}</TableCell>
                            <TableCell />
                          </TableRow>,
                          ]
                          : []),
                      ] : null}
                      {!selectedMonthSummary || (!selectedMonthSummary.purchases.length && selectedMonthSummary.otherAmount <= 0) ? (
                        <TableRow>
                          <TableCell colSpan={5} sx={{ color: "text.secondary", fontStyle: "italic" }}>
                            Nenhuma despesa detalhada neste mes.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <EmptyState message="Selecione um cartao para ver os detalhes." />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails}>Fechar</Button>
        </DialogActions>
      </Dialog>
      <AppDialog
        open={Boolean(deletingPurchase)}
        onClose={() => {
          setDeletingPurchase(null);
          setDeleteAllInstallments(false);
        }}
        title="Excluir despesa"
        eyebrow="Cartao de credito"
        actions={
          <>
            <Button
              onClick={() => {
                setDeletingPurchase(null);
                setDeleteAllInstallments(false);
              }}
            >
              Cancelar
            </Button>
            <Button color="error" variant="contained" onClick={confirmPurchaseDelete} disabled={saving}>
              Excluir
            </Button>
          </>
        }
      >
        <Stack spacing={1.5}>
          <Typography color="text.secondary">
            Deseja excluir "{deletingPurchase?.title}" deste mes?
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={deleteAllInstallments}
                onChange={(event) => setDeleteAllInstallments(event.target.checked)}
              />
            }
            label="Excluir tambem dos demais meses"
          />
        </Stack>
      </AppDialog>
      {dialog}
    </Stack>
  );
}
