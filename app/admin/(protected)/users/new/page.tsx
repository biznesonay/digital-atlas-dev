import { Box, Typography, Paper, Button } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Link from 'next/link'
import UserForm from '@/components/admin/UserForm'
import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function NewUserPage() {
  const session = await getAuthSession()
  
  if (session?.user?.role !== 'SUPER_ADMIN') {
    redirect('/admin/dashboard')
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          component={Link}
          href="/admin/users"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Назад
        </Button>
        <Typography variant="h4">
          Создание пользователя
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <UserForm currentUserRole={session.user.role} />
      </Paper>
    </Box>
  )
}