import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { CreditCard, EntryType, ValueUpdateScope } from '@/interfaces/financial';
import { balanceColor, currencyToNumber, digitsToCurrency, financeColors, formatMoney, months } from '@/utils/format';
import { AppDialog, AppDialogStyles as S } from '@/components/molecules/AppDialog';
import { LoadingActionButton } from '@/components/molecules/LoadingActionButton';
import { listCreditCards } from '@/services/financialControl';

type Props = {
  open: boolean;
  category: string;
  month: number;
  year: number;
  currentValue: number;
  type: EntryType | 'INVESTMENT';
  currentMonthIncome: number;
  currentMonthExpense: number;
  currentMonthSavings?: number;
  initialPaidWithCreditCard?: boolean;
  initialCreditCardId?: string | null;
  initialCreditCardInstallments?: number | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    amount: number;
    scope: ValueUpdateScope;
    description?: string | null;
    paidWithCreditCard?: boolean;
    creditCardId?: string | null;
    creditCardInstallments?: number | null;
  }) => Promise<void>;
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
  currentMonthSavings = 0,
  initialPaidWithCreditCard = false,
  initialCreditCardId = '',
  initialCreditCardInstallments = 1,
  saving = false,
  onClose,
  onSubmit
}: Props) {
  const [amount, setAmount] = useState(formatMoney(currentValue || 0));
  const [scope, setScope] = useState<ValueUpdateScope>('ONLY_THIS_PERIOD');
  const [description, setDescription] = useState('');
  const [paidWithCreditCard, setPaidWithCreditCard] = useState(initialPaidWithCreditCard);
  const [creditCardId, setCreditCardId] = useState(initialCreditCardId ?? '');
  const [creditCardInstallments, setCreditCardInstallments] = useState(String(initialCreditCardInstallments || 1));
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);

  useEffect(() => {
    setAmount(formatMoney(currentValue || 0));
    setScope('ONLY_THIS_PERIOD');
    setDescription('');
    setPaidWithCreditCard(initialPaidWithCreditCard);
    setCreditCardId(initialCreditCardId ?? '');
    setCreditCardInstallments(String(initialCreditCardInstallments || 1));
  }, [currentValue, initialCreditCardId, initialCreditCardInstallments, initialPaidWithCreditCard, open]);

  useEffect(() => {
    if (!open || type !== 'EXPENSE') return;
    let active = true;
    listCreditCards({ month, year })
      .then((overview) => {
        if (active) setCreditCards(overview.cards);
      })
      .catch(() => {
        if (active) setCreditCards([]);
      });
    return () => {
      active = false;
    };
  }, [month, open, type, year]);

  const numericAmount = currencyToNumber(amount) || 0;
  const currentAmountInTotals = initialPaidWithCreditCard ? 0 : currentValue;
  const nextAmountInTotals = paidWithCreditCard ? 0 : numericAmount;
  const delta = nextAmountInTotals - currentAmountInTotals;
  const preview = useMemo(() => {
    const income = type === 'INCOME' ? currentMonthIncome + delta : currentMonthIncome;
    const expense = type === 'EXPENSE' ? currentMonthExpense + delta : currentMonthExpense;
    const savings = type === 'INVESTMENT' ? currentMonthSavings + delta : currentMonthSavings;
    return { income, expense, savings, balance: income - expense - savings };
  }, [currentMonthExpense, currentMonthIncome, currentMonthSavings, delta, type]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    await onSubmit({
      amount: numericAmount,
      scope: paidWithCreditCard ? 'ONLY_THIS_PERIOD' : scope,
      description: description || null,
      paidWithCreditCard: type === 'EXPENSE' ? paidWithCreditCard : undefined,
      creditCardId: paidWithCreditCard ? creditCardId : null,
      creditCardInstallments: paidWithCreditCard ? Number(creditCardInstallments || 1) : null,
    });
  }

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Editar valor da celula"
      actions={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <LoadingActionButton
            type="submit"
            form="value-edit-form"
            variant="contained"
            loading={saving}
            loadingLabel="Salvando..."
            disabled={paidWithCreditCard && (!creditCardId || numericAmount <= 0)}
          >
            Salvar alteracao
          </LoadingActionButton>
        </>
      }
    >
        <S.FormStack component="form" id="value-edit-form" spacing={2.5} onSubmit={handleSubmit}>
          <Stack spacing={0.5}>
            <Typography fontWeight={900}>{category}</Typography>
            <Typography color="text.secondary">
              {months[month - 1]} de {year} • {type === 'INCOME' ? 'Receita' : type === 'EXPENSE' ? 'Despesa' : 'Economia'}
            </Typography>
          </Stack>
          <TextField label="Novo valor" required value={amount} onChange={(event) => setAmount(digitsToCurrency(event.target.value))} helperText={`Valor atual: ${formatMoney(currentValue)}`} />
          <TextField label="Descrição opcional" multiline minRows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
          {type === 'EXPENSE' ? (
            <S.PreviewPanel spacing={1.5}>
              <FormControlLabel
                control={
                  <Switch
                    checked={paidWithCreditCard}
                    onChange={(event) => setPaidWithCreditCard(event.target.checked)}
                  />
                }
                label="Este gasto foi pago no cartão"
              />
              {paidWithCreditCard ? (
                <Stack spacing={1.5}>
                  <Typography variant="body2" color="text.secondary">
                    O valor ficará visível aqui como planejado, mas será riscado e não entrará no total desta categoria. O impacto real será lançado no cartão escolhido.
                  </Typography>
                  <TextField
                    select
                    label="Cartão"
                    value={creditCardId}
                    onChange={(event) => setCreditCardId(event.target.value)}
                    required
                  >
                    {creditCards.map((card) => (
                      <MenuItem key={card.id} value={card.id}>{card.name}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Parcelas"
                    type="number"
                    value={creditCardInstallments}
                    onChange={(event) => setCreditCardInstallments(event.target.value)}
                    inputProps={{ min: 1, max: 240 }}
                    required
                  />
                </Stack>
              ) : null}
            </S.PreviewPanel>
          ) : null}
          <RadioGroup value={paidWithCreditCard ? 'ONLY_THIS_PERIOD' : scope} onChange={(event) => setScope(event.target.value as ValueUpdateScope)}>
            <FormControlLabel value="ONLY_THIS_PERIOD" control={<Radio />} label="Alterar somente este mês" />
            <FormControlLabel value="FROM_THIS_PERIOD_FORWARD" disabled={paidWithCreditCard} control={<Radio />} label="Alterar deste mês em diante" />
            <FormControlLabel value="ALL_YEAR" disabled={paidWithCreditCard} control={<Radio />} label="Alterar todos os meses do ano" />
          </RadioGroup>
          <S.PreviewPanel spacing={1.2}>
            <Typography fontWeight={900}>Preview do impacto</Typography>
            <Typography color={type === 'INCOME' ? financeColors.income : type === 'EXPENSE' ? financeColors.expense : financeColors.saving}>Diferenca no mês: {formatMoney(delta)}</Typography>
            <Typography color={financeColors.income}>Novo total de receitas: {formatMoney(preview.income)}</Typography>
            <Typography color={financeColors.expense}>Novo total de despesas: {formatMoney(preview.expense)}</Typography>
            <Typography color={financeColors.saving}>Novo total de economias: {formatMoney(preview.savings)}</Typography>
            <Typography fontWeight={950} color={balanceColor(preview.balance)}>Novo saldo do mês: {formatMoney(preview.balance)}</Typography>
          </S.PreviewPanel>
        </S.FormStack>
    </AppDialog>
  );
}
