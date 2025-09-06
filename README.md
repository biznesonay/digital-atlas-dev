# Цифровой атлас инновационной инфраструктуры Казахстана

## 📋 О проекте

Веб-приложение с интерактивной картой объектов инновационной инфраструктуры Казахстана. Проект включает публичную карту с фильтрами и административную панель для управления данными.

### Основные возможности:
- 🗺️ Интерактивная карта Google Maps с кластеризацией
- 🔍 Фильтры по типам, регионам и направлениям
- 🌐 Мультиязычность (RU/KZ/EN)
- 👤 Система авторизации и ролей
- 📊 Административная панель
- 📁 Импорт данных из Excel
- 📚 Управление справочниками

## 🚀 Быстрый старт

### Предварительные требования:
- Node.js 20.18.0 LTS или выше
- PostgreSQL 16 LTS или выше
- Google Maps API Key

### 1. Клонирование и установка

```bash
# Создание директории проекта
mkdir digital-atlas
cd digital-atlas

# Инициализация проекта
npm init -y

# Установка всех зависимостей одной командой
npm install next@14.2.15 react@18.3.1 react-dom@18.3.1 typescript@5.6.3 @react-google-maps/api@2.19.3 @googlemaps/markerclusterer@2.6.1 @mui/material@5.16.7 @mui/icons-material@5.16.7 @emotion/react@11.13.3 @emotion/styled@11.13.0 next-auth@4.24.7 prisma@5.20.0 @prisma/client@5.20.0 zod@3.23.8 bcrypt@5.1.1 exceljs@4.4.0

# Установка dev-зависимостей
npm install --save-dev @types/bcrypt @types/node @types/react @types/react-dom eslint eslint-config-next
```

### 2. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
# База данных PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/digital_atlas?schema=public"

# NextAuth настройки
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-minimum-32-characters"

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
NEXT_PUBLIC_GOOGLE_MAP_ID="your-map-id"
GOOGLE_GEOCODING_API_KEY="your-google-geocoding-api-key"

# URL приложения
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Настройки кэширования (в секундах)
CACHE_REVALIDATE_SECONDS=600

# Порог для SuperCluster алгоритма
NEXT_PUBLIC_SUPER_CLUSTER_THRESHOLD=3000

# Уровень логирования
LOG_LEVEL=info

# Демонстрационные учетные данные для dev (опционально)
NEXT_PUBLIC_DEMO_CREDENTIALS="Email: admin@example.com\nПароль: admin123"
```

#### Получение Google Maps API Key:
1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите следующие API:
   - Maps JavaScript API
   - Geocoding API (опционально)
4. Создайте API ключ в разделе "Credentials"
5. Ограничьте ключ по домену для безопасности

#### Генерация NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 3. Настройка базы данных

```bash
# Создание базы данных
createdb digital_atlas

# Или через psql
psql -U postgres
CREATE DATABASE digital_atlas;
\q

# Генерация Prisma Client
npx prisma generate

# Применение схемы к БД
npx prisma db push

# Загрузка начальных данных
npx prisma db seed
```

### 4. Запуск проекта

```bash
# Режим разработки
npm run dev

# Сборка для продакшена
npm run build
npm run start
```

### 5. Доступ к приложению

- **Главная страница:** http://localhost:3000
- **Админ-панель:** http://localhost:3000/admin

Для локальной разработки можно задать переменную окружения `NEXT_PUBLIC_DEMO_CREDENTIALS`, чтобы вывести подсказку с тестовыми данными на странице входа. В продакшене подсказка не отображается.

## 📁 Структура проекта

```
digital-atlas/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Главный layout
│   ├── page.tsx             # Главная страница с картой
│   ├── admin/               # Административная панель
│   │   ├── dashboard/       # Главная админки
│   │   ├── objects/         # Управление объектами
│   │   ├── import/          # Импорт из Excel
│   │   ├── dictionaries/    # Справочники
│   │   └── users/           # Управление пользователями
│   ├── api/                 # API endpoints
│   └── actions/             # Server Actions
├── components/              # React компоненты
│   ├── map/                # Компоненты карты
│   ├── admin/              # Компоненты админки
│   └── shared/             # Общие компоненты
├── lib/                    # Утилиты и конфигурация
│   ├── auth.ts            # NextAuth конфигурация
│   ├── prisma.ts          # Prisma клиент
│   ├── theme.ts           # Material-UI тема
│   ├── constants.ts       # Константы
│   ├── types.ts           # TypeScript типы
│   └── validation/        # Zod схемы
├── prisma/                 # База данных
│   ├── schema.prisma      # Схема БД
│   └── seed.ts            # Начальные данные
├── public/                 # Статические файлы
├── types/                  # Дополнительные типы
└── middleware.ts           # Next.js middleware
```

## 🔧 Доступные скрипты

```json
{
  "dev": "next dev",                    // Запуск в режиме разработки
  "build": "next build",                // Сборка для продакшена
  "start": "next start",                // Запуск продакшен сборки
  "lint": "next lint",                  // Проверка кода
  "prisma:generate": "prisma generate", // Генерация Prisma Client
  "prisma:push": "prisma db push",      // Применение схемы к БД
  "prisma:seed": "prisma db seed",      // Загрузка начальных данных
  "prisma:studio": "prisma studio"      // GUI для БД
}
```

## 📊 Функциональность

### Публичная часть:
- ✅ Интерактивная карта с маркерами объектов
- ✅ Кластеризация маркеров при масштабировании
- ✅ Фильтры по типам инфраструктуры
- ✅ Фильтры по регионам
- ✅ Фильтры по приоритетным направлениям
- ✅ Поиск по названию и адресу
- ✅ Список объектов в модальном окне
- ✅ Информационные окна маркеров
- ✅ Мультиязычность (RU/KZ/EN)

### Административная панель:
- ✅ Авторизация и роли (SUPER_ADMIN, EDITOR)
- ✅ Dashboard со статистикой
- ✅ CRUD операции для объектов
- ✅ Мультиязычные переводы для объектов
- ✅ Импорт данных из Excel
- ✅ Валидация импортируемых данных
- ✅ Управление типами инфраструктуры
- ✅ Управление регионами
- ✅ Управление приоритетными направлениями
- ✅ Управление пользователями
- ✅ Сброс паролей пользователей

## 🔐 Роли и права доступа

### EDITOR (Редактор):
- Просмотр dashboard
- Создание и редактирование объектов
- Импорт данных из Excel
- Просмотр справочников (без редактирования)

### SUPER_ADMIN (Суперадминистратор):
- Все права редактора
- Управление справочниками
- Управление пользователями
- Доступ ко всем разделам системы

## 📝 Работа с данными

### Импорт из Excel:
1. Скачайте шаблон в разделе "Импорт"
2. Заполните данные согласно формату
3. Загрузите файл через интерфейс
4. Проверьте отчет об ошибках
5. Исправьте ошибки и повторите при необходимости

### Требования к данным:
- Обязательные поля: Название (RU), Адрес (RU), Тип, Регион
- Максимум 1000 строк за один импорт
- Координаты: широта [-90, 90], долгота [-180, 180]
- Типы и регионы должны соответствовать справочникам

## 🛠️ Настройка для продакшена

### 1. Переменные окружения:
- Используйте сильный NEXTAUTH_SECRET
- Ограничьте Google Maps API key по домену
- Настройте правильный NEXTAUTH_URL

### 2. База данных:
- Используйте управляемый PostgreSQL (Supabase, Neon, Railway)
- Настройте резервное копирование
- Включите SSL соединение

### 3. Хостинг:
Рекомендуемые платформы:
- **Vercel** - оптимально для Next.js
- **Railway** - полный стек с БД
- **Render** - альтернатива с Docker

### 4. Оптимизация:
- Включите сжатие (gzip/brotli)
- Настройте CDN для статических ресурсов
- Оптимизируйте изображения
- Настройте правильные cache headers

## 🐛 Решение проблем

### База данных не подключается:
```bash
# Проверьте статус PostgreSQL
sudo systemctl status postgresql

# Проверьте подключение
psql -U postgres -d digital_atlas
```

### Ошибки Prisma:
```bash
# Пересоздайте клиент
npx prisma generate

# Сбросьте БД (осторожно!)
npx prisma db push --force-reset
```

### Google Maps не отображается:
- Проверьте API key в .env.local
- Убедитесь, что Maps JavaScript API включен
- Проверьте ограничения ключа в консоли Google

## 📚 Дополнительная документация

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Material-UI Documentation](https://mui.com/material-ui/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google Maps API](https://developers.google.com/maps/documentation)

## 📄 Лицензия

MIT License

## 👥 Поддержка

При возникновении вопросов создайте issue в репозитории проекта.

---

**Версия:** 1.0.0  
**Последнее обновление:** 2024