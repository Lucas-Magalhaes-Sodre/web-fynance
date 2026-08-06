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
import { balanceColor, currencyToNumber, financeColors, formatMoney, months } from '@/utils/format';
import { AppDialog, AppDialogStyles as S } from '@/components/molecules/AppDialog';
import { LoadingActionButton } from '@/components/molecules/LoadingActionButton';
import { MoneyTextField } from '@/components/molecules/MoneyTextField';
import { listCreditCards } from '@/services/financialControl';

type Props = {
  open: boolean;
  category: string;
  sourceCategory?: string;
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
    creditCardFirstInstallmentMonth?: number | null;
    creditCardFirstInstallmentYear?: number | null;
  }) => Promise<void>;
};

export function ValueEditModal({
  open,
  category,
  sourceCategory,
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
  const [firstInstallmentMonth, setFirstInstallmentMonth] = useState(String(month));
  const [firstInstallmentYear, setFirstInstallmentYear] = useState(String(year));
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const isCreditCardExpenseCategory = useMemo(() => {
    const normalized = (sourceCategory ?? category)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
      .trim();
    return ['cartao', 'cartoes', 'cartao de credito', 'cartoes de credito'].includes(normalized);
  }, [category, sourceCategory]);
  const canPayWithCreditCard = type === 'EXPENSE' && !isCreditCardExpenseCategory;
  const effectivePaidWithCreditCard = canPayWithCreditCard && paidWithCreditCard;

  useEffect(() => {
    setAmount(formatMoney(currentValue || 0));
    setScope('ONLY_THIS_PERIOD');
    setDescription('');
    setPaidWithCreditCard(initialPaidWithCreditCard);
    setCreditCardId(initialCreditCardId ?? '');
    setCreditCardInstallments(String(initialCreditCardInstallments || 1));
    setFirstInstallmentMonth(String(month));
    setFirstInstallmentYear(String(year));
  }, [currentValue, initialCreditCardId, initialCreditCardInstallments, initialPaidWithCreditCard, month, open, year]);

  useEffect(() => {
    if (!open || !canPayWithCreditCard) {
      setCreditCards([]);
      return;
    }
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
  }, [canPayWithCreditCard, month, open, year]);

  const numericAmount = currencyToNumber(amount) || 0;
  const installmentCount = Math.max(1, Number(creditCardInstallments || 1));
  const installmentAmount = installmentCount > 0 ? numericAmount / installmentCount : numericAmount;
  const selectedCreditCard = creditCards.find((card) => card.id === creditCardId);
  const firstInstallmentLabel = `${months[Number(firstInstallmentMonth || month) - 1] ?? months[month - 1]} de ${firstInstallmentYear || year}`;
  const currentAmountInTotals = initialPaidWithCreditCard && canPayWithCreditCard ? 0 : currentValue;
  const nextAmountInTotals = effectivePaidWithCreditCard ? 0 : numericAmount;
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
      scope: effectivePaidWithCreditCard ? 'ONLY_THIS_PERIOD' : scope,
      description: description || null,
      paidWithCreditCard: canPayWithCreditCard ? paidWithCreditCard : undefined,
      creditCardId: effectivePaidWithCreditCard ? creditCardId : null,
      creditCardInstallments: effectivePaidWithCreditCard ? Number(creditCardInstallments || 1) : null,
      creditCardFirstInstallmentMonth: effectivePaidWithCreditCard ? Number(firstInstallmentMonth || month) : null,
      creditCardFirstInstallmentYear: effectivePaidWithCreditCard ? Number(firstInstallmentYear || year) : null,
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
            disabled={effectivePaidWithCreditCard && (!creditCardId || numericAmount <= 0)}
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
          <MoneyTextField label="Novo valor" required value={amount} onValueChange={setAmount} helperText={`Valor atual: ${formatMoney(currentValue)}`} />
          <TextField label="Descrição opcional" multiline minRows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
          {canPayWithCreditCard ? (
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
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField
                      label="Parcelas"
                      type="number"
                      value={creditCardInstallments}
                      onChange={(event) => setCreditCardInstallments(event.target.value)}
                      inputProps={{ min: 1, max: 240 }}
                      required
                      fullWidth
                    />
                    <TextField
                      select
                      label="Mês da 1ª parcela"
                      value={firstInstallmentMonth}
                      onChange={(event) => setFirstInstallmentMonth(event.target.value)}
                      required
                      fullWidth
                    >
                      {months.map((label, index) => (
                        <MenuItem key={label} value={String(index + 1)}>{label}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Ano da 1ª parcela"
                      type="number"
                      value={firstInstallmentYear}
                      onChange={(event) => setFirstInstallmentYear(event.target.value)}
                      inputProps={{ min: 1900, max: 3000 }}
                      required
                      fullWidth
                    />
                  </Stack>
                </Stack>
              ) : null}
            </S.PreviewPanel>
          ) : null}
          {effectivePaidWithCreditCard ? (
            <Typography variant="body2" color="text.secondary">
              Essa configuração será aplicada somente a esta célula.
            </Typography>
          ) : (
            <RadioGroup value={scope} onChange={(event) => setScope(event.target.value as ValueUpdateScope)}>
              <FormControlLabel value="ONLY_THIS_PERIOD" control={<Radio />} label="Alterar somente este mês" />
              <FormControlLabel value="FROM_THIS_PERIOD_FORWARD" control={<Radio />} label="Alterar deste mês em diante" />
              <FormControlLabel value="ALL_YEAR" control={<Radio />} label="Alterar todos os meses do ano" />
            </RadioGroup>
          )}
          {effectivePaidWithCreditCard ? (
            <S.PreviewPanel spacing={1.2}>
              <Typography fontWeight={900}>Resumo do lançamento no cartão</Typography>
              <Typography color="text.secondary">
                Na categoria original, este valor ficará apenas como referência e não entrará no total real.
              </Typography>
              <Typography color={financeColors.expense}>
                Valor planejado fora do total direto: {formatMoney(numericAmount)}
              </Typography>
              <Typography color={financeColors.expense}>
                Lançamento no cartão: {formatMoney(numericAmount)} em {installmentCount}x de {formatMoney(installmentAmount)}
              </Typography>
              <Typography color="text.secondary">
                Cartão: {selectedCreditCard?.name ?? "selecione um cartão"} • Primeira parcela: {firstInstallmentLabel}
              </Typography>
            </S.PreviewPanel>
          ) : (
            <S.PreviewPanel spacing={1.2}>
              <Typography fontWeight={900}>Preview do impacto</Typography>
              <Typography color={type === 'INCOME' ? financeColors.income : type === 'EXPENSE' ? financeColors.expense : financeColors.saving}>Diferenca no mês: {formatMoney(delta)}</Typography>
              <Typography color={financeColors.income}>Novo total de receitas: {formatMoney(preview.income)}</Typography>
              <Typography color={financeColors.expense}>Novo total de despesas: {formatMoney(preview.expense)}</Typography>
              <Typography color={financeColors.saving}>Novo total de economias: {formatMoney(preview.savings)}</Typography>
              <Typography fontWeight={950} color={balanceColor(preview.balance)}>Novo saldo do mês: {formatMoney(preview.balance)}</Typography>
            </S.PreviewPanel>
          )}
        </S.FormStack>
    </AppDialog>
  );
}
