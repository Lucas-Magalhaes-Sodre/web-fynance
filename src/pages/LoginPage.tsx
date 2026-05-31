import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { signIn } = useAuth();
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
      setError('E-mail ou senha invalidos.');
    }
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Paper sx={{ p: 4, width: '100%', border: '1px solid #E5E7EB', boxShadow: 'none' }}>
        <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
          <Typography variant="h4" fontWeight={900}>Entrar</Typography>
          <TextField label="E-mail" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <TextField label="Senha" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          {error && <Typography color="error">{error}</Typography>}
          <Button type="submit" variant="contained" size="large">Acessar</Button>
          <Button component={Link} to="/forgot-password">Esqueci minha senha</Button>
          <Typography textAlign="center">Nao tem conta? <Link to="/register">Cadastre-se</Link></Typography>
        </Stack>
      </Paper>
    </Container>
  );
}

