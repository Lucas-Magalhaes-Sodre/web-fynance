import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createFinancialCategory,
  deleteFinancialCategory,
  listFinancialCategories,
  updateFinancialCategory,
} from "@/services/financialControl";
import { useConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { EmptyState } from "@/components/atoms/EmptyState";
import { PageHelpButton } from "@/components/molecules/PageHelpButton";
import {
  CategoryFormDialog,
  type CategoryFormState,
} from "@/components/organisms/categories/CategoryFormDialog";
import type { FinancialCategory, FinancialCategoryType } from "@/interfaces/financial";

const emptyForm: CategoryFormState = {
  name: "",
  type: "EXPENSE",
  color: "#EA580C",
};

const categoryTypeLabels: Record<FinancialCategoryType, string> = {
  INCOME: "Receita",
  EXPENSE: "Despesa",
  INVESTMENT: "Economia",
};

function CategoriesSkeleton() {
  return (
    <Paper className="soft-card" sx={{ p: 2, borderRadius: 4 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
          <Skeleton variant="rounded" width={180} height={48} />
          <Skeleton variant="rounded" width={220} height={40} />
        </Stack>
        {[0, 1, 2, 3, 4].map((item) => (
          <Skeleton key={item} variant="rounded" height={44} />
        ))}
      </Stack>
    </Paper>
  );
}

function isProtectedSavingsCategory(category: FinancialCategory) {
  const normalizedName = normalizeCategoryName(category.name);
  return (
    (category.type === "INCOME" && normalizedName === "economias") ||
    (category.type === "EXPENSE" && (normalizedName === "cartao de credito" || normalizedName === "cartoes de credito")) ||
    category.isSystem ||
    category.canDelete === false
  );
}

function isValidHex(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function normalizeCategoryName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function FinancialCategoriesPage() {
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editing, setEditing] = useState<FinancialCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<FinancialCategoryType | "ALL">("ALL");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { confirm, dialog } = useConfirmDialog();

  const visibleCategories = useMemo(
    () => categories.filter((category) => filter === "ALL" || category.type === filter),
    [categories, filter],
  );

  function hasDuplicateName(type: FinancialCategoryType, name: string, ignoreId?: string) {
    const normalizedName = normalizeCategoryName(name);
    return categories.some(
      (category) =>
        category.type === type &&
        category.id !== ignoreId &&
        normalizeCategoryName(category.name) === normalizedName,
    );
  }

  const formDuplicate = Boolean(form.name.trim()) && hasDuplicateName(form.type, form.name);
  const editDuplicate = Boolean(editForm.name.trim()) && hasDuplicateName(editForm.type, editForm.name, editing?.id);

  async function loadCategories() {
    setLoading(true);
    setError("");
    try {
      setCategories(await listFinancialCategories());
    } catch {
      setError("Não foi possível carregar as categorias.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function startEdit(category: FinancialCategory) {
    setEditing(category);
    setEditForm({
      name: category.name,
      type: category.type,
      color: category.color,
    });
  }

  function resetForm(type = form.type) {
    setForm({
      ...emptyForm,
      type,
      color: type === "INCOME" ? "#2563EB" : type === "INVESTMENT" ? "#D4A017" : "#EA580C",
    });
  }

  function openCreate() {
    resetForm(filter !== "ALL" ? filter : "EXPENSE");
    setCreating(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !isValidHex(form.color) || formDuplicate) return;
    setSaving(true);
    try {
      await createFinancialCategory(form);
      resetForm(form.type);
      setCreating(false);
      await loadCategories();
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!editing || !editForm.name.trim() || !isValidHex(editForm.color) || editDuplicate) return;
    setSaving(true);
    try {
      await updateFinancialCategory(editing.id, editForm);
      setEditing(null);
      await loadCategories();
    } finally {
      setSaving(false);
    }
  }

  async function removeCategory(category: FinancialCategory) {
    const confirmed = await confirm({
      title: "Excluir categoria",
      description: `Deseja excluir a categoria "${category.name}"? Os lançamentos já cadastrados continuam com este nome, mas a categoria sai das configurações.`,
      confirmLabel: "Excluir",
      tone: "danger",
    });
    if (!confirmed) return;
    await deleteFinancialCategory(category.id);
    if (editing?.id === category.id) setEditing(null);
    await loadCategories();
  }

  return (
    <Stack spacing={3}>
      <Paper className="glass-card" sx={{ p: { xs: 3, md: 4 }, borderRadius: 5 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h3" fontWeight={950} letterSpacing="-0.04em">
              Configurações
            </Typography>
            <Typography color="text.secondary" fontSize={17}>
              Ajuste preferências e cadastros auxiliares do sistema.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ alignSelf: { xs: "stretch", md: "center" } }}>
            Adicionar categoria
          </Button>
        </Stack>
      </Paper>

      {loading ? <CategoriesSkeleton /> : null}
      {error ? <EmptyState message={error} /> : null}

      {!loading && !error ? (
        <Paper className="soft-card" sx={{ borderRadius: 4, overflow: "hidden" }}>
          <Box px={2} pt={2}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
              <Tabs value="categories">
                <Tab value="categories" label="Categorias" />
              </Tabs>
              <PageHelpButton title="O que são categorias?" label="O que são categorias?">
                <Typography color="text.secondary">
                  Categorias são grupos usados para organizar receitas, despesas e economias. Elas ajudam o sistema a separar seus lançamentos por assunto, como salário, moradia, cartão de crédito, poupança ou caixinha.
                </Typography>
                <Typography color="text.secondary">
                  Elas aparecem nos formulários de cadastro, nos filtros, nos resumos, nos gráficos e na planilha do controle financeiro. A cor escolhida também ajuda a identificar visualmente cada grupo.
                </Typography>
                <Typography fontWeight={950}>Como usar</Typography>
                <Typography color="text.secondary">
                  Clique em “Adicionar categoria”, escolha se ela pertence a receitas, despesas ou economias, informe um nome e selecione uma cor. Depois, essa categoria ficará disponível nos cadastros correspondentes.
                </Typography>
                <Typography color="text.secondary">
                  Algumas categorias do sistema são obrigatórias e não podem ser excluídas, porque são usadas em fluxos automáticos, como economias e cartão de crédito.
                </Typography>
              </PageHelpButton>
            </Stack>
          </Box>
          <Box p={2} display="flex" justifyContent="flex-end">
            <ToggleButtonGroup
              exclusive
              size="small"
              value={filter}
              onChange={(_, value) => value && setFilter(value)}
            >
              <ToggleButton value="ALL">Todas</ToggleButton>
              <ToggleButton value="INCOME">Receitas</ToggleButton>
              <ToggleButton value="EXPENSE">Despesas</ToggleButton>
              <ToggleButton value="INVESTMENT">Economias</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Categoria</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Cor</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleCategories.map((category) => (
                <TableRow key={category.id} hover>
                  <TableCell sx={{ fontWeight: 900 }}>{category.name}</TableCell>
                  <TableCell>{categoryTypeLabels[category.type]}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box width={22} height={22} borderRadius={1} sx={{ bgcolor: category.color, border: "1px solid rgba(15,23,42,0.16)" }} />
                      <Typography variant="body2" fontFamily="monospace">
                        {category.color}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={isProtectedSavingsCategory(category) ? "Editar cor" : "Editar"}>
                      <span>
                      <IconButton onClick={() => startEdit(category)}>
                        <EditIcon />
                      </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={isProtectedSavingsCategory(category) ? "Categoria obrigatoria" : "Excluir"}>
                      <span>
                      <IconButton disabled={isProtectedSavingsCategory(category)} color="error" onClick={() => removeCategory(category)}>
                        <DeleteIcon />
                      </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!visibleCategories.length ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ color: "text.secondary", fontStyle: "italic" }}>
                    Nenhuma categoria cadastrada para este tipo.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Paper>
      ) : null}

      <CategoryFormDialog
        open={creating}
        mode="create"
        form={form}
        duplicate={formDuplicate}
        saving={saving}
        isValidColor={isValidHex(form.color)}
        onClose={() => setCreating(false)}
        onSubmit={handleSubmit}
        onFormChange={setForm}
        onTypeChange={resetForm}
      />

      <CategoryFormDialog
        open={Boolean(editing)}
        mode="edit"
        form={editForm}
        duplicate={editDuplicate}
        saving={saving}
        isValidColor={isValidHex(editForm.color)}
        onClose={() => setEditing(null)}
        onSubmit={handleEditSubmit}
        onFormChange={setEditForm}
        lockIdentity={Boolean(editing && isProtectedSavingsCategory(editing))}
      />
      {dialog}
    </Stack>
  );
}
