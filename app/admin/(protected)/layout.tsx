import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth'
import AdminHeader from '@/components/admin/AdminHeader'
import { Box } from '@mui/material'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAuthSession()
  
  if (!session) {
    redirect('/api/auth/signin?callbackUrl=/admin/dashboard')
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AdminHeader user={session.user} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f5f5f5' }}>
        {children}
      </Box>
    </Box>
  )
}