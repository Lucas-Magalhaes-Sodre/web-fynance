import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ChangeEvent } from "react";
import type { FinancialGoalStatus } from "@/interfaces/financial";
import { AppDialog, AppDialogStyles as S } from "@/components/molecules/AppDialog";
import { LoadingActionButton } from "@/components/molecules/LoadingActionButton";
import { digitsToCurrency } from "@/utils/format";
import { usePreferences } from "@/contexts/PreferencesContext";

export type GoalFormState = {
  title: string;
  description: string;
  targetAmount: string;
  currentAmount: string;
  startDate: string;
  targetDate: string;
  imageUrl: string;
  imageUrls: string[];
  color: string;
  hasYield: boolean;
  yieldRateMonthly: string;
  status: FinancialGoalStatus;
};

type FinancialGoalFormDialogProps = {
  open: boolean;
  editing: boolean;
  form: GoalFormState;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (form: GoalFormState) => void;
  saving?: boolean;
};

export function FinancialGoalFormDialog({
  open,
  editing,
  form,
  onClose,
  onSave,
  onFormChange,
  saving = false,
}: FinancialGoalFormDialogProps) {
  const { t } = usePreferences();

  function updateForm(nextForm: Partial<GoalFormState>) {
    onFormChange({ ...form, ...nextForm });
  }

  function readPhoto(file: File) {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.readAsDataURL(file);
    });
  }

  async function updatePhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 3 - form.imageUrls.length);
    if (!files.length) return;
    const nextImages = [...form.imageUrls, ...(await Promise.all(files.map(readPhoto)))].slice(0, 3);
    updateForm({ imageUrl: nextImages[0] ?? "", imageUrls: nextImages });
  }

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={editing ? t("edit") : t("newGoal")}
      actions={
        <>
          <Button onClick={onClose}>{t("cancel")}</Button>
          <LoadingActionButton variant="contained" onClick={onSave} loading={saving} loadingLabel={t("saving")}>
            {t("save")}
          </LoadingActionButton>
        </>
      }
    >
      <S.FormStack spacing={2}>
        <TextField
          label={t("title")}
          value={form.title}
          onChange={(event) => updateForm({ title: event.target.value })}
          fullWidth
        />
        <TextField
          label={t("targetValue")}
          value={form.targetAmount}
          onChange={(event) => updateForm({ targetAmount: digitsToCurrency(event.target.value) })}
          fullWidth
        />
        <TextField
          label={t("currentValue")}
          value={form.currentAmount}
          onChange={(event) => updateForm({ currentAmount: digitsToCurrency(event.target.value) })}
          fullWidth
        />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label={t("start")}
              type="date"
              value={form.startDate}
              onChange={(event) => updateForm({ startDate: event.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ "& input": { py: 1.65 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label={t("deadline")}
              type="date"
              value={form.targetDate}
              onChange={(event) => updateForm({ targetDate: event.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ "& input": { py: 1.65 } }}
            />
          </Grid>
        </Grid>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label={t("goalColor")}
            type="color"
            value={form.color}
            onChange={(event) => updateForm({ color: event.target.value.toUpperCase() })}
            sx={{ width: { xs: "100%", sm: 160 } }}
          />
          <Button variant="outlined" component="label" sx={{ minHeight: 56 }}>
            {t("addPhotos")} ({form.imageUrls.length}/3)
            <input hidden accept="image/*" type="file" multiple onChange={updatePhotos} />
          </Button>
          {form.imageUrls.length ? (
            <Button color="error" onClick={() => updateForm({ imageUrl: "", imageUrls: [] })}>
              {t("removePhotos")}
            </Button>
          ) : null}
        </Stack>
        {form.imageUrls.length ? (
          <Stack direction="row" spacing={1}>
            {form.imageUrls.map((image, index) => (
              <Box
                key={`${image.slice(0, 24)}-${index}`}
                sx={{ position: "relative", width: 1 / 3, minWidth: 0 }}
              >
                <Box
                  component="img"
                  src={image}
                  alt={`Preview ${index + 1}`}
                  sx={{ width: "100%", height: 120, borderRadius: 2, objectFit: "cover" }}
                />
                <Button
                  size="small"
                  color="error"
                  onClick={() => {
                    const nextImages = form.imageUrls.filter((_, imageIndex) => imageIndex !== index);
                    updateForm({ imageUrl: nextImages[0] ?? "", imageUrls: nextImages });
                  }}
                  sx={{ mt: 0.5, px: 0 }}
                >
                  {t("remove")}
                </Button>
              </Box>
            ))}
          </Stack>
        ) : null}
        <S.HighlightPanel
          $panelBorderColor="rgba(15,118,110,0.16)"
          $panelBackground="rgba(240,253,250,0.72)"
        >
          <Stack spacing={2}>
            <S.SplitFormControlLabel
              label={
                <Box display="flex">
                  <Typography fontWeight={900}>{t("compoundYield")}: </Typography>
                  <Typography fontWeight={900} ml={1} color={form.hasYield ? "success" : "text.secondary"}>
                    {form.hasYield ? t("yes") : t("no")}
                  </Typography>
                </Box>
              }
              labelPlacement="start"
              control={
                <Switch
                  checked={form.hasYield}
                  onChange={(event) =>
                    updateForm({
                      hasYield: event.target.checked,
                      yieldRateMonthly: event.target.checked ? form.yieldRateMonthly : "",
                    })
                  }
                />
              }
            />
            {form.hasYield ? (
              <TextField
                label={`${t("monthlyYield")} (%)`}
                type="number"
                inputProps={{ min: 0, step: "0.01" }}
                value={form.yieldRateMonthly}
                onChange={(event) => updateForm({ yieldRateMonthly: event.target.value })}
                helperText="Ex.: 1 para 1% ao mês."
              />
            ) : null}
          </Stack>
        </S.HighlightPanel>
        <TextField
          select
          label={t("status")}
          value={form.status}
          onChange={(event) =>
            updateForm({ status: event.target.value as FinancialGoalStatus })
          }
          fullWidth
        >
          <MenuItem value="ACTIVE">{t("active")}</MenuItem>
          <MenuItem value="COMPLETED">{t("completed")}</MenuItem>
          <MenuItem value="CANCELED">{t("canceled")}</MenuItem>
        </TextField>
        <TextField
          label={t("description")}
          value={form.description}
          onChange={(event) => updateForm({ description: event.target.value })}
          fullWidth
          multiline
          rows={3}
        />
      </S.FormStack>
    </AppDialog>
  );
}
