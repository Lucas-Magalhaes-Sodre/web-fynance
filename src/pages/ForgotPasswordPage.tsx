import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await api.post('/auth/forgot-password', { email });
    setMessage('Se o e-mail existir, enviaremos instrucoes de recuperacao.');
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Paper sx={{ p: 4, width: '100%', border: '1px solid #E5E7EB', boxShadow: 'none' }}>
        <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
          <Typography variant="h4" fontWeight={900}>Recuperar senha</Typography>
          <TextField label="E-mail" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          {message && <Typography color="primary">{message}</Typography>}
          <Button type="submit" variant="contained" size="large">Enviar</Button>
          <Button component={Link} to="/login">Voltar ao login</Button>
        </Stack>
      </Paper>
    </Container>
  );
}

