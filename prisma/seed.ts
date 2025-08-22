import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Создание пользователя SUPER_ADMIN
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  await prisma.user.upsert({
    where: { email: 'admin@digital-atlas.kz' },
    update: {},
    create: {
      email: 'admin@digital-atlas.kz',
      password: hashedPassword,
      name: 'Администратор',
      role: 'SUPER_ADMIN',
      emailVerified: new Date()
    }
  })

  // Создание типов инфраструктуры
  const infrastructureTypes = [
    { code: 'SEZ', markerColor: '#1976D2', order: 1 },
    { code: 'TECHNOPARK', markerColor: '#388E3C', order: 2 },
    { code: 'INCUBATOR', markerColor: '#7B1FA2', order: 3 },
    { code: 'IT_HUB', markerColor: '#F57C00', order: 4 },
    { code: 'VC_FUND', markerColor: '#D32F2F', order: 5 }
  ]

  const typeNames = {
    'SEZ': { ru: 'СЭЗ', kz: 'АЭА', en: 'SEZ' },
    'TECHNOPARK': { ru: 'Технопарк', kz: 'Технопарк', en: 'Technopark' },
    'INCUBATOR': { ru: 'Бизнес-инкубатор', kz: 'Бизнес-инкубатор', en: 'Business Incubator' },
    'IT_HUB': { ru: 'IT-хаб', kz: 'IT-хаб', en: 'IT Hub' },
    'VC_FUND': { ru: 'Венчурный фонд', kz: 'Венчурлық қор', en: 'Venture Fund' }
  }

  for (const type of infrastructureTypes) {
    const createdType = await prisma.infrastructureType.upsert({
      where: { code: type.code },
      update: {},
      create: type
    })

    const translations = typeNames[type.code as keyof typeof typeNames]
    for (const [lang, name] of Object.entries(translations)) {
      await prisma.infrastructureTypeTranslation.upsert({
        where: {
          infrastructureTypeId_languageCode: {
            infrastructureTypeId: createdType.id,
            languageCode: lang
          }
        },
        update: {},
        create: {
          infrastructureTypeId: createdType.id,
          languageCode: lang,
          name
        }
      })
    }
  }

  // Создание регионов Казахстана
  const regions = [
    { code: 'ALMATY_CITY', order: 1 },
    { code: 'ASTANA_CITY', order: 2 },
    { code: 'SHYMKENT_CITY', order: 3 },
    { code: 'AKMOLA', order: 4 },
    { code: 'AKTOBE', order: 5 },
    { code: 'ALMATY_REGION', order: 6 },
    { code: 'ATYRAU', order: 7 },
    { code: 'EAST_KAZAKHSTAN', order: 8 },
    { code: 'ZHAMBYL', order: 9 },
    { code: 'WEST_KAZAKHSTAN', order: 10 },
    { code: 'KARAGANDA', order: 11 },
    { code: 'KOSTANAY', order: 12 },
    { code: 'KYZYLORDA', order: 13 },
    { code: 'MANGYSTAU', order: 14 },
    { code: 'PAVLODAR', order: 15 },
    { code: 'NORTH_KAZAKHSTAN', order: 16 },
    { code: 'TURKESTAN', order: 17 },
    { code: 'ULYTAU', order: 18 },
    { code: 'ABAY', order: 19 },
    { code: 'ZHETISU', order: 20 },
    { code: 'KZKO', order: 21 }
  ]

  const regionNames = {
    'ALMATY_CITY': { ru: 'г. Алматы', kz: 'Алматы қ.', en: 'Almaty City' },
    'ASTANA_CITY': { ru: 'г. Астана', kz: 'Астана қ.', en: 'Astana City' },
    'SHYMKENT_CITY': { ru: 'г. Шымкент', kz: 'Шымкент қ.', en: 'Shymkent City' },
    'AKMOLA': { ru: 'Акмолинская область', kz: 'Ақмола облысы', en: 'Akmola Region' },
    'AKTOBE': { ru: 'Актюбинская область', kz: 'Ақтөбе облысы', en: 'Aktobe Region' },
    'ALMATY_REGION': { ru: 'Алматинская область', kz: 'Алматы облысы', en: 'Almaty Region' },
    'ATYRAU': { ru: 'Атырауская область', kz: 'Атырау облысы', en: 'Atyrau Region' },
    'EAST_KAZAKHSTAN': { ru: 'Восточно-Казахстанская область', kz: 'Шығыс Қазақстан облысы', en: 'East Kazakhstan Region' },
    'ZHAMBYL': { ru: 'Жамбылская область', kz: 'Жамбыл облысы', en: 'Zhambyl Region' },
    'WEST_KAZAKHSTAN': { ru: 'Западно-Казахстанская область', kz: 'Батыс Қазақстан облысы', en: 'West Kazakhstan Region' },
    'KARAGANDA': { ru: 'Карагандинская область', kz: 'Қарағанды облысы', en: 'Karaganda Region' },
    'KOSTANAY': { ru: 'Костанайская область', kz: 'Қостанай облысы', en: 'Kostanay Region' },
    'KYZYLORDA': { ru: 'Кызылординская область', kz: 'Қызылорда облысы', en: 'Kyzylorda Region' },
    'MANGYSTAU': { ru: 'Мангистауская область', kz: 'Маңғыстау облысы', en: 'Mangystau Region' },
    'PAVLODAR': { ru: 'Павлодарская область', kz: 'Павлодар облысы', en: 'Pavlodar Region' },
    'NORTH_KAZAKHSTAN': { ru: 'Северо-Казахстанская область', kz: 'Солтүстік Қазақстан облысы', en: 'North Kazakhstan Region' },
    'TURKESTAN': { ru: 'Туркестанская область', kz: 'Түркістан облысы', en: 'Turkestan Region' },
    'ULYTAU': { ru: 'Улытауская область', kz: 'Ұлытау облысы', en: 'Ulytau Region' },
    'ABAY': { ru: 'Область Абай', kz: 'Абай облысы', en: 'Abay Region' },
    'ZHETISU': { ru: 'Область Жетысу', kz: 'Жетісу облысы', en: 'Zhetisu Region' },
    'KZKO': { ru: 'Казахстанско-Китайский Коридор', kz: 'Қазақстан-Қытай Дәлізі', en: 'Kazakhstan-China Corridor' }
  }

  for (const region of regions) {
    const createdRegion = await prisma.region.upsert({
      where: { code: region.code },
      update: {},
      create: region
    })

    const translations = regionNames[region.code as keyof typeof regionNames]
    for (const [lang, name] of Object.entries(translations)) {
      await prisma.regionTranslation.upsert({
        where: {
          regionId_languageCode: {
            regionId: createdRegion.id,
            languageCode: lang
          }
        },
        update: {},
        create: {
          regionId: createdRegion.id,
          languageCode: lang,
          name
        }
      })
    }
  }

  // Создание приоритетных направлений
  const directions = [
    { order: 1, names: { ru: 'Информационные технологии', kz: 'Ақпараттық технологиялар', en: 'Information Technology' } },
    { order: 2, names: { ru: 'Возобновляемые источники энергии', kz: 'Жаңғыртылатын энергия көздері', en: 'Renewable Energy' } },
    { order: 3, names: { ru: 'Биотехнологии', kz: 'Биотехнологиялар', en: 'Biotechnology' } },
    { order: 4, names: { ru: 'Робототехника и автоматизация', kz: 'Робототехника және автоматтандыру', en: 'Robotics and Automation' } },
    { order: 5, names: { ru: 'Новые материалы', kz: 'Жаңа материалдар', en: 'New Materials' } },
    { order: 6, names: { ru: 'Искусственный интеллект', kz: 'Жасанды интеллект', en: 'Artificial Intelligence' } },
    { order: 7, names: { ru: 'Космические технологии', kz: 'Ғарыш технологиялары', en: 'Space Technology' } },
    { order: 8, names: { ru: 'Нанотехнологии', kz: 'Нанотехнологиялар', en: 'Nanotechnology' } }
  ]

  for (const direction of directions) {
    const createdDirection = await prisma.priorityDirection.create({
      data: { order: direction.order }
    })

    for (const [lang, name] of Object.entries(direction.names)) {
      await prisma.priorityDirectionTranslation.create({
        data: {
          priorityDirectionId: createdDirection.id,
          languageCode: lang,
          name
        }
      })
    }
  }

  console.log('Seed completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })