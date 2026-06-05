import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createFinancialCategory,
  deleteFinancialCategory,
  listFinancialCategories,
  updateFinancialCategory,
} from "../api/financialControl";
import { useConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import type { EntryType, FinancialCategory } from "../types/financial";

const emptyForm = {
  name: "",
  type: "EXPENSE" as EntryType,
  color: "#EA580C",
};

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
  const [filter, setFilter] = useState<EntryType | "ALL">("ALL");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { confirm, dialog } = useConfirmDialog();

  const visibleCategories = useMemo(
    () => categories.filter((category) => filter === "ALL" || category.type === filter),
    [categories, filter],
  );

  function hasDuplicateName(type: EntryType, name: string, ignoreId?: string) {
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
      color: type === "INCOME" ? "#2563EB" : "#EA580C",
    });
  }

  function openCreate() {
    resetForm(filter === "INCOME" || filter === "EXPENSE" ? filter : "EXPENSE");
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
                  <TableCell>{category.type === "INCOME" ? "Receita" : "Despesa"}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box width={22} height={22} borderRadius={1} sx={{ bgcolor: category.color, border: "1px solid rgba(15,23,42,0.16)" }} />
                      <Typography variant="body2" fontFamily="monospace">
                        {category.color}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => startEdit(category)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton color="error" onClick={() => removeCategory(category)}>
                        <DeleteIcon />
                      </IconButton>
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

      <Dialog open={creating} onClose={() => setCreating(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          <Typography variant="overline" color="text.secondary" fontWeight={900}>
            Nova configuracao
          </Typography>
          <Typography variant="h5" fontWeight={950} letterSpacing="-0.03em">
            Adicionar categoria
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack component="form" id="category-create-form" spacing={2} pt={1} onSubmit={handleSubmit}>
            <TextField
              select
              label="Tipo"
              value={form.type}
              onChange={(event) => resetForm(event.target.value as EntryType)}
            >
              <MenuItem value="EXPENSE">Despesa</MenuItem>
              <MenuItem value="INCOME">Receita</MenuItem>
            </TextField>
            <TextField
              autoFocus
              label="Nome da categoria"
              required
              value={form.name}
              error={formDuplicate}
              helperText={formDuplicate ? "Ja existe uma categoria com este nome para este tipo." : " "}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Cor"
                type="color"
                value={isValidHex(form.color) ? form.color : "#64748B"}
                onChange={(event) => setForm((current) => ({ ...current, color: event.target.value.toUpperCase() }))}
                sx={{ width: 120 }}
              />
              <TextField
                label="Hexadecimal"
                value={form.color}
                error={Boolean(form.color) && !isValidHex(form.color)}
                helperText={!isValidHex(form.color) ? "Use #RRGGBB" : " "}
                onChange={(event) => setForm((current) => ({ ...current, color: event.target.value.toUpperCase() }))}
                sx={{ flex: 1 }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreating(false)}>Cancelar</Button>
          <Button
            type="submit"
            form="category-create-form"
            variant="contained"
            startIcon={<AddIcon />}
            disabled={saving || !form.name.trim() || !isValidHex(form.color) || formDuplicate}
          >
            {saving ? "Salvando..." : "Adicionar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          <Typography variant="overline" color="text.secondary" fontWeight={900}>
            {editForm.type === "INCOME" ? "Receita" : "Despesa"}
          </Typography>
          <Typography variant="h5" fontWeight={950} letterSpacing="-0.03em">
            Editar categoria
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack component="form" id="category-edit-form" spacing={2} pt={1} onSubmit={handleEditSubmit}>
            <TextField
              select
              label="Tipo"
              value={editForm.type}
              onChange={(event) => setEditForm((current) => ({ ...current, type: event.target.value as EntryType }))}
            >
              <MenuItem value="EXPENSE">Despesa</MenuItem>
              <MenuItem value="INCOME">Receita</MenuItem>
            </TextField>
            <TextField
              autoFocus
              label="Nome da categoria"
              required
              value={editForm.name}
              error={editDuplicate}
              helperText={editDuplicate ? "Ja existe uma categoria com este nome para este tipo." : " "}
              onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Cor"
                type="color"
                value={isValidHex(editForm.color) ? editForm.color : "#64748B"}
                onChange={(event) => setEditForm((current) => ({ ...current, color: event.target.value.toUpperCase() }))}
                sx={{ width: 120 }}
              />
              <TextField
                label="Hexadecimal"
                value={editForm.color}
                error={Boolean(editForm.color) && !isValidHex(editForm.color)}
                helperText={!isValidHex(editForm.color) ? "Use #RRGGBB" : " "}
                onChange={(event) => setEditForm((current) => ({ ...current, color: event.target.value.toUpperCase() }))}
                sx={{ flex: 1 }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditing(null)}>Cancelar</Button>
          <Button
            type="submit"
            form="category-edit-form"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saving || !editForm.name.trim() || !isValidHex(editForm.color) || editDuplicate}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>
      {dialog}
    </Stack>
  );
}
