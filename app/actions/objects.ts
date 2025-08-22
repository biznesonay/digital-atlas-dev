'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { objectSchema } from '@/lib/validation/object'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// Получение списка объектов для админки
export async function getAdminObjects(params?: {
  search?: string
  typeId?: string
  regionId?: string
  page?: number
  limit?: number
}) {
  await requireRole('EDITOR')

  const page = params?.page || 1
  const limit = params?.limit || 50
  const skip = (page - 1) * limit

  const where: Prisma.ObjectWhereInput = {}
  
  if (params?.search) {
    where.translations = {
      some: {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { address: { contains: params.search, mode: 'insensitive' } }
        ]
      }
    }
  }

  if (params?.typeId) {
    where.infrastructureTypeId = params.typeId
  }

  if (params?.regionId) {
    where.regionId = params.regionId
  }

  const [objects, total] = await Promise.all([
    prisma.object.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        translations: {
          where: { languageCode: 'ru' }
        },
        infrastructureType: {
          include: {
            translations: {
              where: { languageCode: 'ru' }
            }
          }
        },
        region: {
          include: {
            translations: {
              where: { languageCode: 'ru' }
            }
          }
        },
        priorityDirections: {
          include: {
            priorityDirection: {
              include: {
                translations: {
                  where: { languageCode: 'ru' }
                }
              }
            }
          }
        }
      }
    }),
    prisma.object.count({ where })
  ])

  return {
    objects,
    total,
    page,
    pages: Math.ceil(total / limit)
  }
}

// Получение одного объекта
export async function getAdminObject(id: string) {
  await requireRole('EDITOR')

  const object = await prisma.object.findUnique({
    where: { id },
    include: {
      translations: true,
      infrastructureType: {
        include: {
          translations: {
            where: { languageCode: 'ru' }
          }
        }
      },
      region: {
        include: {
          translations: {
            where: { languageCode: 'ru' }
          }
        }
      },
      priorityDirections: {
        include: {
          priorityDirection: {
            include: {
              translations: {
                where: { languageCode: 'ru' }
              }
            }
          }
        }
      }
    }
  })

  if (!object) {
    throw new Error('Объект не найден')
  }

  return object
}

// Создание объекта
export async function createObject(data: z.infer<typeof objectSchema>) {
  const session = await requireRole('EDITOR')

  const validatedData = objectSchema.parse(data)

  const object = await prisma.$transaction(async (tx) => {
    // Создание объекта
    const newObject = await tx.object.create({
      data: {
        infrastructureTypeId: validatedData.infrastructureTypeId,
        regionId: validatedData.regionId,
        createdById: (session.user as any).id,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        googleMapsUrl: validatedData.googleMapsUrl,
        website: validatedData.website,
        contactPhones: validatedData.contactPhones ?? undefined,
        isPublished: validatedData.translations.ru.isPublished
      }
    })

    // Создание переводов
    const translations = []
    
    // Русский перевод (обязательный)
    translations.push({
      objectId: newObject.id,
      languageCode: 'ru',
      name: validatedData.translations.ru.name,
      address: validatedData.translations.ru.address,
      isPublished: validatedData.translations.ru.isPublished
    })

    // Казахский перевод (опциональный)
    if (validatedData.translations.kz) {
      translations.push({
        objectId: newObject.id,
        languageCode: 'kz',
        name: validatedData.translations.kz.name,
        address: validatedData.translations.kz.address,
        isPublished: validatedData.translations.kz.isPublished
      })
    }

    // Английский перевод (опциональный)
    if (validatedData.translations.en) {
      translations.push({
        objectId: newObject.id,
        languageCode: 'en',
        name: validatedData.translations.en.name,
        address: validatedData.translations.en.address,
        isPublished: validatedData.translations.en.isPublished
      })
    }

    await tx.objectTranslation.createMany({
      data: translations
    })

    // Создание связей с приоритетными направлениями
    if (validatedData.priorityDirections.length > 0) {
      await tx.objectPriorityDirection.createMany({
        data: validatedData.priorityDirections.map(directionId => ({
          objectId: newObject.id,
          priorityDirectionId: directionId
        }))
      })
    }

    return newObject
  })

  revalidatePath('/api/objects')
  revalidatePath('/admin/objects')

  return { success: true, id: object.id }
}

// Обновление объекта
export async function updateObject(id: string, data: z.infer<typeof objectSchema>) {
  await requireRole('EDITOR')

  const validatedData = objectSchema.parse(data)

  await prisma.$transaction(async (tx) => {
    // Обновление объекта
    await tx.object.update({
      where: { id },
      data: {
        infrastructureTypeId: validatedData.infrastructureTypeId,
        regionId: validatedData.regionId,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        googleMapsUrl: validatedData.googleMapsUrl,
        website: validatedData.website,
        contactPhones: validatedData.contactPhones ?? undefined,
        isPublished: validatedData.translations.ru.isPublished
      }
    })

    // Обновление переводов
    const languages = ['ru', 'kz', 'en'] as const
    
    for (const lang of languages) {
      const translation = validatedData.translations[lang]
      
      if (translation) {
        await tx.objectTranslation.upsert({
          where: {
            objectId_languageCode: {
              objectId: id,
              languageCode: lang
            }
          },
          update: {
            name: translation.name,
            address: translation.address,
            isPublished: translation.isPublished
          },
          create: {
            objectId: id,
            languageCode: lang,
            name: translation.name,
            address: translation.address,
            isPublished: translation.isPublished
          }
        })
      }
    }

    // Обновление приоритетных направлений
    await tx.objectPriorityDirection.deleteMany({
      where: { objectId: id }
    })

    if (validatedData.priorityDirections.length > 0) {
      await tx.objectPriorityDirection.createMany({
        data: validatedData.priorityDirections.map(directionId => ({
          objectId: id,
          priorityDirectionId: directionId
        }))
      })
    }
  })

  revalidatePath('/api/objects')
  revalidatePath('/admin/objects')

  return { success: true }
}

// Удаление объекта
export async function deleteObject(id: string) {
  await requireRole('EDITOR')

  await prisma.object.delete({
    where: { id }
  })

  revalidatePath('/api/objects')
  revalidatePath('/admin/objects')

  return { success: true }
}

// Публикация/снятие с публикации
export async function toggleObjectPublish(id: string) {
  await requireRole('EDITOR')

  const result = await prisma.$transaction(async (tx) => {
    const object = await tx.object.findUnique({
      where: { id },
      select: { isPublished: true }
    })

    if (!object) {
      throw new Error('Объект не найден')
    }

    return await tx.object.update({
      where: { id },
      data: { isPublished: !object.isPublished },
      select: { isPublished: true }
    })
  })

  revalidatePath('/api/objects')
  revalidatePath('/admin/objects')

  return { success: true, isPublished: result.isPublished }
}