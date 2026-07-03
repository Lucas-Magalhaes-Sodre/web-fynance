import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { FormEvent } from "react";
import type { FinancialCategoryType } from "@/interfaces/financial";
import {
  AppDialog,
  AppDialogStyles as S,
} from "@/components/molecules/AppDialog";

export type CategoryFormState = {
  name: string;
  type: FinancialCategoryType;
  color: string;
};

type CategoryFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  form: CategoryFormState;
  duplicate: boolean;
  saving: boolean;
  isValidColor: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  onFormChange: (form: CategoryFormState) => void;
  onTypeChange?: (type: FinancialCategoryType) => void;
};

export function CategoryFormDialog({
  open,
  mode,
  form,
  duplicate,
  saving,
  isValidColor,
  onClose,
  onSubmit,
  onFormChange,
  onTypeChange,
}: CategoryFormDialogProps) {
  const formId = mode === "create" ? "category-create-form" : "category-edit-form";
  const actionLabel = mode === "create" ? "Adicionar" : "Salvar";
  const Icon = mode === "create" ? AddIcon : SaveIcon;

  function updateForm(nextForm: Partial<CategoryFormState>) {
    onFormChange({ ...form, ...nextForm });
  }

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      eyebrow={
        mode === "create"
          ? "Nova configuracao"
          : form.type === "INCOME"
            ? "Receita"
            : form.type === "INVESTMENT"
              ? "Economia"
              : "Despesa"
      }
      title={mode === "create" ? "Adicionar categoria" : "Editar categoria"}
      actions={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="submit"
            form={formId}
            variant="contained"
            startIcon={<Icon />}
            disabled={saving || !form.name.trim() || !isValidColor || duplicate}
          >
            {saving ? "Salvando..." : actionLabel}
          </Button>
        </>
      }
    >
      <S.FormStack
        component="form"
        id={formId}
        spacing={2}
        onSubmit={onSubmit}
      >
        <TextField
          select
          label="Tipo"
          value={form.type}
          onChange={(event) => {
            const type = event.target.value as FinancialCategoryType;
            if (onTypeChange) onTypeChange(type);
            else updateForm({ type });
          }}
        >
          <MenuItem value="EXPENSE">Despesa</MenuItem>
          <MenuItem value="INCOME">Receita</MenuItem>
          <MenuItem value="INVESTMENT">Economia</MenuItem>
        </TextField>
        <TextField
          autoFocus
          label="Nome da categoria"
          required
          value={form.name}
          error={duplicate}
          helperText={
            duplicate
              ? "Ja existe uma categoria com este nome para este tipo."
              : " "
          }
          onChange={(event) => updateForm({ name: event.target.value })}
        />
        <S.ColorFieldStack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <S.ColorTextField
            label="Cor"
            type="color"
            value={isValidColor ? form.color : "#64748B"}
            onChange={(event) =>
              updateForm({ color: event.target.value.toUpperCase() })
            }
          />
          <TextField
            label="Hexadecimal"
            value={form.color}
            error={Boolean(form.color) && !isValidColor}
            helperText={!isValidColor ? "Use #RRGGBB" : " "}
            onChange={(event) =>
              updateForm({ color: event.target.value.toUpperCase() })
            }
            fullWidth
          />
        </S.ColorFieldStack>
      </S.FormStack>
    </AppDialog>
  );
}
