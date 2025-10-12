'use client';

import { signIn } from 'next-auth/react'
import { useState, Suspense, useRef } from 'react'
import type { FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Card,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Container
} from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from '@/lib/theme'
import ReCAPTCHA from 'react-google-recaptcha'

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get('callbackUrl') ?? '/admin/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA | null>(null)

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!recaptchaToken) {
      setError('Подтвердите, что вы не робот')
      setLoading(false)
      return
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
        recaptchaToken
      })

      if (result?.error) {
        switch (result.error) {
          case 'RECAPTCHA_REQUIRED':
          case 'RECAPTCHA_FAILED':
            setError('Проверка reCAPTCHA не пройдена. Попробуйте еще раз.')
            break
          case 'RECAPTCHA_NOT_CONFIGURED':
            setError('reCAPTCHA не настроена. Обратитесь к администратору системы.')
            break
          case 'RECAPTCHA_REQUEST_FAILED':
            setError('Не удалось выполнить проверку reCAPTCHA. Попробуйте еще раз позже.')
            break
          default:
            setError('Неверный email или пароль')
        }
        recaptchaRef.current?.reset()
        setRecaptchaToken(null)
      } else if (result?.ok) {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      setError('Произошла ошибка при входе')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
        >
          <Card sx={{ p: 4, width: '100%', maxWidth: 400 }}>
            <Box textAlign="center" mb={3}>
              <Typography variant="h4" gutterBottom>
                Вход в админ-панель
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Цифровой атлас инновационной инфраструктуры
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {!recaptchaSiteKey && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Для входа требуется настроить ключ reCAPTCHA. Обновите переменные окружения{' '}
                <code>NEXT_PUBLIC_RECAPTCHA_SITE_KEY</code>{' '}и{' '}
                <code>RECAPTCHA_SECRET_KEY</code>.
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoComplete="email"
                autoFocus
              />

              <TextField
                fullWidth
                label="Пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="current-password"
              />

              <Box mt={2} display="flex" justifyContent="center">
                {recaptchaSiteKey ? (
                  <ReCAPTCHA
                    ref={(instance) => {
                      recaptchaRef.current = instance
                    }}
                    sitekey={recaptchaSiteKey}
                    onChange={(token) => setRecaptchaToken(token)}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Вход будет доступен после настройки reCAPTCHA.
                  </Typography>
                )}
              </Box>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !recaptchaToken || !recaptchaSiteKey}
                startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? 'Вход...' : 'Войти'}
              </Button>
            </form>

            {process.env.NEXT_PUBLIC_DEMO_CREDENTIALS && process.env.NODE_ENV !== 'production' && (
              <Box mt={3} p={2} bgcolor="grey.100" borderRadius={1}>
                <Typography variant="body2" color="text.secondary" align="center">
                  {process.env.NEXT_PUBLIC_DEMO_CREDENTIALS}
                </Typography>
              </Box>
            )}
          </Card>
        </Box>
      </Container>
    </ThemeProvider>
  )
}