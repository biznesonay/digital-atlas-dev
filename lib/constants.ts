// Границы Казахстана
export const KAZAKHSTAN_BOUNDS = {
  north: 55.45,
  south: 40.56,
  west: 46.49,
  east: 87.31
}

// Центр Казахстана
export const KAZAKHSTAN_CENTER = {
  lat: 48.0196,
  lng: 66.9237
}

// Настройки карты по умолчанию
export const DEFAULT_MAP_OPTIONS: google.maps.MapOptions = {
  zoom: 5,
  center: KAZAKHSTAN_CENTER,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  zoomControl: true,
  restriction: {
    latLngBounds: KAZAKHSTAN_BOUNDS,
    strictBounds: false
  }
}

// Настройки кластеризации
export const CLUSTER_OPTIONS = {
  gridSize: 60,
  minimumClusterSize: 2,
  maxZoom: 15,
  styles: [] // будут переопределены custom renderer
}

// Цвета маркеров по типам инфраструктуры
export const MARKER_COLORS = {
  SEZ: "#1976D2",
  TECHNOPARK: "#388E3C", 
  INCUBATOR: "#7B1FA2",
  IT_HUB: "#F57C00",
  VC_FUND: "#D32F2F"
} as const

// Поддерживаемые языки
export const SUPPORTED_LANGUAGES = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'kz', name: 'Қазақша', flag: '🇰🇿' },
  { code: 'en', name: 'English', flag: '🇬🇧' }
] as const

export type LanguageCode = 'ru' | 'kz' | 'en'

// Размеры иконок маркеров
export const MARKER_SIZES = {
  small: 32,
  medium: 40,
  large: 48
} as const

// Статусы геокодирования
export const GEOCODING_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  MANUAL: 'MANUAL'
} as const

// Настройки дебаунса для поиска
export const SEARCH_DEBOUNCE_MS = 300

// Максимальное количество объектов на странице
export const OBJECTS_PER_PAGE = 50

// Ограничения для импорта
export const IMPORT_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_ROWS: 1000,
  BATCH_SIZE: 100
}

// Регулярные выражения для валидации
export const VALIDATION_PATTERNS = {
  PHONE: /^[\d\s\-\+\(\)]+$/,
  URL: /^https?:\/\/.+/
}

// Роли пользователей
export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  EDITOR: 'EDITOR'
} as const

// Цвета темы Material-UI
export const THEME_COLORS = {
  primary: '#1976D2',
  secondary: '#388E3C',
  headerBg: '#1c296a',
  background: '#F5F5F5',
  error: '#D32F2F',
  warning: '#F57C00',
  info: '#1976D2',
  success: '#388E3C'
}