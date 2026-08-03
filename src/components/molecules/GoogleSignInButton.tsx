import GoogleIcon from '@mui/icons-material/Google';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID } from '@/config/env';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const googleScriptId = 'google-identity-services';

function loadGoogleScript() {
  if (document.getElementById(googleScriptId)) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = googleScriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Nao foi possivel carregar o login do Google.'));
    document.head.appendChild(script);
  });
}

function errorMessageFromApi(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export function GoogleSignInButton({
  onSuccess,
  beforeSignIn,
  legalAccepted = false
}: {
  onSuccess: () => void;
  beforeSignIn?: () => string | null;
  legalAccepted?: boolean;
}) {
  const { signInWithGoogle } = useAuth();
  const { t } = usePreferences();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState('');
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    loadGoogleScript()
      .then(() => setScriptReady(true))
      .catch(() => setError(t('loginError')));
  }, [t]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !scriptReady || !window.google || !buttonRef.current) return;
    buttonRef.current.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        if (!response.credential) {
          setError(t('loginError'));
          return;
        }
        setError('');
        const blockedMessage = beforeSignIn?.();
        if (blockedMessage) {
          setError(blockedMessage);
          return;
        }
        try {
          await signInWithGoogle(response.credential, legalAccepted);
          onSuccess();
        } catch (error) {
          setError(errorMessageFromApi(error, t('loginError')));
        }
      }
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      width: buttonRef.current.clientWidth || 360,
      text: 'continue_with',
      locale: 'pt_BR'
    });
  }, [beforeSignIn, legalAccepted, onSuccess, scriptReady, signInWithGoogle, t]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <Button variant="outlined" startIcon={<GoogleIcon />} disabled>
        Google indisponível
      </Button>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        ref={buttonRef}
        sx={{
          minHeight: 44,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          '& > div': { width: '100% !important' },
          '& iframe': { mx: 'auto' }
        }}
      />
      {error ? <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert> : null}
    </Box>
  );
}
