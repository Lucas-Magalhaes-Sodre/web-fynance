import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Container from '@mui/material/Container';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordField } from '@/components/molecules/PasswordField';

export function RegisterPage() {
  const { signUp } = useAuth();
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
      setError('Para criar a conta, aceite os termos de uso e privacidade.');
      return;
    }
    try {
      await signUp(name, email, password, marketingConsent);
      navigate('/app');
    } catch {
      setError('Não foi possível criar a conta.');
    }
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Paper sx={{ p: 4, width: '100%', border: '1px solid #E5E7EB', boxShadow: 'none' }}>
        <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
          <Typography variant="h4" fontWeight={900}>Criar conta</Typography>
          <TextField label="Nome" required value={name} onChange={(event) => setName(event.target.value)} />
          <TextField label="E-mail" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <PasswordField value={password} onChange={setPassword} helperText="Minimo de 8 caracteres" />
          <FormControlLabel
            control={<Checkbox checked={lgpdAccepted} onChange={(event) => setLgpdAccepted(event.target.checked)} required />}
            label="Li e aceito que meus dados sejam usados para criar minha conta e operar o controle financeiro."
          />
          <FormControlLabel
            control={<Checkbox checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} />}
            label="Aceito receber comunicados e novidades do sistema. Posso alterar isso depois no perfil."
          />
          <Typography variant="caption" color="text.secondary">
            Usamos seus dados para autenticar sua conta, salvar suas movimentações financeiras e permitir exportação ou exclusão dos dados quando solicitado.
          </Typography>
          {error && <Typography color="error">{error}</Typography>}
          <Button type="submit" variant="contained" size="large" disabled={!lgpdAccepted}>Cadastrar</Button>
          <Typography textAlign="center">Ja tem conta? <Link to="/login">Entrar</Link></Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
