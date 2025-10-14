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
  const [recaptchaToken, setRecaptchaToken] = useState('')
  const [recaptchaError, setRecaptchaError] = useState('')
  const recaptchaRef = useRef<ReCAPTCHA | null>(null)
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  const isRecaptchaConfigured = Boolean(recaptchaSiteKey)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setRecaptchaError('')

    if (!recaptchaToken) {
      setRecaptchaError('Подтвердите, что вы не робот')
      return
    }

    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
        recaptchaToken
      })

      if (result?.error) {
        setError('Не удалось выполнить вход. Проверьте данные и reCAPTCHA.')
        recaptchaRef.current?.reset()
        setRecaptchaToken('')
      } else if (result?.ok) {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      setError('Произошла ошибка при входе')
      recaptchaRef.current?.reset()
      setRecaptchaToken('')
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

              {isRecaptchaConfigured ? (
                <Box mt={2} display="flex" justifyContent="center">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={recaptchaSiteKey as string}
                    onChange={(token) => {
                      setRecaptchaToken(token ?? '')
                      setRecaptchaError('')
                    }}
                    onExpired={() => {
                      setRecaptchaToken('')
                      setRecaptchaError('Подтвердите, что вы не робот')
                    }}
                    onErrored={() => {
                      setRecaptchaToken('')
                      setRecaptchaError('Не удалось загрузить reCAPTCHA, попробуйте обновить страницу')
                    }}
                  />
                </Box>
              ) : (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  reCAPTCHA не настроен. Обратитесь к администратору системы.
                </Alert>
              )}

              {recaptchaError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {recaptchaError}
                </Alert>
              )}

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !recaptchaToken}
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