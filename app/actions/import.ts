'use server'

import { requireRole } from '@/lib/auth'
import prisma from '@/lib/prisma'
import ExcelJS from 'exceljs'
import { validateImportRow, mapExcelRow, TEMPLATE_COLUMNS } from '@/lib/validation/import'
import { ImportError, ImportResult } from '@/lib/types'
import { revalidatePath } from 'next/cache'

// Генерация шаблона Excel
export async function generateImportTemplate() {
  await requireRole('EDITOR')

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Объекты')

  // Добавление заголовков
  worksheet.columns = TEMPLATE_COLUMNS.map(col => ({
    header: col,
    key: col,
    width: 25
  }))

  // Стилизация заголовков
  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }

  // Добавление примера данных
  worksheet.addRow({
    'Название (RU)': 'Технопарк Алатау',
    'Название (KZ)': 'Алатау технопаркі',
    'Название (EN)': 'Alatau Technopark',
    'Адрес (RU)': 'г. Алматы, ул. Примерная, 123',
    'Адрес (KZ)': 'Алматы қ., Мысал көшесі, 123',
    'Адрес (EN)': 'Almaty, Example str., 123',
    'Тип инфраструктуры': 'Технопарк',
    'Регион': 'г. Алматы',
    'Приоритетные направления': 'Информационные технологии, Биотехнологии',
    'Широта': 43.238949,
    'Долгота': 76.889709,
    'Веб-сайт': 'https://example.com',
    'Телефоны': '+7 (727) 123-45-67, +7 (727) 123-45-68',
    'Google Maps URL': 'https://maps.google.com/...'
  })

  // Добавление инструкций
  const instructionSheet = workbook.addWorksheet('Инструкции')
  instructionSheet.addRow(['Инструкции по заполнению:'])
  instructionSheet.addRow([''])
  instructionSheet.addRow(['1. Обязательные поля: Название (RU), Адрес (RU), Тип инфраструктуры, Регион'])
  instructionSheet.addRow(['2. Типы инфраструктуры: СЭЗ, Технопарк, Бизнес-инкубатор, IT-хаб, Венчурный фонд'])
  instructionSheet.addRow(['3. Регионы: используйте точные названия из системы'])
  instructionSheet.addRow(['4. Приоритетные направления: перечислите через запятую'])
  instructionSheet.addRow(['5. Координаты: широта от -90 до 90, долгота от -180 до 180'])
  instructionSheet.addRow(['6. Телефоны: перечислите через запятую'])
  instructionSheet.addRow(['7. Максимум 1000 строк за один импорт'])

  // Генерация буфера
  const buffer = await workbook.xlsx.writeBuffer()
  
  return {
    data: Buffer.from(buffer).toString('base64'),
    filename: `import_template_${new Date().toISOString().split('T')[0]}.xlsx`
  }
}

// Валидация файла Excel
export async function validateImportFile(fileData: string, filename: string) {
  await requireRole('EDITOR')

  try {
    const buffer = Buffer.from(fileData, 'base64')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    const worksheet = workbook.getWorksheet(1)
    if (!worksheet) {
      throw new Error('Файл не содержит листов с данными')
    }

    const rows: any[] = []
    const errors: ImportError[] = []

    // Пропускаем заголовок
    let rowIndex = 0
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // Пропускаем заголовок
      
      rowIndex++
      if (rowIndex > 1000) {
        errors.push({
          row: rowNumber,
          field: 'general',
          value: null,
          message: 'Превышен лимит в 1000 строк'
        })
        return
      }

      const rowData: any = {}
      row.eachCell((cell, colNumber) => {
        const header = worksheet.getRow(1).getCell(colNumber).value
        if (header) {
          rowData[header.toString()] = cell.value
        }
      })

      const mappedRow = mapExcelRow(rowData)
      const validation = validateImportRow(mappedRow, rowNumber)

      if (validation.valid && validation.data) {
        rows.push({
          ...validation.data,
          rowNumber
        })
      } else if (validation.errors) {
        validation.errors.forEach(error => {
          errors.push({
            row: rowNumber,
            field: error.field,
            value: mappedRow[error.field],
            message: error.message
          })
        })
      }
    })

    return {
      valid: errors.length === 0,
      rows,
      errors,
      totalRows: rowIndex
    }
  } catch (error: any) {
    throw new Error(`Ошибка чтения файла: ${error.message}`)
  }
}

// Импорт данных
export async function importObjects(fileData: string, filename: string): Promise<ImportResult> {
  await requireRole('EDITOR')

  // Валидация файла
  const validation = await validateImportFile(fileData, filename)
  
  if (!validation.valid) {
    return {
      success: false,
      imported: 0,
      failed: validation.errors.length,
      errors: validation.errors
    }
  }

  // Получение справочников
  const [types, regions, directions] = await Promise.all([
    prisma.infrastructureType.findMany({
      include: {
        translations: {
          where: { languageCode: 'ru' }
        }
      }
    }),
    prisma.region.findMany({
      include: {
        translations: {
          where: { languageCode: 'ru' }
        }
      }
    }),
    prisma.priorityDirection.findMany({
      include: {
        translations: {
          where: { languageCode: 'ru' }
        }
      }
    })
  ])

  // Создание маппингов
  const typeMap = new Map(
    types.map(t => [t.translations[0]?.name || t.code, t.id])
  )
  const regionMap = new Map(
    regions.map(r => [r.translations[0]?.name || r.code, r.id])
  )
  const directionMap = new Map(
    directions.map(d => [d.translations[0]?.name || '', d.id])
  )

  const errors: ImportError[] = []
  let imported = 0
  let failed = 0


  // Импорт по партиям
  const batchSize = 100
  const totalBatches = Math.ceil(validation.rows.length / batchSize)

  for (let i = 0; i < validation.rows.length; i += batchSize) {
    const batch = validation.rows.slice(i, i + batchSize)
    const batchNumber = Math.floor(i / batchSize) + 1

    console.log(`Обработка партии ${batchNumber}/${totalBatches}`)

    try {
      await prisma.$transaction(async (tx) => {
        for (const row of batch) {
          try {
            // Получение ID типа и региона
            const typeId = typeMap.get(row.type)
            const regionId = regionMap.get(row.region)

            if (!typeId) {
              errors.push({
                row: row.rowNumber,
                field: 'type',
                value: row.type,
                message: `Тип инфраструктуры "${row.type}" не найден в системе`
              })
              failed++
              continue
            }

            if (!regionId) {
              errors.push({
                row: row.rowNumber,
                field: 'region',
                value: row.region,
                message: `Регион "${row.region}" не найден в системе`
              })
              failed++
              continue
            }

            // Парсинг направлений
            const directionIds: string[] = []
            if (row.directions) {
              const directionNames = row.directions
                .split(',')
                .map((d: string) => d.trim())
              for (const name of directionNames) {
                const dirId = directionMap.get(name)
                if (dirId) {
                  directionIds.push(dirId)
                } else {
                  errors.push({
                    row: row.rowNumber,
                    field: 'directions',
                    value: name,
                    message: `Направление "${name}" не найдено в системе`
                  })
                }
              }
            }

            // Парсинг телефонов
            const phones = row.phones
              ? row.phones
                  .split(',')
                  .map((p: string) => p.trim())
                  .filter(Boolean)
              : []

            // Создание объекта
            const object = await tx.object.create({
              data: {
                infrastructureTypeId: typeId,
                regionId: regionId,
                latitude: row.latitude,
                longitude: row.longitude,
                googleMapsUrl: row.googleMapsUrl || null,
                website: row.website || null,
                contactPhones: phones.length > 0 ? phones : null,
                isPublished: false // По умолчанию не опубликован
              }
            })

            // Создание переводов
            const translations = []

            // Русский (обязательный)
            translations.push({
              objectId: object.id,
              languageCode: 'ru',
              name: row.name_ru,
              address: row.address_ru,
              isPublished: false
            })

            // Казахский (опциональный)
            if (row.name_kz && row.address_kz) {
              translations.push({
                objectId: object.id,
                languageCode: 'kz',
                name: row.name_kz,
                address: row.address_kz,
                isPublished: false
              })
            }

            // Английский (опциональный)
            if (row.name_en && row.address_en) {
              translations.push({
                objectId: object.id,
                languageCode: 'en',
                name: row.name_en,
                address: row.address_en,
                isPublished: false
              })
            }

            await tx.objectTranslation.createMany({
              data: translations
            })

            // Создание связей с направлениями
            if (directionIds.length > 0) {
              await tx.objectPriorityDirection.createMany({
                data: directionIds.map(id => ({
                  objectId: object.id,
                  priorityDirectionId: id
                }))
              })
            }

            imported++
          } catch (error: any) {
            errors.push({
              row: row.rowNumber,
              field: 'general',
              value: null,
              message: `Ошибка создания объекта: ${error.message}`
            })
            failed++
          }
        }
      })
      console.log(`Партия ${batchNumber} успешно обработана`)
    } catch (batchError: any) {
      console.error(`Ошибка обработки партии ${batchNumber}: ${batchError.message}`)
      for (const row of batch) {
        errors.push({
          row: row.rowNumber,
          field: 'general',
          value: null,
          message: `Ошибка обработки партии: ${batchError.message}`
        })
        failed++
      }
    }
  }
  revalidatePath('/api/objects')
  revalidatePath('/admin/objects')

  return {
    success: failed === 0,
    imported,
    failed,
    errors
  }
}