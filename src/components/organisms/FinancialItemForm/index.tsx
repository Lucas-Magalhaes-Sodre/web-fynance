import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { FormEvent, useEffect, useState } from 'react';
import type { FinancialItem, FinancialItemType } from '@/interfaces/financial';
import { currencyToNumber, digitsToCurrency, formatMoney } from '@/utils/format';
import { AppDialog, AppDialogStyles as S } from '@/components/molecules/AppDialog';
import { LoadingActionButton } from '@/components/molecules/LoadingActionButton';
import { usePreferences } from '@/contexts/PreferencesContext';
import { typeLabel } from '@/i18n/display';

type FormState = {
  title: string;
  description: string;
  amount: string;
  type: FinancialItemType;
  date: string;
  dueDate: string;
};

type Props = {
  open: boolean;
  defaultType: FinancialItemType;
  item?: FinancialItem | null;
  onClose: () => void;
  onSubmit: (data: Omit<FormState, 'amount'> & { amount: number }) => Promise<void>;
};

const today = new Date().toISOString().slice(0, 10);

export function FinancialItemForm({ open, defaultType, item, onClose, onSubmit }: Props) {
  const { language, t } = usePreferences();
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    amount: '',
    type: defaultType,
    date: today,
    dueDate: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title,
        description: item.description ?? '',
        amount: formatMoney(item.amount),
        type: item.type,
        date: item.date.slice(0, 10),
        dueDate: item.dueDate ? item.dueDate.slice(0, 10) : ''
      });
      return;
    }

    setForm({ title: '', description: '', amount: '', type: defaultType, date: today, dueDate: '' });
  }, [item, defaultType, open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        amount: currencyToNumber(form.amount),
        dueDate: form.dueDate || ''
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={item ? t('editRecord') : t('newRecord')}
      actions={
        <>
          <Button onClick={onClose}>{t('cancel')}</Button>
          <LoadingActionButton type="submit" form="financial-item-form" variant="contained" loading={saving} loadingLabel={t('saving')}>
            {t('save')}
          </LoadingActionButton>
        </>
      }
    >
        <S.FormStack component="form" id="financial-item-form" spacing={2} onSubmit={handleSubmit}>
          <TextField label={t('recordName')} required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <TextField
            label={t('optionalNote')}
            multiline
            minRows={2}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <TextField
            label={t('amountInBrl')}
            required
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: digitsToCurrency(event.target.value) })}
          />
          <TextField select label={t('recordType')} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as FinancialItemType })}>
            {(['INCOME', 'EXPENSE'] as FinancialItemType[]).map((value) => (
              <MenuItem key={value} value={value}>
                {typeLabel(value, language)}
              </MenuItem>
            ))}
          </TextField>
          <TextField label={t('entryPaymentDebitDate')} type="date" required InputLabelProps={{ shrink: true }} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          <TextField label={t('dueDateIfAny')} type="date" InputLabelProps={{ shrink: true }} value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
        </S.FormStack>
    </AppDialog>
  );
}
