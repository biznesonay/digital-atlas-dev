'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Divider,
  Link,
  useMediaQuery,
  useTheme
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import LaunchIcon from '@mui/icons-material/Launch'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { MapFilters } from '@/lib/types'

interface ObjectsListProps {
  open: boolean
  onClose: () => void
  language: string
  filters: MapFilters
}

export default function ObjectsList({ open, onClose, language, filters }: ObjectsListProps) {
  const [objects, setObjects] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const labels = {
    ru: {
      title: 'Список объектов',
      empty: 'Объекты не найдены',
      loading: 'Загрузка...',
      type: 'Тип',
      region: 'Регион',
      directions: 'Направления',
      website: 'Сайт',
      map: 'Карта'
    },
    kz: {
      title: 'Объектілер тізімі',
      empty: 'Объектілер табылмады',
      loading: 'Жүктеу...',
      type: 'Түрі',
      region: 'Аймақ',
      directions: 'Бағыттар',
      website: 'Сайт',
      map: 'Карта'
    },
    en: {
      title: 'Objects List',
      empty: 'No objects found',
      loading: 'Loading...',
      type: 'Type',
      region: 'Region',
      directions: 'Directions',
      website: 'Website',
      map: 'Map'
    }
  }

  const t = labels[language as keyof typeof labels] || labels.ru

  useEffect(() => {
    if (open) {
      fetchObjects()
    }
  }, [open, filters])

  const fetchObjects = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('lang', filters.lang)
      
      if (filters.search) {
        params.append('search', filters.search)
      }
      
      filters.typeIds.forEach(id => params.append('typeIds[]', id))
      filters.regionIds.forEach(id => params.append('regionIds[]', id))
      filters.directionIds.forEach(id => params.append('directionIds[]', id))
      
      const response = await fetch(`/api/objects?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setObjects(data.data)
      }
    } catch (error) {
      console.error('Error fetching objects:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        {t.title} ({objects.length})
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500]
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress />
          </Box>
        ) : objects.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography color="text.secondary">
              {t.empty}
            </Typography>
          </Box>
        ) : (
          <List>
            {objects.map((object, index) => (
              <div key={object.id}>
                <ListItem sx={{ px: 3, py: 2 }}>
                  <ListItemText
                    disableTypography
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {object.name}
                        </Typography>
                        <Chip
                          label={object.type.name}
                          size="small"
                          sx={{
                            ml: 1,
                            backgroundColor: object.type.color + '20',
                            color: object.type.color
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        {object.address && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {object.address}
                            </Typography>
                          </Box>
                        )}
                        
                        {object.region && (
                          <Typography variant="body2" color="text.secondary">
                            {t.region}: {object.region.name}
                          </Typography>
                        )}
                        
                        {object.directions && object.directions.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {object.directions.map((dir: any) => (
                              <Chip
                                key={dir.id}
                                label={dir.name}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {object.website && (
                        <IconButton
                          edge="end"
                          size="small"
                          component={Link}
                          href={object.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t.website}
                        >
                          <LaunchIcon fontSize="small" />
                        </IconButton>
                      )}
                      {object.googleMapsUrl && (
                        <IconButton
                          edge="end"
                          size="small"
                          component={Link}
                          href={object.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t.map}
                        >
                          <LocationOnIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < objects.length - 1 && <Divider variant="inset" component="li" />}
              </div>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  )
}