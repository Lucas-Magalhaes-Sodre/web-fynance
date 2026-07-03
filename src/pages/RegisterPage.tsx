import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
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
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await signUp(name, email, password);
      navigate('/app');
    } catch {
      setError('Nao foi possivel criar a conta.');
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
          {error && <Typography color="error">{error}</Typography>}
          <Button type="submit" variant="contained" size="large">Cadastrar</Button>
          <Typography textAlign="center">Ja tem conta? <Link to="/login">Entrar</Link></Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
