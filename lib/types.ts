// Branded types для безопасной работы с координатами
export type Latitude = number & { __brand: 'Latitude' }
export type Longitude = number & { __brand: 'Longitude' }

// Type guards
export function isValidLatitude(value: number): value is Latitude {
  return value >= -90 && value <= 90
}

export function isValidLongitude(value: number): value is Longitude {
  return value >= -180 && value <= 180
}

// Конструкторы
export function createLatitude(value: number): Latitude {
  if (!isValidLatitude(value)) {
    throw new Error(`Invalid latitude: ${value}. Must be between -90 and 90`)
  }
  return value as Latitude
}

export function createLongitude(value: number): Longitude {
  if (!isValidLongitude(value)) {
    throw new Error(`Invalid longitude: ${value}. Must be between -180 and 180`)
  }
  return value as Longitude
}

// Тип для координат
export interface Coordinates {
  lat: Latitude
  lng: Longitude
}

// Тип для безопасного создания координат
export function createCoordinates(lat: number, lng: number): Coordinates {
  return {
    lat: createLatitude(lat),
    lng: createLongitude(lng)
  }
}

// Проверка валидности координат
export function areCoordinatesValid(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return false
  }
  return isValidLatitude(lat) && isValidLongitude(lng)
}

// Типы для API ответов
export interface ApiObject {
  id: string
  latitude: number | null
  longitude: number | null
  website: string | null
  googleMapsUrl: string | null
  contactPhones: string[] | null
  type: {
    id: string
    code: string
    color: string
    name: string
  }
  region: {
    id: string
    code: string
    name: string
  }
  name: string
  address: string
  directions: Array<{
    id: string
    name: string
  }>
}

export interface ObjectsApiResponseMeta {
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ObjectsApiResponse {
  data: ApiObject[]
  meta: ObjectsApiResponseMeta
}

// Тип для фильтров
export interface MapFilters {
  search: string
  typeIds: string[]
  regionIds: string[]
  directionIds: string[]
  lang: 'ru' | 'kz' | 'en'
  page?: number
  limit?: number
}

// Тип для маркера на карте
export interface MapMarker {
  id: string
  position: google.maps.LatLng
  type: string
  color: string
  title: string
  address: string
  directions: string[]
  website?: string
  phones?: string[]
  region: string
}

// Типы для форм
export interface ObjectFormData {
  infrastructureTypeId: string
  regionId: string
  latitude?: number
  longitude?: number
  googleMapsUrl?: string
  website?: string
  contactPhones?: string[]
  priorityDirections: string[]
  translations: {
    ru: {
      name: string
      address: string
      isPublished: boolean
    }
    kz?: {
      name: string
      address: string
      isPublished: boolean
    }
    en?: {
      name: string
      address: string
      isPublished: boolean
    }
  }
}

// Типы для справочников
export interface DictionaryItem {
  id: string
  code?: string
  order: number
  translations: Array<{
    languageCode: string
    name: string
  }>
}