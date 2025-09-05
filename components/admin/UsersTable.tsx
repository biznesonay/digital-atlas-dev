'use client'

import { useState } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Box,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Switch
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import LockResetIcon from '@mui/icons-material/LockReset'
import PersonIcon from '@mui/icons-material/Person'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteUser, resetUserPassword, toggleUserStatus } from '@/app/actions/users'

interface UsersTableProps {
  users: any[]
  currentUserId: string
}

export default function UsersTable({ users, currentUserId }: UsersTableProps) {
  const router = useRouter()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: any | null }>({
    open: false,
    user: null
  })
  const [resetDialog, setResetDialog] = useState<{ open: boolean; user: any | null }>({
    open: false,
    user: null
  })
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!deleteDialog.user) return
    
    setLoading(true)
    try {
      await deleteUser(deleteDialog.user.id)
      setDeleteDialog({ open: false, user: null })
      router.refresh()
    } catch (error: any) {
      alert(error.message || 'Ошибка при удалении')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!resetDialog.user || !newPassword) return
    
    setLoading(true)
    try {
      await resetUserPassword(resetDialog.user.id, newPassword)
      setResetDialog({ open: false, user: null })
      setNewPassword('')
      alert('Пароль успешно изменен')
    } catch (error: any) {
      alert(error.message || 'Ошибка при сбросе пароля')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (userId: string) => {
    try {
      await toggleUserStatus(userId)
      router.refresh()
    } catch (error: any) {
      alert(error.message || 'Ошибка при изменении статуса')
    }
  }

  const getRoleIcon = (role: string) => {
    return role === 'SUPER_ADMIN' ? (
      <AdminPanelSettingsIcon fontSize="small" />
    ) : (
      <PersonIcon fontSize="small" />
    )
  }

  const getRoleLabel = (role: string) => {
    return role === 'SUPER_ADMIN' ? 'Суперадмин' : 'Редактор'
  }

  const getRoleColor = (role: string): 'error' | 'primary' => {
    return role === 'SUPER_ADMIN' ? 'error' : 'primary'
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Имя</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell align="center">Статус</TableCell>
              <TableCell>Дата регистрации</TableCell>
              <TableCell align="center">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId
              const isActive = !!user.emailVerified
              
              return (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={isCurrentUser ? 'bold' : 'normal'}>
                      {user.name}
                      {isCurrentUser && (
                        <Chip component="span" label="Вы" size="small" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getRoleIcon(user.role)}
                      label={getRoleLabel(user.role)}
                      size="small"
                      color={getRoleColor(user.role)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={isActive}
                      onChange={() => handleToggleStatus(user.id)}
                      disabled={isCurrentUser}
                      color="primary"
                      size="small"
                    />
                    <Typography variant="caption" display="block" color="text.secondary">
                      {isActive ? 'Активен' : 'Заблокирован'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Редактировать">
                        <IconButton
                          size="small"
                          component={Link}
                          href={`/admin/users/${user.id}`}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Сбросить пароль">
                        <IconButton
                          size="small"
                          onClick={() => setResetDialog({ open: true, user })}
                          color="warning"
                        >
                          <LockResetIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={isCurrentUser ? 'Нельзя удалить себя' : 'Удалить'}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteDialog({ open: true, user })}
                            color="error"
                            disabled={isCurrentUser}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              )
            })}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>
                    Пользователи не найдены
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Диалог удаления */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, user: null })}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы действительно хотите удалить пользователя "{deleteDialog.user?.name}"?
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, user: null })}>
            Отмена
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог сброса пароля */}
      <Dialog open={resetDialog.open} onClose={() => setResetDialog({ open: false, user: null })}>
        <DialogTitle>Сброс пароля</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Введите новый пароль для пользователя "{resetDialog.user?.name}":
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="Новый пароль"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            helperText="Минимум 6 символов"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setResetDialog({ open: false, user: null })
            setNewPassword('')
          }}>
            Отмена
          </Button>
          <Button
            onClick={handleResetPassword}
            color="primary"
            variant="contained"
            disabled={loading || newPassword.length < 6}
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}