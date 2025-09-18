'use client'

import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, IconButton } from '@mui/material'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ListIcon from '@mui/icons-material/List'
import CategoryIcon from '@mui/icons-material/Category'
import PeopleIcon from '@mui/icons-material/People'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import HomeIcon from '@mui/icons-material/Home'

interface AdminHeaderProps {
  user: any
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const menuItems = [
    { path: '/admin/dashboard', label: 'Главная', icon: <DashboardIcon />, roles: ['EDITOR', 'SUPER_ADMIN'] },
    { path: '/admin/objects', label: 'Объекты', icon: <ListIcon />, roles: ['EDITOR', 'SUPER_ADMIN'] },
    { path: '/admin/dictionaries', label: 'Справочники', icon: <CategoryIcon />, roles: ['SUPER_ADMIN'] },
    { path: '/admin/users', label: 'Пользователи', icon: <PeopleIcon />, roles: ['SUPER_ADMIN'] }
  ]

  const visibleMenuItems = menuItems.filter(item => 
    item.roles.includes(user.role)
  )

  return (
    <AppBar position="sticky" sx={{ backgroundColor: '#1c296a' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 0, mr: 4 }}>
          Админ-панель
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
          {visibleMenuItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => router.push(item.path)}
              sx={{
                color: pathname === item.path ? 'white' : 'rgba(255, 255, 255, 0.7)',
                borderBottom: pathname === item.path ? '2px solid white' : 'none',
                borderRadius: 0,
                '&:hover': {
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Button
          color="inherit"
          startIcon={<HomeIcon />}
          onClick={() => router.push('/')}
          sx={{ mr: 2 }}
        >
          На сайт
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            {user.name} ({user.role === 'SUPER_ADMIN' ? 'Суперадмин' : 'Редактор'})
          </Typography>
          <IconButton
            size="large"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircleIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Выйти
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}