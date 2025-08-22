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
  Tab
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import { createPriorityDirection, updatePriorityDirection } from '@/app/actions/dictionaries'

interface PriorityDirectionFormProps {
  direction?: any
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

export default function PriorityDirectionForm({ direction }: PriorityDirectionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tabValue, setTabValue] = useState(0)
  
  const [formData, setFormData] = useState({
    order: direction?.order || 0,
    translations: {
      ru: direction?.translations?.find((t: any) => t.languageCode === 'ru')?.name || '',
      kz: direction?.translations?.find((t: any) => t.languageCode === 'kz')?.name || '',
      en: direction?.translations?.find((t: any) => t.languageCode === 'en')?.name || ''
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

      if (direction) {
        await updatePriorityDirection(direction.id, formData)
      } else {
        await createPriorityDirection(formData)
      }
      
      router.push('/admin/dictionaries/directions')
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
        <Grid item xs={12} md={6}>
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
              label="Название направления"
              value={formData.translations.ru}
              onChange={(e) => setFormData({
                ...formData,
                translations: { ...formData.translations, ru: e.target.value }
              })}
              placeholder="Например: Информационные технологии"
              multiline
              rows={2}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TextField
              fullWidth
              label="Бағыт атауы"
              value={formData.translations.kz}
              onChange={(e) => setFormData({
                ...formData,
                translations: { ...formData.translations, kz: e.target.value }
              })}
              placeholder="Мысалы: Ақпараттық технологиялар"
              multiline
              rows={2}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <TextField
              fullWidth
              label="Direction name"
              value={formData.translations.en}
              onChange={(e) => setFormData({
                ...formData,
                translations: { ...formData.translations, en: e.target.value }
              })}
              placeholder="For example: Information Technology"
              multiline
              rows={2}
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
          onClick={() => router.push('/admin/dictionaries/directions')}
          disabled={loading}
        >
          Отмена
        </Button>
      </Box>
    </form>
  )
}