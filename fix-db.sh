#!/bin/bash

echo "🔧 Исправление проблем с базой данных PostgreSQL..."
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL не установлен${NC}"
    exit 1
fi

echo "📊 Текущая версия PostgreSQL:"
psql --version
echo ""

# Спрашиваем пользователя
echo -e "${YELLOW}Это удалит и пересоздаст базу данных digital_atlas.${NC}"
read -p "Продолжить? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отменено пользователем"
    exit 0
fi

echo ""
echo "🗑️  Удаление старой базы данных..."
dropdb digital_atlas 2>/dev/null || echo "База данных не существует или не может быть удалена"

echo "✨ Создание новой базы данных..."
createdb digital_atlas -O postgres

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка создания базы данных${NC}"
    echo "Попробуйте выполнить от имени postgres пользователя:"
    echo "sudo -u postgres createdb digital_atlas"
    exit 1
fi

echo "🔐 Настройка прав доступа..."
psql -U postgres -d digital_atlas << EOF
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
ALTER SCHEMA public OWNER TO postgres;
\q
EOF

echo -e "${GREEN}✅ База данных настроена${NC}"
echo ""

# Создание .env файла для Prisma если его нет
if [ ! -f .env ]; then
    echo "📝 Создание .env файла для Prisma..."
    echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/digital_atlas?schema=public"' > .env
    echo -e "${GREEN}✅ Файл .env создан${NC}"
fi

echo "📦 Применение схемы Prisma..."
npx prisma db push

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка применения схемы${NC}"
    echo "Проверьте подключение к БД и настройки в .env файле"
    exit 1
fi

echo ""
echo "🌱 Загрузка начальных данных..."
npx prisma db seed

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка загрузки данных${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 База данных успешно настроена!${NC}"
echo ""
echo "Теперь вы можете:"
echo "  1. Запустить проект: npm run dev"
echo "  2. Открыть Prisma Studio: npx prisma studio"
echo ""
echo "🔑 Тестовый администратор:"
echo "   Email: admin@digital-atlas.kz"
echo "   Пароль: admin123"