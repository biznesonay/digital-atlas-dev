#!/bin/bash

# Скрипт установки проекта "Цифровой атлас инновационной инфраструктуры"

echo "🚀 Начинаем установку проекта Digital Atlas..."
echo ""

# Проверка Node.js
echo "📦 Проверка Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Пожалуйста, установите Node.js 20.18.0 или выше"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js установлен: $NODE_VERSION"
echo ""

# Проверка PostgreSQL
echo "🗄️ Проверка PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "⚠️ PostgreSQL не найден. Убедитесь, что он установлен и настроен"
else
    echo "✅ PostgreSQL найден"
fi
echo ""

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install
echo "✅ Зависимости установлены"
echo ""

# Проверка .env.local
if [ ! -f .env.local ]; then
    echo "⚠️ Файл .env.local не найден"
    echo "📝 Создаем шаблон .env.local..."
    
    cat > .env.local << EOL
# База данных PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/digital_atlas?schema=public"

# NextAuth настройки
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
NEXT_PUBLIC_GOOGLE_MAP_ID="your-google-map-id"
GOOGLE_GEOCODING_API_KEY="your-google-geocoding-api-key"

# URL приложения
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Настройки производительности
CACHE_REVALIDATE_SECONDS=600
NEXT_PUBLIC_SUPER_CLUSTER_THRESHOLD=3000

# Настройки логирования
LOG_LEVEL=info
EOL
    
    echo "✅ Файл .env.local создан"
    echo ""
    echo "⚠️ ВАЖНО: Отредактируйте .env.local и добавьте:"
    echo "   1. Правильные данные для подключения к PostgreSQL"
    echo "   2. Google Maps API ключи и Map ID"
    echo ""
else
    echo "✅ Файл .env.local найден"
fi
echo ""

# Настройка базы данных
echo "🗄️ Настройка базы данных..."
read -p "Хотите создать базу данных автоматически? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Создание базы данных..."
    createdb digital_atlas 2>/dev/null || echo "База данных уже существует или ошибка создания"
    
    echo "📝 Генерация Prisma Client..."
    npx prisma generate
    
    echo "📝 Применение схемы к базе данных..."
    npx prisma db push
    
    echo "🌱 Загрузка начальных данных..."
    npx prisma db seed
    
    echo "✅ База данных настроена"
else
    echo "⚠️ Настройте базу данных вручную:"
    echo "   1. createdb digital_atlas"
    echo "   2. npx prisma generate"
    echo "   3. npx prisma db push"
    echo "   4. npx prisma db seed"
fi
echo ""

# Финальная информация
echo "✨ Установка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "   1. Отредактируйте .env.local (если необходимо)"
echo "   2. Запустите проект: npm run dev"
echo "   3. Откройте: http://localhost:3000"
echo ""
echo "🔑 Тестовый администратор:"
echo "   Email: admin@digital-atlas.kz"
echo "   Пароль: admin123"
echo ""
echo "📚 Дополнительные команды:"
echo "   npm run build - сборка для продакшена"
echo "   npm run start - запуск продакшен версии"
echo "   npx prisma studio - GUI для базы данных"
echo ""