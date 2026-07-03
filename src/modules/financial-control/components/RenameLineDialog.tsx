import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { EntryType } from "@/interfaces/financial";
import { financeColors } from "@/utils/format";
import { AppDialog, AppDialogStyles as S } from "@/components/molecules/AppDialog";

export type LineEditState = {
  category: string;
  name: string;
  type: EntryType;
  value: string;
};

type RenameLineDialogProps = {
  open: boolean;
  lineEdit: LineEditState | null;
  year: number;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onLineEditChange: (lineEdit: LineEditState | null) => void;
};

export function RenameLineDialog({
  open,
  lineEdit,
  year,
  saving,
  onClose,
  onSave,
  onLineEditChange,
}: RenameLineDialogProps) {
  const isIncome = lineEdit?.type === "INCOME";

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      eyebrow={isIncome ? "Receita" : "Despesa"}
      title="Renomear item"
      actions={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={
              saving ||
              !lineEdit?.value.trim() ||
              lineEdit.value.trim() === lineEdit.name
            }
            onClick={onSave}
          >
            {saving ? "Salvando..." : "Salvar nome"}
          </Button>
        </>
      }
    >
      <S.FormStack spacing={2}>
        <S.HighlightPanel
          $panelBorderColor={
            isIncome ? "rgba(37,99,235,0.22)" : "rgba(234,88,12,0.24)"
          }
          $panelBackground={
            isIncome ? financeColors.incomeSoft : financeColors.expenseSoft
          }
        >
          <Typography variant="caption" color="text.secondary" fontWeight={800}>
            Categoria
          </Typography>
          <Typography fontWeight={900}>{lineEdit?.category}</Typography>
        </S.HighlightPanel>
        <TextField
          autoFocus
          label="Novo nome"
          value={lineEdit?.value ?? ""}
          onChange={(event) =>
            onLineEditChange(
              lineEdit ? { ...lineEdit, value: event.target.value } : lineEdit,
            )
          }
          helperText={`A alteracao vale para todos os lancamentos deste item em ${year}.`}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSave();
            }
          }}
        />
      </S.FormStack>
    </AppDialog>
  );
}
