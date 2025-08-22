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
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import ColorLensIcon from '@mui/icons-material/ColorLens'
import { createInfrastructureType, updateInfrastructureType } from '@/app/actions/dictionaries'

interface InfrastructureTypeFormProps {
  type?: any
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export default function InfrastructureTypeForm({ type }: InfrastructureTypeFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tabValue, setTabValue] = useState(0)
  
  const [formData, setFormData] = useState({
    code: type?.code || '',
    markerColor: type?.markerColor || '#1976D2',
    order: type?.order || 0,
    translations: {
      ru: type?.translations?.find((t: any) => t.languageCode === 'ru')?.name || '',
      kz: type?.translations?.find((t: any) => t.languageCode === 'kz')?.name || '',
      en: type?.translations?.find((t: any) => t.languageCode === 'en')?.name || ''
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!formData.translations.ru) {
        throw new Error('Название на русском языке обязательно')
      }

      if (type) {
        await updateInfrastructureType(type.id, formData)
      } else {
        await createInfrastructureType(formData)
      }
      
      router.push('/admin/dictionaries/types')
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
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            required
            label="Код"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            helperText="Уникальный код типа (например: SEZ, TECHNOPARK)"
            inputProps={{ maxLength: 50 }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            required
            label="Цвет маркера"
            type="color"
            value={formData.markerColor}
            onChange={(e) => setFormData({ ...formData, markerColor: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ColorLensIcon />
                </InputAdornment>
              )
            }}
            helperText="Цвет для отображения на карте"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            required
            label="Порядок сортировки"
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
            inputProps={{ min: 0 }}
            helperText="Порядок отображения в списках"
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="subtitle1">
              Предпросмотр маркера:
            </Typography>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: formData.markerColor,
                border: '3px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {formData.markerColor}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Названия на разных языках
          </Typography>
          
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Русский (обязательно)" />
            <Tab label="Қазақша" />
            <Tab label="English" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <TextField
              fullWidth
              required
              label="Название типа"
              value={formData.translations.ru}
              onChange={(e) => setFormData({
                ...formData,
                translations: { ...formData.translations, ru: e.target.value }
              })}
              placeholder="Например: Технопарк"
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TextField
              fullWidth
              label="Түр атауы"
              value={formData.translations.kz}
              onChange={(e) => setFormData({
                ...formData,
                translations: { ...formData.translations, kz: e.target.value }
              })}
              placeholder="Мысалы: Технопарк"
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <TextField
              fullWidth
              label="Type name"
              value={formData.translations.en}
              onChange={(e) => setFormData({
                ...formData,
                translations: { ...formData.translations, en: e.target.value }
              })}
              placeholder="For example: Technopark"
            />
          </TabPanel>
        </Grid>
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
          onClick={() => router.push('/admin/dictionaries/types')}
          disabled={loading}
        >
          Отмена
        </Button>
      </Box>
    </form>
  )
}