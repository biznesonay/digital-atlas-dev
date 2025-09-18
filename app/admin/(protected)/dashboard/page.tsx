import { Grid, Card, CardContent, Typography, Box, Button } from '@mui/material'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import AddIcon from '@mui/icons-material/Add'
import ListIcon from '@mui/icons-material/List'
import CategoryIcon from '@mui/icons-material/Category'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import BusinessIcon from '@mui/icons-material/Business'
import DirectionsIcon from '@mui/icons-material/Directions'
import PeopleIcon from '@mui/icons-material/People'

async function getStats() {
  const [
    totalObjects,
    publishedObjects,
    totalTypes,
    totalRegions,
    totalDirections,
    totalUsers
  ] = await Promise.all([
    prisma.object.count(),
    prisma.object.count({ where: { isPublished: true } }),
    prisma.infrastructureType.count(),
    prisma.region.count(),
    prisma.priorityDirection.count(),
    prisma.user.count()
  ])

  return {
    totalObjects,
    publishedObjects,
    totalTypes,
    totalRegions,
    totalDirections,
    totalUsers
  }
}

export default async function AdminDashboard() {
  const session = await getAuthSession()
  const stats = await getStats()

  const cards = [
    {
      title: 'Всего объектов',
      value: stats.totalObjects,
      icon: <LocationOnIcon fontSize="large" />,
      color: '#1976D2',
      link: '/admin/objects',
      linkText: 'Управление объектами'
    },
    {
      title: 'Опубликовано',
      value: stats.publishedObjects,
      icon: <BusinessIcon fontSize="large" />,
      color: '#388E3C',
      link: '/admin/objects',
      linkText: 'Просмотр объектов'
    },
    {
      title: 'Типы инфраструктуры',
      value: stats.totalTypes,
      icon: <CategoryIcon fontSize="large" />,
      color: '#7B1FA2',
      link: '/admin/dictionaries/types',
      linkText: 'Управление типами',
      requiresAdmin: true
    },
    {
      title: 'Регионы',
      value: stats.totalRegions,
      icon: <LocationOnIcon fontSize="large" />,
      color: '#F57C00',
      link: '/admin/dictionaries/regions',
      linkText: 'Управление регионами',
      requiresAdmin: true
    },
    {
      title: 'Приоритетные направления',
      value: stats.totalDirections,
      icon: <DirectionsIcon fontSize="large" />,
      color: '#D32F2F',
      link: '/admin/dictionaries/directions',
      linkText: 'Управление направлениями',
      requiresAdmin: true
    },
    {
      title: 'Пользователи',
      value: stats.totalUsers,
      icon: <PeopleIcon fontSize="large" />,
      color: '#00ACC1',
      link: '/admin/users',
      linkText: 'Управление пользователями',
      requiresAdmin: true
    }
  ]

  const quickActions = [
    {
      title: 'Добавить объект',
      icon: <AddIcon />,
      link: '/admin/objects/new',
      color: 'primary'
    },
    {
      title: 'Все объекты',
      icon: <ListIcon />,
      link: '/admin/objects',
      color: 'info'
    }
  ]

  const isAdmin = session?.user?.role === 'SUPER_ADMIN'

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Панель управления
      </Typography>
      
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Добро пожаловать, {session?.user?.name}! 
        Ваша роль: {isAdmin ? 'Суперадминистратор' : 'Редактор'}
      </Typography>

      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Быстрые действия
        </Typography>
        <Grid container spacing={2}>
          {quickActions.map((action) => (
            <Grid item key={action.title}>
              <Button
                variant="contained"
                color={action.color as any}
                startIcon={action.icon}
                component={Link}
                href={action.link}
                size="large"
              >
                {action.title}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Typography variant="h6" gutterBottom>
        Статистика
      </Typography>
      
      <Grid container spacing={3}>
        {cards.map((card) => {
          if (card.requiresAdmin && !isAdmin) {
            return null
          }
          
          return (
            <Grid item xs={12} sm={6} md={4} key={card.title}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: card.color + '20',
                        borderRadius: 2,
                        p: 1,
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Box sx={{ color: card.color }}>
                        {card.icon}
                      </Box>
                    </Box>
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        {card.title}
                      </Typography>
                      <Typography variant="h4">
                        {card.value}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {card.link && (
                    <Button
                      size="small"
                      component={Link}
                      href={card.link}
                      sx={{ color: card.color }}
                    >
                      {card.linkText}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}