import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { PasswordField } from '@/components/molecules/PasswordField';
import { PreferenceControls } from '@/components/molecules/PreferenceControls';
import { GoogleSignInButton } from '@/components/molecules/GoogleSignInButton';

export function RegisterPage() {
  const { signUp } = useAuth();
  const { t } = usePreferences();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!lgpdAccepted) {
      setError(t('registerPrivacyError'));
      return;
    }
    try {
      await signUp(name, email, password, marketingConsent);
      navigate('/app');
    } catch {
      setError(t('registerError'));
    }
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Paper sx={{ p: 4, width: '100%', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
            <Typography variant="h4" fontWeight={900}>{t('registerTitle')}</Typography>
            <PreferenceControls />
          </Stack>
          <TextField label={t('name')} required value={name} onChange={(event) => setName(event.target.value)} />
          <TextField label={t('email')} type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <PasswordField value={password} onChange={setPassword} helperText={t('passwordHelper')} />
          <FormControlLabel
            control={<Checkbox checked={lgpdAccepted} onChange={(event) => setLgpdAccepted(event.target.checked)} required />}
            label={(
              <Typography variant="body2">
                Li e aceito os <Link to="/legal/terms" target="_blank">Termos de Uso</Link> e a{' '}
                <Link to="/legal/privacy" target="_blank">Política de Privacidade</Link>, incluindo o tratamento dos meus dados para criação da conta e operação do Deluket Finance.
              </Typography>
            )}
          />
          <FormControlLabel
            control={<Checkbox checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} />}
            label={t('registerMarketingConsent')}
          />
          <Typography variant="caption" color="text.secondary">
            {t('registerPrivacyNote')}
          </Typography>
          {error && <Typography color="error">{error}</Typography>}
          <Button type="submit" variant="contained" size="large" disabled={!lgpdAccepted}>{t('registerAction')}</Button>
          <Divider>ou</Divider>
          <GoogleSignInButton
            legalAccepted={lgpdAccepted}
            beforeSignIn={() => {
              if (lgpdAccepted) return null;
              return t('registerPrivacyError');
            }}
            onSuccess={() => navigate('/app')}
          />
          <Typography textAlign="center">{t('hasAccount')} <Link to="/login">{t('loginTitle')}</Link></Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
