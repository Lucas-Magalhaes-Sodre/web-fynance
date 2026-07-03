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
};

export function CurrentPeriodSections({
  items,
  savings,
  onEditItem,
  onDeleteItem,
  onMarkPaid,
  onMarkPending,
}: CurrentPeriodSectionsProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={900}>
        Receitas
      </Typography>
      <EntryRows
        items={items.filter((item) => item.type.includes("INCOME"))}
        onEdit={onEditItem}
        onDelete={onDeleteItem}
        onMarkPaid={onMarkPaid}
        onMarkPending={onMarkPending}
      />
      <Typography variant="h6" fontWeight={900}>
        Despesas
      </Typography>
      <EntryRows
        items={items.filter((item) => item.type.includes("EXPENSE"))}
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
