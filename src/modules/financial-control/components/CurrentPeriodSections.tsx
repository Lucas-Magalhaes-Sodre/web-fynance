import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FinancialItem, Saving } from "@/interfaces/financial";
import { financeColors } from "@/utils/format";
import { EntryRows } from "./EntryRows";
import { SavingRows } from "./SavingRows";

type CurrentPeriodSectionsProps = {
  items: FinancialItem[];
  savings: Saving[];
  onEditItem: (item: FinancialItem) => void;
  onDeleteItem: (item: FinancialItem) => void;
  onMarkPaid: (item: FinancialItem) => void;
  onMarkPending: (item: FinancialItem) => void;
  onMarkManyPaid: (items: FinancialItem[]) => void;
};

export function CurrentPeriodSections({
  items,
  savings,
  onEditItem,
  onDeleteItem,
  onMarkPaid,
  onMarkPending,
  onMarkManyPaid,
}: CurrentPeriodSectionsProps) {
  const incomeItems = items.filter((item) => item.type.includes("INCOME"));
  const expenseItems = items.filter((item) => item.type.includes("EXPENSE"));
  const payableExpenses = expenseItems.filter((item) => item.status !== "PAGO");

  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={900}>
        Receitas
      </Typography>
      <EntryRows
        items={incomeItems}
        onEdit={onEditItem}
        onDelete={onDeleteItem}
        onMarkPaid={onMarkPaid}
        onMarkPending={onMarkPending}
      />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        spacing={1}
      >
        <Typography variant="h6" fontWeight={900}>
          Despesas
        </Typography>
        {payableExpenses.length ? (
          <Button
            size="small"
            variant="outlined"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => onMarkManyPaid(payableExpenses)}
          >
            Marcar {payableExpenses.length} como pago
          </Button>
        ) : null}
      </Stack>
      <EntryRows
        items={expenseItems}
        onEdit={onEditItem}
        onDelete={onDeleteItem}
        onMarkPaid={onMarkPaid}
        onMarkPending={onMarkPending}
      />
      <Typography variant="h6" fontWeight={900} color={financeColors.saving}>
        Economias
      </Typography>
      <SavingRows items={savings} />
    </Stack>
  );
}
