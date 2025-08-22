import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Typography
} from '@mui/material'
import { ImportError } from '@/lib/types'

interface ImportReportProps {
  errors: ImportError[]
}

export default function ImportReport({ errors }: ImportReportProps) {
  // Группировка ошибок по строкам
  const errorsByRow = errors.reduce((acc, error) => {
    if (!acc[error.row]) {
      acc[error.row] = []
    }
    acc[error.row].push(error)
    return acc
  }, {} as Record<number, ImportError[]>)

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      name_ru: 'Название (RU)',
      name_kz: 'Название (KZ)',
      name_en: 'Название (EN)',
      address_ru: 'Адрес (RU)',
      address_kz: 'Адрес (KZ)',
      address_en: 'Адрес (EN)',
      type: 'Тип инфраструктуры',
      region: 'Регион',
      directions: 'Приоритетные направления',
      latitude: 'Широта',
      longitude: 'Долгота',
      website: 'Веб-сайт',
      phones: 'Телефоны',
      googleMapsUrl: 'Google Maps URL',
      general: 'Общая ошибка'
    }
    return labels[field] || field
  }

  const getSeverity = (field: string): 'error' | 'warning' => {
    const criticalFields = ['name_ru', 'address_ru', 'type', 'region', 'general']
    return criticalFields.includes(field) ? 'error' : 'warning'
  }

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell width={80}>Строка</TableCell>
            <TableCell>Поле</TableCell>
            <TableCell>Значение</TableCell>
            <TableCell>Описание ошибки</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(errorsByRow).map(([row, rowErrors]) => (
            rowErrors.map((error, index) => (
              <TableRow key={`${row}-${index}`}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {row}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getFieldLabel(error.field)}
                    size="small"
                    color={getSeverity(error.field)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={String(error.value || '-')}
                  >
                    {error.value || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="error">
                    {error.message}
                  </Typography>
                </TableCell>
              </TableRow>
            ))
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}