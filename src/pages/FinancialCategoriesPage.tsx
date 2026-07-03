import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
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

function isProtectedSavingsCategory(category: FinancialCategory) {
  return category.type === "INCOME" && category.name.trim().toLocaleLowerCase("pt-BR") === "economias";
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
      setError("Nao foi possivel carregar as categorias.");
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
      description: `Deseja excluir a categoria "${category.name}"? Os lancamentos ja cadastrados continuam com este nome, mas a categoria sai das configuracoes.`,
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
              Categorias
            </Typography>
            <Typography color="text.secondary" fontSize={17}>
              Organize os grupos usados nos lancamentos e escolha a cor das bordas na planilha.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ alignSelf: { xs: "stretch", md: "center" } }}>
            Adicionar categoria
          </Button>
        </Stack>
      </Paper>

      {loading ? <EmptyState message="Carregando categorias..." /> : null}
      {error ? <EmptyState message={error} /> : null}

      {!loading && !error ? (
        <Paper className="soft-card" sx={{ borderRadius: 4, overflow: "hidden" }}>
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
                <TableCell align="right">Acoes</TableCell>
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
                    <Tooltip title={isProtectedSavingsCategory(category) ? "Categoria obrigatoria" : "Editar"}>
                      <span>
                      <IconButton disabled={isProtectedSavingsCategory(category)} onClick={() => startEdit(category)}>
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
      />
      {dialog}
    </Stack>
  );
}
