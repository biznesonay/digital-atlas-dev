'use client'

import { signIn } from 'next-auth/react'
import { useState, Suspense } from 'react'
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
  const callbackUrl = searchParams.get('callbackUrl') || '/admin/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl
      })

      if (result?.error) {
        setError('Неверный email или пароль')
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

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? 'Вход...' : 'Войти'}
              </Button>
            </form>

            <Box mt={3} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="body2" color="text.secondary" align="center">
                <strong>Тестовый доступ:</strong>
                <br />
                Email: admin@digital-atlas.kz
                <br />
                Пароль: admin123
              </Typography>
            </Box>
          </Card>
        </Box>
      </Container>
    </ThemeProvider>
  )
}