import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
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

export function LoginPage() {
  const { signIn } = useAuth();
  const { t } = usePreferences();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await signIn(email, password);
      navigate('/app');
    } catch {
      setError(t('loginError'));
    }
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Paper sx={{ p: 4, width: '100%', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
            <Typography variant="h4" fontWeight={900}>{t('loginTitle')}</Typography>
            <PreferenceControls />
          </Stack>
          <TextField label={t('email')} type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <PasswordField value={password} onChange={setPassword} />
          {error && <Typography color="error">{error}</Typography>}
          <Button type="submit" variant="contained" size="large">{t('loginAction')}</Button>
          <Button component={Link} to="/forgot-password">{t('forgotPassword')}</Button>
          <Typography textAlign="center">{t('noAccount')} <Link to="/register">{t('registerLink')}</Link></Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
