import { Box, Typography, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import Link from 'next/link'
import { getUsers } from '@/app/actions/users'
import UsersTable from '@/components/admin/UsersTable'
import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
  const session = await getAuthSession()
  
  if (session?.user?.role !== 'SUPER_ADMIN') {
    redirect('/admin/dashboard')
  }
  
  const users = await getUsers()

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Управление пользователями
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          href="/admin/users/new"
          size="large"
        >
          Добавить пользователя
        </Button>
      </Box>

      <UsersTable users={users} currentUserId={session?.user?.id || ''} />
    </Box>
  )
}