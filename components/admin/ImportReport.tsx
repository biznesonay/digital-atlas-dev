import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
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

  const formatErrorValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') {
      return '-'
    }

    if (value instanceof Date) {
      return value.toISOString()
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value)
    }

    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
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
             rowErrors.map((error, index) => {
              <TableRow key={`${row}-${index}`}>
              const displayValue = formatErrorValue(error.value)
                <TableCell>

                  <Typography variant="body2" fontWeight="bold">
              return (
                    {row}
                <TableRow key={`${row}-${index}`}>
                  </Typography>
                  <TableCell>
                </TableCell>
                    <Typography variant="body2" fontWeight="bold">
                <TableCell>
                      {row}
                  <Chip
                    </Typography>
                    label={getFieldLabel(error.field)}
                  </TableCell>
                    size="small"
                  <TableCell>
                    color={getSeverity(error.field)}
                    <Chip
                    variant="outlined"
                      label={getFieldLabel(error.field)}
                  />
                      size="small"
                </TableCell>
                      color={getSeverity(error.field)}
                <TableCell>
                      variant="outlined"
                  <Typography
                    />
                    variant="body2"
                  </TableCell>
                    sx={{
                  <TableCell>
                      maxWidth: 200,
                    <Typography
                      overflow: 'hidden',
                      variant="body2"
                      textOverflow: 'ellipsis',
                      sx={{
                      whiteSpace: 'nowrap'
                        maxWidth: 200,
                    }}
                        overflow: 'hidden',
                    title={String(error.value || '-')}
                        textOverflow: 'ellipsis',
                  >
                        whiteSpace: 'nowrap'
                    {error.value || '-'}
                      }}
                  </Typography>
                      title={displayValue}
                </TableCell>
                    >
                <TableCell>
                      {displayValue}
                  <Typography variant="body2" color="error">
                    </Typography>
                    {error.message}
                  </TableCell>
                  </Typography>
                  <TableCell>
                </TableCell>
                    <Typography variant="body2" color="error">
              </TableRow>
                      {error.message}
            ))
                    </Typography>
                  </TableCell>
                </TableRow>
              )
            })
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}