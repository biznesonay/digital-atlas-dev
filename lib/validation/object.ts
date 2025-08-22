import { z } from 'zod'

// Валидация координат
const latitudeSchema = z.number().gte(-90).lte(90)
const longitudeSchema = z.number().gte(-180).lte(180)

// Преобразование пустых строк в undefined
const emptyToUndefined = z.string().trim().transform(v => (v === '' ? undefined : v))

// Валидация телефона
const phoneSchema = z.string()
  .min(3, 'Телефон слишком короткий')
  .regex(/^[\d\s\-\+\(\)]+$/, 'Неверный формат телефона')

// Валидация URL
const urlSchema = z.string().url('Неверный формат URL').or(z.literal(''))

// Схема перевода
const translationSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(1000, 'Название слишком длинное'),
  address: z.string().min(1, 'Адрес обязателен').max(1000, 'Адрес слишком длинный'),
  isPublished: z.boolean().default(false)
})

// Основная схема объекта
const baseObjectSchema = z.object({
  infrastructureTypeId: z.string().uuid('Неверный ID типа инфраструктуры'),
  regionId: z.string().uuid('Неверный ID региона'),
  latitude: latitudeSchema.optional().nullable(),
  longitude: longitudeSchema.optional().nullable(),
  googleMapsUrl: emptyToUndefined.optional(),
  website: urlSchema.optional().or(emptyToUndefined),
  contactPhones: z.array(phoneSchema).optional().nullable(),
  priorityDirections: z.array(z.string().uuid('Неверный ID направления')).default([]),
  translations: z.object({
    ru: translationSchema,
    kz: translationSchema.optional(),
    en: translationSchema.optional()
  })
})

export const objectSchema = baseObjectSchema.refine(
  (data) => {
    // Проверка парности координат
    const hasLat = data.latitude !== null && data.latitude !== undefined
    const hasLng = data.longitude !== null && data.longitude !== undefined
    return (!hasLat && !hasLng) || (hasLat && hasLng)
  },
  {
    message: 'Координаты должны быть указаны парой (широта и долгота)',
    path: ['latitude']
  }
)

// Схема для запроса списка объектов
export const objectsQuerySchema = z.object({
  lang: z.enum(['ru', 'kz', 'en']).default('ru'),
  search: z.string().optional(),
  regionIds: z.array(z.string().uuid()).optional(),
  typeIds: z.array(z.string().uuid()).optional(),
  directionIds: z.array(z.string().uuid()).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50)
})

// Схема для создания объекта
export const createObjectSchema = objectSchema

// Схема для обновления объекта (все поля опциональны)
export const updateObjectSchema = baseObjectSchema.partial()

// Типы
export type ObjectFormData = z.infer<typeof objectSchema>
export type CreateObjectInput = z.infer<typeof createObjectSchema>
export type UpdateObjectInput = z.infer<typeof updateObjectSchema>
export type ObjectsQuery = z.infer<typeof objectsQuerySchema>