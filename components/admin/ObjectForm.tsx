'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Tabs,
  Tab,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  FormHelperText,
  Switch
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import { createObject, updateObject } from '@/app/actions/objects'
import { ObjectFormData } from '@/lib/types'

interface ObjectFormProps {
  object?: any
  types: any[]
  regions: any[]
  directions: any[]
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

export default function ObjectForm({ object, types, regions, directions }: ObjectFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tabValue, setTabValue] = useState(0)
  
  const [formData, setFormData] = useState<ObjectFormData>({
    infrastructureTypeId: object?.infrastructureTypeId || '',
    regionId: object?.regionId || '',
    latitude: object?.latitude || undefined,
    longitude: object?.longitude || undefined,
    googleMapsUrl: object?.googleMapsUrl || '',
    website: object?.website || '',
    contactPhones: object?.contactPhones || [],
    priorityDirections: object?.priorityDirections?.map((pd: any) => pd.priorityDirectionId) || [],
    translations: {
      ru: {
        name: object?.translations?.find((t: any) => t.languageCode === 'ru')?.name || '',
        address: object?.translations?.find((t: any) => t.languageCode === 'ru')?.address || '',
        isPublished: object?.translations?.find((t: any) => t.languageCode === 'ru')?.isPublished || false
      },
      kz: object?.translations?.find((t: any) => t.languageCode === 'kz') ? {
        name: object.translations.find((t: any) => t.languageCode === 'kz').name,
        address: object.translations.find((t: any) => t.languageCode === 'kz').address,
        isPublished: object.translations.find((t: any) => t.languageCode === 'kz').isPublished
      } : undefined,
      en: object?.translations?.find((t: any) => t.languageCode === 'en') ? {
        name: object.translations.find((t: any) => t.languageCode === 'en').name,
        address: object.translations.find((t: any) => t.languageCode === 'en').address,
        isPublished: object.translations.find((t: any) => t.languageCode === 'en').isPublished
      } : undefined
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (object) {
        await updateObject(object.id, formData)
      } else {
        const result = await createObject(formData)
        if (result.success && result.id) {
          router.push(`/admin/objects/${result.id}`)
          return
        }
      }
      router.push('/admin/objects')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Произошла ошибка при сохранении')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneAdd = () => {
    const phone = prompt('Введите номер телефона:')
    if (phone) {
      setFormData({
        ...formData,
        contactPhones: [...(formData.contactPhones || []), phone]
      })
    }
  }

  const handlePhoneRemove = (index: number) => {
    setFormData({
      ...formData,
      contactPhones: formData.contactPhones?.filter((_, i) => i !== index)
    })
  }

  const handleDirectionToggle = (directionId: string) => {
    const currentDirections = formData.priorityDirections
    if (currentDirections.includes(directionId)) {
      setFormData({
        ...formData,
        priorityDirections: currentDirections.filter(id => id !== directionId)
      })
    } else {
      setFormData({
        ...formData,
        priorityDirections: [...currentDirections, directionId]
      })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Тип инфраструктуры</InputLabel>
            <Select
              value={formData.infrastructureTypeId}
              onChange={(e) => setFormData({ ...formData, infrastructureTypeId: e.target.value })}
              label="Тип инфраструктуры"
            >
              {types.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: type.markerColor,
                        mr: 1
                      }}
                    />
                    {type.translations[0]?.name || type.code}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Регион</InputLabel>
            <Select
              value={formData.regionId}
              onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
              label="Регион"
            >
              {regions.map((region) => (
                <MenuItem key={region.id} value={region.id}>
                  {region.translations[0]?.name || region.code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Широта"
            type="number"
            value={formData.latitude || ''}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
            inputProps={{ step: 'any', min: -90, max: 90 }}
            helperText="От -90 до 90"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Долгота"
            type="number"
            value={formData.longitude || ''}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
            inputProps={{ step: 'any', min: -180, max: 180 }}
            helperText="От -180 до 180"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Веб-сайт"
            type="url"
            value={formData.website || ''}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            helperText="Например: https://example.com"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Google Maps URL"
            value={formData.googleMapsUrl || ''}
            onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
            helperText="Ссылка на Google Maps"
          />
        </Grid>

        <Grid item xs={12}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Телефоны
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {formData.contactPhones?.map((phone, index) => (
                <Chip
                  key={index}
                  label={phone}
                  onDelete={() => handlePhoneRemove(index)}
                />
              ))}
            </Box>
            <Button size="small" onClick={handlePhoneAdd}>
              Добавить телефон
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Приоритетные направления
          </Typography>
          <FormGroup row>
            {directions.map((direction) => (
              <FormControlLabel
                key={direction.id}
                control={
                  <Checkbox
                    checked={formData.priorityDirections.includes(direction.id)}
                    onChange={() => handleDirectionToggle(direction.id)}
                  />
                }
                label={direction.translations[0]?.name || ''}
              />
            ))}
          </FormGroup>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Переводы
          </Typography>
          
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Русский (обязательно)" />
            <Tab label="Қазақша" />
            <Tab label="English" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Название"
                  value={formData.translations.ru.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    translations: {
                      ...formData.translations,
                      ru: { ...formData.translations.ru, name: e.target.value }
                    }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={3}
                  label="Адрес"
                  value={formData.translations.ru.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    translations: {
                      ...formData.translations,
                      ru: { ...formData.translations.ru, address: e.target.value }
                    }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.translations.ru.isPublished}
                      onChange={(e) => setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          ru: { ...formData.translations.ru, isPublished: e.target.checked }
                        }
                      })}
                    />
                  }
                  label="Опубликовать"
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Атауы"
                  value={formData.translations.kz?.name || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    translations: {
                      ...formData.translations,
                      kz: {
                        name: e.target.value,
                        address: formData.translations.kz?.address || '',
                        isPublished: formData.translations.kz?.isPublished || false
                      }
                    }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Мекенжайы"
                  value={formData.translations.kz?.address || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    translations: {
                      ...formData.translations,
                      kz: {
                        name: formData.translations.kz?.name || '',
                        address: e.target.value,
                        isPublished: formData.translations.kz?.isPublished || false
                      }
                    }
                  })}
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.translations.en?.name || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    translations: {
                      ...formData.translations,
                      en: {
                        name: e.target.value,
                        address: formData.translations.en?.address || '',
                        isPublished: formData.translations.en?.isPublished || false
                      }
                    }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Address"
                  value={formData.translations.en?.address || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    translations: {
                      ...formData.translations,
                      en: {
                        name: formData.translations.en?.name || '',
                        address: e.target.value,
                        isPublished: formData.translations.en?.isPublished || false
                      }
                    }
                  })}
                />
              </Grid>
            </Grid>
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
          onClick={() => router.push('/admin/objects')}
          disabled={loading}
        >
          Отмена
        </Button>
      </Box>
    </form>
  )
}