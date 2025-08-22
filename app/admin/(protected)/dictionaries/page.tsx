import { Box, Typography, Grid, Card, CardContent, CardActions, Button } from '@mui/material'
import Link from 'next/link'
import CategoryIcon from '@mui/icons-material/Category'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import DirectionsIcon from '@mui/icons-material/Directions'
import SettingsIcon from '@mui/icons-material/Settings'
import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DictionariesPage() {
  const session = await getAuthSession()
  
  if (session?.user?.role !== 'SUPER_ADMIN') {
    redirect('/admin/dashboard')
  }

  const dictionaries = [
    {
      title: 'Типы инфраструктуры',
      description: 'Управление типами объектов инновационной инфраструктуры (СЭЗ, Технопарки и др.)',
      icon: <CategoryIcon fontSize="large" />,
      color: '#1976D2',
      link: '/admin/dictionaries/types',
      count: 5
    },
    {
      title: 'Регионы',
      description: 'Управление списком регионов и областей Казахстана',
      icon: <LocationOnIcon fontSize="large" />,
      color: '#388E3C',
      link: '/admin/dictionaries/regions',
      count: 21
    },
    {
      title: 'Приоритетные направления',
      description: 'Управление списком приоритетных направлений развития',
      icon: <DirectionsIcon fontSize="large" />,
      color: '#7B1FA2',
      link: '/admin/dictionaries/directions',
      count: 8
    }
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Управление справочниками
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Справочники содержат базовые данные системы. Изменения в справочниках влияют на все объекты в системе.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {dictionaries.map((dict) => (
          <Grid item xs={12} md={6} lg={4} key={dict.title}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: dict.color + '20',
                      borderRadius: 2,
                      p: 1.5,
                      mr: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Box sx={{ color: dict.color }}>
                      {dict.icon}
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="h6">
                      {dict.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Записей: {dict.count}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  {dict.description}
                </Typography>
              </CardContent>
              
              <CardActions>
                <Button
                  size="small"
                  component={Link}
                  href={dict.link}
                  startIcon={<SettingsIcon />}
                  sx={{ color: dict.color }}
                >
                  Управление
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
        <Typography variant="body2" color="warning.contrastText">
          <strong>Внимание!</strong> Удаление элементов справочников возможно только если они не используются в объектах.
          Изменение справочников может повлиять на отображение существующих данных.
        </Typography>
      </Box>
    </Box>
  )
}