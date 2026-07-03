import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { EntryType, ValueUpdateScope } from '@/interfaces/financial';
import { balanceColor, financeColors, formatMoney, months } from '@/utils/format';
import { AppDialog, AppDialogStyles as S } from '@/components/molecules/AppDialog';

type Props = {
  open: boolean;
  category: string;
  month: number;
  year: number;
  currentValue: number;
  type: EntryType;
  currentMonthIncome: number;
  currentMonthExpense: number;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (payload: { amount: number; scope: ValueUpdateScope; description?: string | null }) => Promise<void>;
};

export function ValueEditModal({
  open,
  category,
  month,
  year,
  currentValue,
  type,
  currentMonthIncome,
  currentMonthExpense,
  saving = false,
  onClose,
  onSubmit
}: Props) {
  const [amount, setAmount] = useState(String(currentValue || 0));
  const [scope, setScope] = useState<ValueUpdateScope>('ONLY_THIS_PERIOD');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setAmount(String(currentValue || 0));
    setScope('ONLY_THIS_PERIOD');
    setDescription('');
  }, [currentValue, open]);

  const numericAmount = Number(amount) || 0;
  const delta = numericAmount - currentValue;
  const preview = useMemo(() => {
    const income = type === 'INCOME' ? currentMonthIncome + delta : currentMonthIncome;
    const expense = type === 'EXPENSE' ? currentMonthExpense + delta : currentMonthExpense;
    return { income, expense, balance: income - expense };
  }, [currentMonthExpense, currentMonthIncome, delta, type]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await onSubmit({ amount: numericAmount, scope, description: description || null });
  }

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Editar valor da celula"
      actions={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="value-edit-form" variant="contained" disabled={saving}>Salvar alteracao</Button>
        </>
      }
    >
        <S.FormStack component="form" id="value-edit-form" spacing={2.5} onSubmit={handleSubmit}>
          <Stack spacing={0.5}>
            <Typography fontWeight={900}>{category}</Typography>
            <Typography color="text.secondary">{months[month - 1]} de {year} • {type === 'INCOME' ? 'Receita' : 'Despesa'}</Typography>
          </Stack>
          <TextField label="Novo valor" type="number" required inputProps={{ min: 0, step: '0.01' }} value={amount} onChange={(event) => setAmount(event.target.value)} helperText={`Valor atual: ${formatMoney(currentValue)}`} />
          <TextField label="Descricao opcional" multiline minRows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
          <RadioGroup value={scope} onChange={(event) => setScope(event.target.value as ValueUpdateScope)}>
            <FormControlLabel value="ONLY_THIS_PERIOD" control={<Radio />} label="Alterar somente este mes" />
            <FormControlLabel value="FROM_THIS_PERIOD_FORWARD" control={<Radio />} label="Alterar deste mes em diante" />
            <FormControlLabel value="ALL_YEAR" control={<Radio />} label="Alterar todos os meses do ano" />
          </RadioGroup>
          <S.PreviewPanel spacing={1.2}>
            <Typography fontWeight={900}>Preview do impacto</Typography>
            <Typography color={type === 'INCOME' ? financeColors.income : financeColors.expense}>Diferenca no mes: {formatMoney(delta)}</Typography>
            <Typography color={financeColors.income}>Novo total de receitas: {formatMoney(preview.income)}</Typography>
            <Typography color={financeColors.expense}>Novo total de despesas: {formatMoney(preview.expense)}</Typography>
            <Typography fontWeight={950} color={balanceColor(preview.balance)}>Novo saldo do mes: {formatMoney(preview.balance)}</Typography>
          </S.PreviewPanel>
        </S.FormStack>
    </AppDialog>
  );
}
