'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  FormHelperText
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { createUser, updateUser } from '@/app/actions/users'

interface UserFormProps {
  user?: any
  currentUserRole: string
}

export default function UserForm({ user, currentUserRole }: UserFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    email: user?.email || '',
    name: user?.name || '',
    password: '',
    role: user?.role || 'EDITOR'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Валидация
      if (!formData.email || !formData.name) {
        throw new Error('Email и имя обязательны')
      }

      if (!user && !formData.password) {
        throw new Error('Пароль обязателен при создании пользователя')
      }

      if (formData.password && formData.password.length < 6) {
        throw new Error('Пароль должен быть не менее 6 символов')
      }

      const data: any = {
        email: formData.email,
        name: formData.name,
        role: formData.role as 'SUPER_ADMIN' | 'EDITOR'
      }

      // Добавляем пароль только если он указан
      if (formData.password) {
        data.password = formData.password
      }

      if (user) {
        await updateUser(user.id, data)
      } else {
        await createUser(data)
      }
      
      router.push('/admin/users')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Произошла ошибка при сохранении')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            helperText="Email используется для входа в систему"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Имя"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            helperText="Полное имя пользователя"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required={!user}
            label={user ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль'}
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            helperText="Минимум 6 символов"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Роль</InputLabel>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              label="Роль"
            >
              <MenuItem value="EDITOR">Редактор</MenuItem>
              <MenuItem value="SUPER_ADMIN">Суперадминистратор</MenuItem>
            </Select>
            <FormHelperText>
              Суперадминистратор имеет полный доступ к системе
            </FormHelperText>
          </FormControl>
        </Grid>

        {currentUserRole === 'SUPER_ADMIN' && (
          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Роли пользователей:</strong>
                <br />
                • <strong>Редактор</strong> - может создавать и редактировать объекты, выполнять импорт
                <br />
                • <strong>Суперадминистратор</strong> - полный доступ ко всем функциям системы, включая управление справочниками и пользователями
              </Typography>
            </Alert>
          </Grid>
        )}
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={loading}
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={() => router.push('/admin/users')}
          disabled={loading}
        >
          Отмена
        </Button>
      </Box>
    </form>
  )
}