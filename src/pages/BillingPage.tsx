import CreditCardIcon from '@mui/icons-material/CreditCard';
import PixIcon from '@mui/icons-material/Pix';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { normalizePlanProductKeys, productPlanLabel } from '@/constants/planProducts';
import { useAuth } from '@/contexts/AuthContext';
import { createCheckout, getBillingPublicSettings, getBillingStatus, listBillingPlans, validateBillingCoupon, type BillingPlan, type BillingStatus, type CouponValidationResult } from '@/services/billing';
import { getMyReferralProgram, type ReferralProgram } from '@/services/referrals';
import { formatDate, formatMoney } from '@/utils/format';

export function BillingPage() {
  const { refreshUser } = useAuth();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [couponByPlan, setCouponByPlan] = useState<Record<string, string>>({});
  const [validatedCouponByPlan, setValidatedCouponByPlan] = useState<Record<string, CouponValidationResult | undefined>>({});
  const [legalAcceptedByPlan, setLegalAcceptedByPlan] = useState<Record<string, boolean>>({});
  const [useReferralCreditByPlan, setUseReferralCreditByPlan] = useState<Record<string, boolean>>({});
  const [referral, setReferral] = useState<ReferralProgram | null>(null);
  const [couponLoadingPlan, setCouponLoadingPlan] = useState<string | null>(null);
  const [defaultTrialDays, setDefaultTrialDays] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    const [billingResult, settingsResult, plansResult, referralResult] = await Promise.all([getBillingStatus(), getBillingPublicSettings(), listBillingPlans(), getMyReferralProgram().catch(() => null)]);
    setBilling(billingResult);
    setDefaultTrialDays(settingsResult.defaultTrialDays);
    setPlans(plansResult);
    setReferral(referralResult);
  }

  useEffect(() => {
    load();
  }, []);

  async function subscribe(planId: string, paymentMethod: 'CARD' | 'PIX') {
    if (!legalAcceptedByPlan[planId]) {
      setError('Para continuar, aceite os termos e condições do plano escolhido.');
      return;
    }
    setLoadingPlan(`${planId}:${paymentMethod}`);
    setError('');
    try {
      const checkout = await createCheckout({
        provider: 'MERCADO_PAGO',
        paymentMethod,
        planId,
        couponCode: validatedCouponByPlan[planId]?.code,
        useReferralCredit: Boolean(useReferralCreditByPlan[planId]),
        legalAccepted: true
      });
      window.location.href = checkout.url;
    } catch (error: any) {
      setError(error.response?.data?.message ?? 'Não foi possível iniciar o pagamento.');
    } finally {
      setLoadingPlan(null);
    }
  }

  async function applyCoupon(planId: string) {
    const couponCode = couponByPlan[planId]?.trim();
    if (!couponCode) return;
    setCouponLoadingPlan(planId);
    setError('');
    try {
      const coupon = await validateBillingCoupon({ planId, couponCode });
      setValidatedCouponByPlan((current) => ({ ...current, [planId]: coupon }));
    } catch (error: any) {
      setValidatedCouponByPlan((current) => ({ ...current, [planId]: undefined }));
      setError(error.response?.data?.message ?? 'Cupom inválido para este plano.');
    } finally {
      setCouponLoadingPlan(null);
    }
  }

  return (
    <Stack spacing={3}>
      <Paper className="glass-card" sx={{ p: { xs: 3, md: 4 }, borderRadius: 5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
          <CreditCardIcon color="primary" />
          <Typography color="primary" fontWeight={900}>Assinatura</Typography>
        </Stack>
        <Typography variant="h3" fontWeight={950} letterSpacing={0}>
          Continue usando o Deluket Finance
        </Typography>
        <Typography color="text.secondary" fontSize={17}>
          Assine para manter acesso ao dashboard, controle financeiro, cartões, economias, metas e lembretes.
          {defaultTrialDays !== null ? ` Novos usuários começam com ${defaultTrialDays} dias de teste grátis.` : ''}
        </Typography>
      </Paper>

      <Paper className="soft-card" sx={{ p: 2.5, borderRadius: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
          <Box>
            <Typography fontWeight={950}>Status atual</Typography>
            <Typography color="text.secondary">
              {billing?.planNameSnapshot ?? billing?.subscriptionPlan ?? '-'}
              {billing?.planPriceSnapshot ? ` · ${formatMoney(billing.planPriceSnapshot)}` : ''}
            </Typography>
          </Box>
          <Box>
            <Typography fontWeight={950}>Teste grátis</Typography>
            <Typography color="text.secondary">
              {billing?.subscriptionCurrentPeriodEnd
                ? `Vence em ${formatDate(billing.subscriptionCurrentPeriodEnd)}`
                : billing?.trialEndsAt ? `Teste até ${formatDate(billing.trialEndsAt)}` : 'Sem teste ativo'}
            </Typography>
          </Box>
          <Button onClick={async () => { await load(); await refreshUser(); }}>
            Atualizar status
          </Button>
        </Stack>
      </Paper>

      {error ? (
        <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(220,38,38,0.3)', color: 'error.main' }}>
          {error}
        </Paper>
      ) : null}

      <Grid container spacing={2}>
        {plans.map((item) => (
          <Grid item xs={12} md={plans.length === 1 ? 12 : 6} key={item.id}>
            <Paper className="soft-card" sx={{ p: 3, borderRadius: 4, height: '100%' }}>
              <Stack spacing={2} height="100%">
                <Stack direction="row" spacing={1} alignItems="center">
                  <PixIcon color="primary" />
                  <Typography variant="h5" fontWeight={950}>{item.name}</Typography>
                  {billing?.billingPlanId === item.id && billing.access?.hasPaidAccess ? (
                    <Chip label="Plano atual" color="success" size="small" sx={{ fontWeight: 900 }} />
                  ) : null}
                </Stack>
                <Box>
                  {item.originalPrice && item.originalPrice > item.price ? (
                    <Typography color="text.secondary" sx={{ textDecoration: 'line-through', fontWeight: 900 }}>
                      {formatMoney(item.originalPrice)}
                    </Typography>
                  ) : null}
                  <Typography variant="h3" fontWeight={950}>{formatMoney(item.price)}</Typography>
                </Box>
                <Typography color="text.secondary">
                  {item.durationMonths === 1 ? 'por mês' : `a cada ${item.durationMonths} meses`}
                </Typography>
                {validatedCouponByPlan[item.id] ? (
                  <Paper sx={{ p: 1.5, borderRadius: 3, bgcolor: 'success.light', color: 'success.contrastText', boxShadow: 'none' }}>
                    <Typography fontWeight={900}>
                      Cupom {validatedCouponByPlan[item.id]?.code} aplicado
                    </Typography>
                    <Typography>
                      Desconto de {formatMoney(validatedCouponByPlan[item.id]?.discountAmount ?? 0)}. Total: {formatMoney(validatedCouponByPlan[item.id]?.finalPrice ?? item.price)}
                    </Typography>
                  </Paper>
                ) : null}
                {referral?.payout.preference === 'CREDIT' && (referral.summary.availableCreditAmount ?? 0) > 0 ? (
                  <Paper sx={{ p: 1.5, borderRadius: 3, bgcolor: 'action.hover', boxShadow: 'none' }}>
                    <FormControlLabel
                      control={(
                        <Checkbox
                          checked={Boolean(useReferralCreditByPlan[item.id])}
                          onChange={(event) => setUseReferralCreditByPlan((current) => ({ ...current, [item.id]: event.target.checked }))}
                        />
                      )}
                      label={(
                        <Typography variant="body2">
                          Usar até {formatMoney(Math.min(referral.summary.availableCreditAmount, validatedCouponByPlan[item.id]?.finalPrice ?? item.price))} de comissão como desconto neste plano.
                        </Typography>
                      )}
                    />
                  </Paper>
                ) : null}
                <Typography color="text.secondary">{item.description}</Typography>
                <Paper sx={{ p: 1.5, borderRadius: 3, bgcolor: 'action.hover', boxShadow: 'none' }}>
                  <Typography variant="body2" fontWeight={900} mb={1}>Itens inclusos</Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    {normalizePlanProductKeys(item.productKeys).map((key) => (
                      <Chip key={key} size="small" label={productPlanLabel(key, item.productLabels)} variant="outlined" sx={{ fontWeight: 800 }} />
                    ))}
                    {(item.includedItems ?? []).map((label) => (
                      <Chip key={label} size="small" label={label} variant="outlined" sx={{ fontWeight: 800 }} />
                    ))}
                    {!normalizePlanProductKeys(item.productKeys).length && !(item.includedItems ?? []).length ? (
                      <Typography variant="body2" color="text.secondary">Nenhum item incluso.</Typography>
                    ) : null}
                  </Stack>
                </Paper>
                <Paper sx={{ p: 1.5, borderRadius: 3, bgcolor: 'action.hover', boxShadow: 'none' }}>
                  <Typography variant="body2" color="text.secondary">
                    Condições deste plano: {item.name}, {formatMoney(validatedCouponByPlan[item.id]?.finalPrice ?? item.price)}, duração de {item.durationMonths} mês(es)
                    {validatedCouponByPlan[item.id] ? `, com cupom ${validatedCouponByPlan[item.id]?.code}` : ''}, com acesso aos itens listados acima.
                  </Typography>
                </Paper>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    size="small"
                    label="Cupom de desconto"
                    value={couponByPlan[item.id] ?? ''}
                    onChange={(event) => {
                      setCouponByPlan((current) => ({ ...current, [item.id]: event.target.value.toUpperCase() }));
                      setValidatedCouponByPlan((current) => ({ ...current, [item.id]: undefined }));
                    }}
                    fullWidth
                  />
                  <Button
                    variant="outlined"
                    disabled={couponLoadingPlan === item.id || !couponByPlan[item.id]?.trim()}
                    onClick={() => applyCoupon(item.id)}
                  >
                    {couponLoadingPlan === item.id ? 'Aplicando...' : 'Aplicar'}
                  </Button>
                </Stack>
                <FormControlLabel
                  control={(
                    <Checkbox
                      checked={Boolean(legalAcceptedByPlan[item.id])}
                      onChange={(event) => setLegalAcceptedByPlan((current) => ({ ...current, [item.id]: event.target.checked }))}
                    />
                  )}
                  label={(
                    <Typography variant="body2" color="text.secondary">
                      Aceito os <Link to="/legal/terms" target="_blank">Termos de Uso</Link>, a{' '}
                      <Link to="/legal/privacy" target="_blank">Política de Privacidade</Link> e a{' '}
                      <Link to="/legal/cancellation" target="_blank">Política de Cancelamento</Link> para este plano.
                    </Typography>
                  )}
                />
                <Box flex={1} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<CreditCardIcon />}
                    fullWidth
                    disabled={Boolean(loadingPlan) || !legalAcceptedByPlan[item.id] || (billing?.billingPlanId === item.id && billing.access?.hasPaidAccess)}
                    onClick={() => subscribe(item.id, 'CARD')}
                  >
                    {billing?.billingPlanId === item.id && billing.access?.hasPaidAccess
                      ? 'Plano atual'
                      : loadingPlan === `${item.id}:CARD` ? 'Abrindo...' : 'Pagar com cartão'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<PixIcon />}
                    fullWidth
                    disabled={Boolean(loadingPlan) || !legalAcceptedByPlan[item.id] || (billing?.billingPlanId === item.id && billing.access?.hasPaidAccess)}
                    onClick={() => subscribe(item.id, 'PIX')}
                  >
                    {loadingPlan === `${item.id}:PIX` ? 'Abrindo...' : 'Pagar com Pix'}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
