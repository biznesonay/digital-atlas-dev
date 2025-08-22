'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DownloadIcon from '@mui/icons-material/Download'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import ImportReport from '@/components/admin/ImportReport'
import { generateImportTemplate, importObjects } from '@/app/actions/import'
import { ImportResult } from '@/lib/types'

const steps = ['Скачать шаблон', 'Загрузить файл', 'Результаты импорта']

export default function ImportPage() {
  const [activeStep, setActiveStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true)
      const template = await generateImportTemplate()
      
      // Создание ссылки для скачивания
      const blob = new Blob(
        [Buffer.from(template.data, 'base64')],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = template.filename
      a.click()
      URL.revokeObjectURL(url)
      
      setActiveStep(1)
    } catch (error: any) {
      setError(error.message || 'Ошибка при генерации шаблона')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx')) {
        setError('Поддерживается только формат .xlsx')
        return
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Размер файла не должен превышать 10MB')
        return
      }
      
      setFile(selectedFile)
      setError('')
    }
  }

  const handleImport = async () => {
    if (!file) return
    
    setLoading(true)
    setError('')
    
    try {
      // Конвертация файла в base64
      const reader = new FileReader()
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => {
          if (e.target?.result) {
            const base64 = (e.target.result as string).split(',')[1]
            resolve(base64)
          } else {
            reject(new Error('Не удалось прочитать файл'))
          }
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      
      const result = await importObjects(fileData, file.name)
      setImportResult(result)
      setActiveStep(2)
    } catch (error: any) {
      setError(error.message || 'Ошибка при импорте данных')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setActiveStep(0)
    setFile(null)
    setImportResult(null)
    setError('')
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Импорт данных из Excel
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Шаг 1: Скачайте шаблон Excel
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Шаблон содержит все необходимые колонки и пример заполнения.
                Обязательно следуйте формату шаблона для успешного импорта.
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Требования к данным:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Обязательные поля: Название (RU), Адрес (RU), Тип инфраструктуры, Регион" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Максимум 1000 строк за один импорт" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Типы и регионы должны точно соответствовать справочникам системы" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Координаты: широта от -90 до 90, долгота от -180 до 180" />
                  </ListItem>
                </List>
              </Box>

              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
                onClick={handleDownloadTemplate}
                disabled={loading}
                size="large"
                sx={{ mt: 2 }}
              >
                {loading ? 'Генерация...' : 'Скачать шаблон'}
              </Button>
            </CardContent>
          </Card>
        )}

        {activeStep === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Шаг 2: Загрузите заполненный файл
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Выберите Excel файл с данными для импорта.
                Убедитесь, что файл соответствует шаблону.
              </Typography>

              <Box sx={{ mt: 3 }}>
                <input
                  accept=".xlsx"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    size="large"
                  >
                    Выбрать файл
                  </Button>
                </label>

                {file && (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="info">
                      Выбран файл: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </Alert>
                  </Box>
                )}
              </Box>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setActiveStep(0)}
                >
                  Назад
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                  onClick={handleImport}
                  disabled={!file || loading}
                >
                  {loading ? 'Импорт...' : 'Начать импорт'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {activeStep === 2 && importResult && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Шаг 3: Результаты импорта
              </Typography>

              <Box sx={{ display: 'flex', gap: 3, mt: 3 }}>
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1">
                        Успешно импортировано
                      </Typography>
                    </Box>
                    <Typography variant="h4" color="success.main">
                      {importResult.imported}
                    </Typography>
                  </CardContent>
                </Card>

                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ErrorIcon color="error" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1">
                        Ошибки при импорте
                      </Typography>
                    </Box>
                    <Typography variant="h4" color="error.main">
                      {importResult.failed}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {importResult.errors.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Детальный отчет об ошибках:
                  </Typography>
                  <ImportReport errors={importResult.errors} />
                </Box>
              )}

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleReset}
                >
                  Новый импорт
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Paper>
    </Box>
  )
}