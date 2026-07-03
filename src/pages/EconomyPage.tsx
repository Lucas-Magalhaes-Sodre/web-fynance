import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import {
  createSaving,
  deleteSaving,
  getSavingsOverview,
  listFinancialCategories,
  listFinancialGoals,
  listSavings,
  transferSaving,
  updateSaving,
  type SavingPayload,
} from "@/services/financialControl";
import { useConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { EmptyState } from "@/components/atoms/EmptyState";
import {
  SavingMovementDialog,
  type SavingAction,
  type SavingMovementFormState,
} from "@/modules/financial-control/components/SavingMovementDialog";
import { EconomyBalancePanel } from "@/components/organisms/economy/EconomyBalancePanel";
import { EconomyCategoryBoxes } from "@/components/organisms/economy/EconomyCategoryBoxes";
import { EconomyExtractDialog } from "@/components/organisms/economy/EconomyExtractDialog";
import { EconomyHero } from "@/components/organisms/economy/EconomyHero";
import { EconomyOpportunityAlert } from "@/components/organisms/economy/EconomyOpportunityAlert";
import { EconomyProjectionDialog } from "@/components/organisms/economy/EconomyProjectionDialog";
import { EconomyTable } from "@/components/organisms/economy/EconomyTable";
import { AppDialog } from "@/components/molecules/AppDialog";
import type {
  FinancialCategory,
  FinancialGoal,
  Saving,
  SavingsExtractMode,
  SavingsOverview,
} from "@/interfaces/financial";
import { financeColors, formatMoney, isoDate } from "@/utils/format";
import { dateForMonthlyOccurrence } from "@/modules/financial-control/components/helpers";

const today = new Date();

const initialForm: SavingMovementFormState = {
  action: "REGISTER",
  title: "",
  category: "",
  description: "",
  amount: "",
  date: isoDate(),
  dueDay: String(today.getDate()),
  isFixed: false,
  recurrenceType: "NONE",
  recurrenceStartMonth: String(today.getMonth() + 1),
  recurrenceStartYear: String(today.getFullYear()),
  recurrenceEndMonth: "12",
  recurrenceEndYear: String(today.getFullYear()),
  goalId: "",
};

function toPayload(form: SavingMovementFormState): SavingPayload {
  const date = new Date(`${form.date}T00:00:00`);
  const selectedDay = form.dueDay ? Number(form.dueDay) : date.getDate();
  const recurringDate =
    form.isFixed && form.recurrenceType === "MONTHLY"
      ? dateForMonthlyOccurrence(
          Number(form.recurrenceStartYear),
          Number(form.recurrenceStartMonth),
          selectedDay,
        )
      : form.date;
  const payloadDate = new Date(`${recurringDate}T00:00:00`);
  return {
    title: form.title.trim(),
    category: form.category.trim(),
    description: form.description.trim() || null,
    amount: Number(form.amount),
    date: recurringDate,
    month: payloadDate.getMonth() + 1,
    year: payloadDate.getFullYear(),
    isFixed: form.isFixed,
    recurrenceType: form.isFixed ? form.recurrenceType : "NONE",
    recurrenceGeneration:
      form.isFixed && form.recurrenceType === "MONTHLY"
        ? {
            mode: "CUSTOM",
            startMonth: Number(form.recurrenceStartMonth),
            startYear: Number(form.recurrenceStartYear),
            endMonth: Number(form.recurrenceEndMonth),
            endYear: Number(form.recurrenceEndYear),
          }
        : undefined,
    goalId: form.goalId || null,
  };
}

function isCurrentSaving(saving: Saving) {
  return new Date(saving.date) <= new Date();
}

export function EconomyPage() {
  const [overview, setOverview] = useState<SavingsOverview | null>(null);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [extractOpen, setExtractOpen] = useState(false);
  const [extractInitialMode, setExtractInitialMode] = useState<SavingsExtractMode>("current");
  const [projectionOpen, setProjectionOpen] = useState(false);
  const [savingForm, setSavingForm] = useState(false);
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
  const [form, setForm] = useState<SavingMovementFormState>(initialForm);

  const availableSavings = useMemo(() => {
    return (overview?.categories ?? []).flatMap((category) =>
      category.items
        .filter((item) => item.currentSavedBalance > 0)
        .map(
          (item): Saving => ({
            id: item.id,
            userId: "",
            title: item.name,
            category: category.name,
            description: null,
            amount: item.currentSavedBalance,
            date: isoDate(),
            month: today.getMonth() + 1,
            year: today.getFullYear(),
            isFixed: false,
            recurrenceType: "NONE",
            recurrenceGroupId: null,
            goalId: null,
            createdAt: isoDate(),
            updatedAt: isoDate(),
          }),
        ),
    );
  }, [overview]);

  const currentSavings = useMemo(
    () =>
      savings
        .filter((saving) => saving.amount > 0 && isCurrentSaving(saving))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [savings],
  );

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [nextOverview, nextSavings] = await Promise.all([
        getSavingsOverview(),
        listSavings(),
      ]);
      setOverview(nextOverview);
      setSavings(nextSavings);
    } catch {
      setError("Nao foi possivel carregar suas economias.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    listFinancialGoals()
      .then(setGoals)
      .catch(() => setGoals([]));
    listFinancialCategories({ type: "INVESTMENT" })
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  function openCreate(action: SavingAction = "REGISTER") {
    setEditingSaving(null);
    const firstBalance = availableSavings[0];
    setForm({
      ...initialForm,
      action,
      category:
        action === "WITHDRAW_TO_BALANCE"
          ? firstBalance?.category ?? ""
          : categories[0]?.name ?? "Outros",
      title: action === "WITHDRAW_TO_BALANCE" ? firstBalance?.title ?? "" : "",
      date: isoDate(),
      dueDay: String(new Date().getDate()),
      recurrenceStartMonth: String(new Date().getMonth() + 1),
      recurrenceStartYear: String(new Date().getFullYear()),
      recurrenceEndYear: String(new Date().getFullYear()),
      isFixed: false,
      recurrenceType: "NONE",
      goalId: "",
    });
    setFormOpen(true);
  }

  function openEdit(saving: Saving) {
    setEditingSaving(saving);
    setForm({
      title: saving.title,
      action: "REGISTER",
      category: saving.category,
      description: saving.description ?? "",
      amount: String(saving.amount),
      date: saving.date.slice(0, 10),
      dueDay: String(new Date(saving.date).getDate()),
      isFixed: saving.isFixed,
      recurrenceType: saving.recurrenceType,
      recurrenceStartMonth: String(saving.month),
      recurrenceStartYear: String(saving.year),
      recurrenceEndMonth: String(saving.month),
      recurrenceEndYear: String(saving.year),
      goalId: saving.goalId ?? "",
    });
    setFormOpen(true);
  }

  async function saveSaving() {
    const payload = toPayload(form);
    if (!payload.title || payload.amount <= 0 || Number.isNaN(payload.amount))
      return;

    setSavingForm(true);
    try {
      if (form.action === "WITHDRAW_TO_BALANCE") {
        const currentDate = new Date();
        await transferSaving({
          title: payload.title,
          category: payload.category,
          description: payload.description,
          amount: payload.amount,
          date: payload.date,
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
          direction: "WITHDRAW_TO_BALANCE",
          goalId: null,
        });
        setNotice("Economia sacada com sucesso.");
      } else if (editingSaving) {
        await updateSaving(editingSaving.id, payload);
        setNotice("Economia atualizada com sucesso.");
      } else {
        await createSaving(payload);
        setNotice("Economia adicionada com sucesso.");
      }

      setFormOpen(false);
      await loadData();
    } catch {
      setError("Nao foi possivel salvar a economia.");
    } finally {
      setSavingForm(false);
    }
  }

  async function removeSaving(saving: Saving) {
    const confirmed = await confirm({
      title: "Excluir economia",
      description: `Deseja excluir a economia "${saving.title}"? Esta acao nao pode ser desfeita.`,
      confirmLabel: "Excluir",
      tone: "danger",
    });
    if (!confirmed) return;
    await deleteSaving(saving.id);
    setNotice("Economia excluida com sucesso.");
    await loadData();
  }

  return (
    <Stack spacing={3}>
      <EconomyHero
        onCreate={() => openCreate("REGISTER")}
        onWithdraw={() => openCreate("WITHDRAW_TO_BALANCE")}
        onOpenFuture={() => {
          setExtractInitialMode("future");
          setExtractOpen(true);
        }}
      />

      {loading ? (
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={82} />
          <Skeleton variant="rounded" height={220} />
          <Skeleton variant="rounded" height={180} />
        </Stack>
      ) : null}
      {error ? <EmptyState message={error} /> : null}

      {!loading && !error && overview ? (
        <>
          <EconomyOpportunityAlert onClick={() => setSuggestionOpen(true)} />
          <EconomyBalancePanel
            balance={overview.currentSavedBalance}
            onOpenExtract={() => {
              setExtractInitialMode("current");
              setExtractOpen(true);
            }}
            onOpenProjection={() => setProjectionOpen(true)}
          />
          <EconomyCategoryBoxes categories={overview.categories} />
          <Stack spacing={1}>
            <Typography variant="h5" fontWeight={950}>
              Economias registradas
            </Typography>
            <EconomyTable
              savings={currentSavings}
              goals={goals}
              onEdit={openEdit}
              onDelete={removeSaving}
            />
          </Stack>
        </>
      ) : null}

      <SavingMovementDialog
        open={formOpen}
        form={form}
        goals={goals}
        categories={categories}
        availableSavings={availableSavings}
        saving={savingForm}
        onClose={() => setFormOpen(false)}
        onSave={saveSaving}
        onFormChange={setForm}
      />
      <AppDialog
        open={suggestionOpen}
        onClose={() => setSuggestionOpen(false)}
        title="💰 Oportunidade de economia do mes"
        titleAccent={financeColors.saving}
        actions={<Button onClick={() => setSuggestionOpen(false)}>Entendi</Button>}
      >
        <Stack spacing={2}>
          <Typography color="text.secondary">
            Com base nas suas receitas, despesas e economias ja registradas,
            voce ainda possui uma excelente oportunidade para fortalecer sua
            vida financeira neste mes.
          </Typography>
          <Typography color="text.secondary">
            Guardar uma parte do que sobra e um dos habitos mais importantes
            para construir uma reserva de emergencia, alcancar objetivos e
            transformar seu saldo em patrimonio para o futuro.
          </Typography>
          <Typography color="text.secondary" fontWeight={900}>
            Valor disponivel para guardar:
          </Typography>
          <Typography variant="h4" fontWeight={950} color={financeColors.saving}>
            {formatMoney(overview?.monthlySavingsOpportunity ?? 0)}
          </Typography>
          <Typography color="text.secondary">
            💡 Voce nao precisa guardar tudo. O mais importante e criar
            consistencia. Mesmo pequenas quantias, quando guardadas
            regularmente, podem gerar grandes resultados ao longo do tempo.
          </Typography>
        </Stack>
      </AppDialog>
      <EconomyExtractDialog
        open={extractOpen}
        initialMode={extractInitialMode}
        onClose={() => setExtractOpen(false)}
      />
      <EconomyProjectionDialog open={projectionOpen} onClose={() => setProjectionOpen(false)} />
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3200}
        onClose={() => setNotice("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setNotice("")}>
          {notice}
        </Alert>
      </Snackbar>
      {confirmDialog}
    </Stack>
  );
}
