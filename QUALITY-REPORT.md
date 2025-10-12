# QUALITY-REPORT

## Сводка проверок
| Команда | Статус | Детали |
| --- | --- | --- |
| `npm ci` | ✅ | Установлены зависимости; замечены предупреждения npm о неизвестной переменной окружения и устаревших пакетах. |
| `npm run typecheck` | ✅ | Компиляция TypeScript завершилась без ошибок. |
| `npm run lint` | ❌ | `next lint` остановился из-за 80+ ошибок правил TypeScript/React. |
| `npx prisma validate` | ❌ | Проверка схемы упала: не найдено `DATABASE_URL`. |
| `npx prisma format --schema prisma/schema.prisma` | ✅ | Схема отформатирована Prisma CLI. |
| `npx prisma generate` | ✅ | Prisma Client успешно пересобран. |
| `npm run build` | ❌ | Сборка Next.js прервана из-за тех же ошибок ESLint/TS. |

## Ошибки/предупреждения
### ESLint / Next build
- `app/actions/objects.ts` — `no-explicit-any` в `fetchObjectSuggestions` (стр. 173) и массовое использование `any` в других частях файла. Рекомендуется вывести корректные типы вместо `any` и убрать приведения. 
- `app/admin/(protected)/dashboard/page.tsx` — `no-explicit-any` при приведении цвета кнопки (стр. 136). Настроить типизацию через кастомный тип/`as const`.
- `app/admin/page.tsx` — неиспользуемое состояние `error` (стр. 86). Либо удалить, либо использовать для отображения ошибок.
- `app/api/objects/route.ts` — `no-explicit-any` на обработчике тела запроса (стр. 41). Описать DTO через `zod`/интерфейс.
- `components/admin/AdminHeader.tsx` — `no-explicit-any` в стейте меню (стр. 16). Типизировать `anchorEl` через `HTMLElement | null`.
- `components/admin/DictionaryTable.tsx` — неиспользуемый импорт `Chip`, множественные `any` в пропсах/обработчиках (стр. 40–93) и `react/no-unescaped-entities` в тексте (стр. 194). Настроить типы DTO и экранировать кавычки.
- `components/admin/InfrastructureTypeForm.tsx` — `any` в пропсах и обработчиках форм (стр. 23–76).
- `components/admin/ObjectForm.tsx` — неиспользуемый импорт `FormHelperText` и множество `any` в полях и обработчиках (стр. 32–112). 
- `components/admin/ObjectsTable.tsx` — `any` в данных таблицы, неиспользуемая переменная `pages`, неэкранированные кавычки в текстах (стр. 38–265).
- `components/admin/PriorityDirectionForm.tsx` — `any` в пропсах/хендлерах (стр. 21–72).
- `components/admin/RegionForm.tsx` — `any` в пропсах/хендлерах (стр. 21–73).
- `components/admin/UserForm.tsx` — `any` в пропсах/хендлерах (стр. 28–83).
- `components/admin/UsersTable.tsx` — `any` в данных таблицы, неэкранированные кавычки в текстах (стр. 35–242).
- `components/map/Map.tsx` — `any` при работе с Google Maps, неиспользуемые переменные `_stats`, `_map` (стр. 13–265).
- `components/map/MarkerInfo.tsx` — `any` в пропсах и обработчиках (стр. 8, 101).
- `components/map/ObjectsList.tsx` — `any` в пропсах/обработчиках и предупреждение `react-hooks/exhaustive-deps` (стр. 35–189).
- `lib/api.ts`, `lib/auth.ts` — использование `any` в сигнатурах (стр. 15; 76–112).

### Prisma
- `npx prisma validate` — ошибка P1012: отсутствует переменная окружения `DATABASE_URL`. Добавьте её в `.env` или передавайте через систему секретов перед запуском CLI.

### Прочие предупреждения
- `npm ci` — предупреждения об устаревших пакетах (inflight, glob и др.) и неизвестной переменной окружения `http-proxy`. Оцените необходимость обновлений и очистки конфигурации npm.

## Анти-паттерны
- **Доступ к `process.env.NEXT_PUBLIC_*` на сервере:** `app/actions/objects.ts` (стр. 20) использует `NEXT_PUBLIC_APP_URL` внутри server action. Передавайте базовый URL через серверную конфигурацию или `APP_URL`, чтобы не зависеть от client-only переменной.
- **App Router хуки без `use client`:** не обнаружено.
- **`useSearchParams().get(...)` без проверки на `null`:** не обнаружено — актуальные обращения используют optional chaining.

## Риски продакшена и приоритеты фиксов
- **P0:** Сборка `npm run build` и линтер падают из-за повального использования `any`, неэкранированных строк и неиспользуемых переменных в административных компонентах. Без устранения ошибок релиз невозможен.
- **P0:** Prisma CLI не может валидировать схему без `DATABASE_URL`; миграции и генерация клиента на CI будут падать.
- **P1:** Зависимость серверного кода от `NEXT_PUBLIC_APP_URL` может привести к неверным адресам в продакшене при отличающихся публичных и внутренних базовых URL.
- **P1:** В репозитории отсутствуют миграции (`prisma/migrations`), что затрудняет воспроизводимость схемы на продакшене и откаты изменений.
- **P2:** Предупреждение `react-hooks/exhaustive-deps` в `components/map/ObjectsList.tsx` может приводить к устаревшим данным в списке объектов.
- **P2:** Многочисленные `react/no-unescaped-entities` в текстовых колонках портят HTML-валидность и могут ломать локализацию.

## Что запустить локально
1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npx prisma validate`
5. `npx prisma format --schema prisma/schema.prisma`
6. `npx prisma generate`
7. `npm run build`
