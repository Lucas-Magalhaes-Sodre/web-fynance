import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import type { FinancialGoalStatus } from "@/interfaces/financial";
import { AppDialog, AppDialogStyles as S } from "@/components/molecules/AppDialog";

export type GoalFormState = {
  title: string;
  description: string;
  targetAmount: string;
  currentAmount: string;
  startDate: string;
  targetDate: string;
  category: string;
  status: FinancialGoalStatus;
};

type FinancialGoalFormDialogProps = {
  open: boolean;
  editing: boolean;
  form: GoalFormState;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (form: GoalFormState) => void;
};

export function FinancialGoalFormDialog({
  open,
  editing,
  form,
  onClose,
  onSave,
  onFormChange,
}: FinancialGoalFormDialogProps) {
  function updateForm(nextForm: Partial<GoalFormState>) {
    onFormChange({ ...form, ...nextForm });
  }

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={editing ? "Editar meta" : "Nova meta financeira"}
      actions={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="contained" onClick={onSave}>
            Salvar
          </Button>
        </>
      }
    >
      <S.FormStack spacing={2}>
        <TextField
          label="Titulo"
          value={form.title}
          onChange={(event) => updateForm({ title: event.target.value })}
          fullWidth
        />
        <TextField
          label="Valor alvo"
          type="number"
          value={form.targetAmount}
          onChange={(event) => updateForm({ targetAmount: event.target.value })}
          fullWidth
        />
        <TextField
          label="Valor atual"
          type="number"
          value={form.currentAmount}
          onChange={(event) => updateForm({ currentAmount: event.target.value })}
          fullWidth
        />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Inicio"
              type="date"
              value={form.startDate}
              onChange={(event) => updateForm({ startDate: event.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Prazo"
              type="date"
              value={form.targetDate}
              onChange={(event) => updateForm({ targetDate: event.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
        </Grid>
        <TextField
          label="Categoria"
          value={form.category}
          onChange={(event) => updateForm({ category: event.target.value })}
          fullWidth
        />
        <TextField
          select
          label="Status"
          value={form.status}
          onChange={(event) =>
            updateForm({ status: event.target.value as FinancialGoalStatus })
          }
          fullWidth
        >
          <MenuItem value="ACTIVE">Ativa</MenuItem>
          <MenuItem value="COMPLETED">Concluida</MenuItem>
          <MenuItem value="CANCELED">Cancelada</MenuItem>
        </TextField>
        <TextField
          label="Descricao"
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
