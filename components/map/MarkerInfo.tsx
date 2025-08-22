import { Box, Typography, Chip, Link, Stack } from '@mui/material'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import LanguageIcon from '@mui/icons-material/Language'
import PhoneIcon from '@mui/icons-material/Phone'
import DirectionsIcon from '@mui/icons-material/Directions'

interface MarkerInfoProps {
  object: any
  language: string
}

export default function MarkerInfo({ object, language }: MarkerInfoProps) {
  const labels = {
    ru: {
      type: 'Тип',
      region: 'Регион',
      address: 'Адрес',
      directions: 'Направления',
      website: 'Веб-сайт',
      phones: 'Телефоны',
      openInMaps: 'Открыть в Google Maps'
    },
    kz: {
      type: 'Түрі',
      region: 'Аймақ',
      address: 'Мекенжай',
      directions: 'Бағыттар',
      website: 'Веб-сайт',
      phones: 'Телефондар',
      openInMaps: 'Google Maps-та ашу'
    },
    en: {
      type: 'Type',
      region: 'Region',
      address: 'Address',
      directions: 'Directions',
      website: 'Website',
      phones: 'Phones',
      openInMaps: 'Open in Google Maps'
    }
  }

  const t = labels[language as keyof typeof labels] || labels.ru

  return (
    <Box sx={{ minWidth: 280, maxWidth: 350, p: 1 }}>
      <Typography variant="h6" gutterBottom>
        {object.name}
      </Typography>

      {object.type && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {t.type}:
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
      )}

      {object.region && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {t.region}:
          </Typography>
          <Typography variant="body2">
            {object.region.name}
          </Typography>
        </Box>
      )}

      {object.address && (
        <Box sx={{ mb: 1, display: 'flex', alignItems: 'flex-start' }}>
          <LocationOnIcon sx={{ fontSize: 16, mt: 0.3, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2">
            {object.address}
          </Typography>
        </Box>
      )}

      {object.directions && object.directions.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {t.directions}:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
            {object.directions.map((dir: any) => (
              <Chip 
                key={dir.id} 
                label={dir.name} 
                size="small" 
                variant="outlined"
                sx={{ mb: 0.5 }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {object.website && (
        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
          <LanguageIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
          <Link 
            href={object.website} 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{ fontSize: '0.875rem' }}
          >
            {t.website}
          </Link>
        </Box>
      )}

      {object.contactPhones && object.contactPhones.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PhoneIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {t.phones}:
            </Typography>
          </Box>
          {object.contactPhones.map((phone: string, index: number) => (
            <Typography key={index} variant="body2">
              {phone}
            </Typography>
          ))}
        </Box>
      )}

      {object.googleMapsUrl && (
        <Box sx={{ mt: 2 }}>
          <Link 
            href={object.googleMapsUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              fontSize: '0.875rem'
            }}
          >
            <DirectionsIcon sx={{ fontSize: 16, mr: 0.5 }} />
            {t.openInMaps}
          </Link>
        </Box>
      )}
    </Box>
  )
}