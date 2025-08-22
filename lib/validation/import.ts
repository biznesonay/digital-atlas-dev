import { z } from 'zod'

// Схема для строки импорта
export const importRowSchema = z.object({
  // Обязательные поля
  name_ru: z.string().min(1, 'Название на русском обязательно').max(1000),
  address_ru: z.string().min(1, 'Адрес на русском обязателен').max(1000),
  type: z.string().min(1, 'Тип инфраструктуры обязателен'),
  region: z.string().min(1, 'Регион обязателен'),
  
  // Опциональные переводы
  name_kz: z.string().max(1000).optional().nullable(),
  name_en: z.string().max(1000).optional().nullable(),
  address_kz: z.string().max(1000).optional().nullable(),
  address_en: z.string().max(1000).optional().nullable(),
  
  // Опциональные поля
  directions: z.string().optional().nullable(), // Разделенные запятой
  latitude: z.coerce.number().gte(-90).lte(90).optional().nullable(),
  longitude: z.coerce.number().gte(-180).lte(180).optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  phones: z.string().optional().nullable(), // Разделенные запятой
  googleMapsUrl: z.string().optional().nullable()
}).refine(
  (data) => {
    // Проверка парности координат
    const hasLat = data.latitude !== null && data.latitude !== undefined
    const hasLng = data.longitude !== null && data.longitude !== undefined
    return (!hasLat && !hasLng) || (hasLat && hasLng)
  },
  {
    message: 'Координаты должны быть указаны парой',
    path: ['latitude']
  }
)

// Схема для валидации файла импорта
export const importFileSchema = z.object({
  filename: z.string().endsWith('.xlsx', 'Поддерживается только формат .xlsx'),
  size: z.number().max(10 * 1024 * 1024, 'Размер файла не должен превышать 10MB'),
  rows: z.array(importRowSchema).max(1000, 'Максимум 1000 строк за один импорт')
})

// Типы
export type ImportRow = z.infer<typeof importRowSchema>
export type ImportFile = z.infer<typeof importFileSchema>

// Функция для валидации и нормализации строки импорта
export function validateImportRow(row: any, rowIndex: number): {
  valid: boolean
  data?: ImportRow
  errors?: Array<{ field: string; message: string }>
} {
  try {
    const data = importRowSchema.parse(row)
    return { valid: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      return { valid: false, errors }
    }
    return {
      valid: false,
      errors: [{ field: 'unknown', message: 'Неизвестная ошибка валидации' }]
    }
  }
}

// Маппинг названий колонок Excel на поля схемы
export const EXCEL_COLUMN_MAPPING = {
  'Название (RU)': 'name_ru',
  'Название (KZ)': 'name_kz',
  'Название (EN)': 'name_en',
  'Адрес (RU)': 'address_ru',
  'Адрес (KZ)': 'address_kz',
  'Адрес (EN)': 'address_en',
  'Тип инфраструктуры': 'type',
  'Регион': 'region',
  'Приоритетные направления': 'directions',
  'Широта': 'latitude',
  'Долгота': 'longitude',
  'Веб-сайт': 'website',
  'Телефоны': 'phones',
  'Google Maps URL': 'googleMapsUrl'
} as const

// Обратный маппинг для генерации шаблона
export const TEMPLATE_COLUMNS = Object.keys(EXCEL_COLUMN_MAPPING)

// Функция для преобразования строки Excel в объект для валидации
export function mapExcelRow(excelRow: any): any {
  const mappedRow: any = {}
  
  for (const [excelKey, schemaKey] of Object.entries(EXCEL_COLUMN_MAPPING)) {
    if (excelRow[excelKey] !== undefined) {
      mappedRow[schemaKey] = excelRow[excelKey]
    }
  }
  
  return mappedRow
}