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
import { LoadingActionButton } from "@/components/molecules/LoadingActionButton";
import { usePreferences } from "@/contexts/PreferencesContext";

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
  lockIdentity?: boolean;
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
  lockIdentity = false,
}: CategoryFormDialogProps) {
  const { t } = usePreferences();
  const formId = mode === "create" ? "category-create-form" : "category-edit-form";
  const actionLabel = mode === "create" ? t("add") : t("save");
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
          ? t("newSetting")
          : form.type === "INCOME"
            ? t("income")
            : form.type === "INVESTMENT"
              ? t("savings")
              : t("expense")
      }
      title={mode === "create" ? t("addCategory") : t("editCategory")}
      actions={
        <>
          <Button onClick={onClose}>{t("cancel")}</Button>
          <LoadingActionButton
            type="submit"
            form={formId}
            variant="contained"
            startIcon={<Icon />}
            disabled={!form.name.trim() || !isValidColor || duplicate}
            loading={saving}
            loadingLabel={t("saving")}
          >
            {actionLabel}
          </LoadingActionButton>
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
          label={t("recordType")}
          value={form.type}
          disabled={lockIdentity}
          onChange={(event) => {
            const type = event.target.value as FinancialCategoryType;
            if (onTypeChange) onTypeChange(type);
            else updateForm({ type });
          }}
        >
          <MenuItem value="EXPENSE">{t("expense")}</MenuItem>
          <MenuItem value="INCOME">{t("income")}</MenuItem>
          <MenuItem value="INVESTMENT">{t("savings")}</MenuItem>
        </TextField>
        <TextField
          autoFocus
          label={t("categoryName")}
          required
          value={form.name}
          disabled={lockIdentity}
          error={duplicate}
          helperText={
            lockIdentity
              ? t("mandatoryCategoryColorOnly")
              : duplicate
              ? t("duplicateCategory")
              : " "
          }
          onChange={(event) => updateForm({ name: event.target.value })}
        />
        <S.ColorFieldStack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <S.ColorTextField
            label={t("color")}
            type="color"
            value={isValidColor ? form.color : "#64748B"}
            onChange={(event) =>
              updateForm({ color: event.target.value.toUpperCase() })
            }
          />
          <TextField
            label={t("hex")}
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
