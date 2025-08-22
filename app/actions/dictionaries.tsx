'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { z } from 'zod'

// ===== ТИПЫ ИНФРАСТРУКТУРЫ =====

const infrastructureTypeSchema = z.object({
  code: z.string().min(1).max(50),
  markerColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Неверный формат цвета'),
  order: z.number().int().min(0),
  translations: z.object({
    ru: z.string().min(1).max(100),
    kz: z.string().min(1).max(100).optional(),
    en: z.string().min(1).max(100).optional()
  })
})

export async function getInfrastructureTypes() {
  await requireRole('SUPER_ADMIN')
  
  return await prisma.infrastructureType.findMany({
    orderBy: { order: 'asc' },
    include: {
      translations: true,
      _count: {
        select: { objects: true }
      }
    }
  })
}

export async function createInfrastructureType(data: z.infer<typeof infrastructureTypeSchema>) {
  await requireRole('SUPER_ADMIN')
  
  const validated = infrastructureTypeSchema.parse(data)
  
  const type = await prisma.$transaction(async (tx) => {
    const newType = await tx.infrastructureType.create({
      data: {
        code: validated.code,
        markerColor: validated.markerColor,
        order: validated.order
      }
    })
    
    const translations = []
    
    translations.push({
      infrastructureTypeId: newType.id,
      languageCode: 'ru',
      name: validated.translations.ru
    })
    
    if (validated.translations.kz) {
      translations.push({
        infrastructureTypeId: newType.id,
        languageCode: 'kz',
        name: validated.translations.kz
      })
    }
    
    if (validated.translations.en) {
      translations.push({
        infrastructureTypeId: newType.id,
        languageCode: 'en',
        name: validated.translations.en
      })
    }
    
    await tx.infrastructureTypeTranslation.createMany({
      data: translations
    })
    
    return newType
  })
  
  revalidatePath('/admin/dictionaries/types')
  revalidatePath('/api/infrastructure-types')
  
  return { success: true, id: type.id }
}

export async function updateInfrastructureType(id: string, data: z.infer<typeof infrastructureTypeSchema>) {
  await requireRole('SUPER_ADMIN')
  
  const validated = infrastructureTypeSchema.parse(data)
  
  await prisma.$transaction(async (tx) => {
    await tx.infrastructureType.update({
      where: { id },
      data: {
        code: validated.code,
        markerColor: validated.markerColor,
        order: validated.order
      }
    })
    
    const languages = ['ru', 'kz', 'en'] as const
    
    for (const lang of languages) {
      const translation = validated.translations[lang]
      
      if (translation) {
        await tx.infrastructureTypeTranslation.upsert({
          where: {
            infrastructureTypeId_languageCode: {
              infrastructureTypeId: id,
              languageCode: lang
            }
          },
          update: { name: translation },
          create: {
            infrastructureTypeId: id,
            languageCode: lang,
            name: translation
          }
        })
      }
    }
  })
  
  revalidatePath('/admin/dictionaries/types')
  revalidatePath('/api/infrastructure-types')
  
  return { success: true }
}

export async function deleteInfrastructureType(id: string) {
  await requireRole('SUPER_ADMIN')
  
  // Проверка на наличие связанных объектов
  const count = await prisma.object.count({
    where: { infrastructureTypeId: id }
  })
  
  if (count > 0) {
    throw new Error(`Невозможно удалить тип: существует ${count} связанных объектов`)
  }
  
  await prisma.infrastructureType.delete({
    where: { id }
  })
  
  revalidatePath('/admin/dictionaries/types')
  revalidatePath('/api/infrastructure-types')
  
  return { success: true }
}

// ===== РЕГИОНЫ =====

const regionSchema = z.object({
  code: z.string().min(1).max(50),
  order: z.number().int().min(0),
  translations: z.object({
    ru: z.string().min(1).max(100),
    kz: z.string().min(1).max(100).optional(),
    en: z.string().min(1).max(100).optional()
  })
})

export async function getRegions() {
  await requireRole('SUPER_ADMIN')
  
  return await prisma.region.findMany({
    orderBy: { order: 'asc' },
    include: {
      translations: true,
      _count: {
        select: { objects: true }
      }
    }
  })
}

export async function createRegion(data: z.infer<typeof regionSchema>) {
  await requireRole('SUPER_ADMIN')
  
  const validated = regionSchema.parse(data)
  
  const region = await prisma.$transaction(async (tx) => {
    const newRegion = await tx.region.create({
      data: {
        code: validated.code,
        order: validated.order
      }
    })
    
    const translations = []
    
    translations.push({
      regionId: newRegion.id,
      languageCode: 'ru',
      name: validated.translations.ru
    })
    
    if (validated.translations.kz) {
      translations.push({
        regionId: newRegion.id,
        languageCode: 'kz',
        name: validated.translations.kz
      })
    }
    
    if (validated.translations.en) {
      translations.push({
        regionId: newRegion.id,
        languageCode: 'en',
        name: validated.translations.en
      })
    }
    
    await tx.regionTranslation.createMany({
      data: translations
    })
    
    return newRegion
  })
  
  revalidatePath('/admin/dictionaries/regions')
  revalidatePath('/api/regions')
  
  return { success: true, id: region.id }
}

export async function updateRegion(id: string, data: z.infer<typeof regionSchema>) {
  await requireRole('SUPER_ADMIN')
  
  const validated = regionSchema.parse(data)
  
  await prisma.$transaction(async (tx) => {
    await tx.region.update({
      where: { id },
      data: {
        code: validated.code,
        order: validated.order
      }
    })
    
    const languages = ['ru', 'kz', 'en'] as const
    
    for (const lang of languages) {
      const translation = validated.translations[lang]
      
      if (translation) {
        await tx.regionTranslation.upsert({
          where: {
            regionId_languageCode: {
              regionId: id,
              languageCode: lang
            }
          },
          update: { name: translation },
          create: {
            regionId: id,
            languageCode: lang,
            name: translation
          }
        })
      }
    }
  })
  
  revalidatePath('/admin/dictionaries/regions')
  revalidatePath('/api/regions')
  
  return { success: true }
}

export async function deleteRegion(id: string) {
  await requireRole('SUPER_ADMIN')
  
  // Проверка на наличие связанных объектов
  const count = await prisma.object.count({
    where: { regionId: id }
  })
  
  if (count > 0) {
    throw new Error(`Невозможно удалить регион: существует ${count} связанных объектов`)
  }
  
  await prisma.region.delete({
    where: { id }
  })
  
  revalidatePath('/admin/dictionaries/regions')
  revalidatePath('/api/regions')
  
  return { success: true }
}

// ===== ПРИОРИТЕТНЫЕ НАПРАВЛЕНИЯ =====

const priorityDirectionSchema = z.object({
  order: z.number().int().min(0),
  translations: z.object({
    ru: z.string().min(1).max(100),
    kz: z.string().min(1).max(100).optional(),
    en: z.string().min(1).max(100).optional()
  })
})

export async function getPriorityDirections() {
  await requireRole('SUPER_ADMIN')
  
  return await prisma.priorityDirection.findMany({
    orderBy: { order: 'asc' },
    include: {
      translations: true,
      _count: {
        select: { objects: true }
      }
    }
  })
}

export async function createPriorityDirection(data: z.infer<typeof priorityDirectionSchema>) {
  await requireRole('SUPER_ADMIN')
  
  const validated = priorityDirectionSchema.parse(data)
  
  const direction = await prisma.$transaction(async (tx) => {
    const newDirection = await tx.priorityDirection.create({
      data: {
        order: validated.order
      }
    })
    
    const translations = []
    
    translations.push({
      priorityDirectionId: newDirection.id,
      languageCode: 'ru',
      name: validated.translations.ru
    })
    
    if (validated.translations.kz) {
      translations.push({
        priorityDirectionId: newDirection.id,
        languageCode: 'kz',
        name: validated.translations.kz
      })
    }
    
    if (validated.translations.en) {
      translations.push({
        priorityDirectionId: newDirection.id,
        languageCode: 'en',
        name: validated.translations.en
      })
    }
    
    await tx.priorityDirectionTranslation.createMany({
      data: translations
    })
    
    return newDirection
  })
  
  revalidatePath('/admin/dictionaries/directions')
  revalidatePath('/api/priority-directions')
  
  return { success: true, id: direction.id }
}

export async function updatePriorityDirection(id: string, data: z.infer<typeof priorityDirectionSchema>) {
  await requireRole('SUPER_ADMIN')
  
  const validated = priorityDirectionSchema.parse(data)
  
  await prisma.$transaction(async (tx) => {
    await tx.priorityDirection.update({
      where: { id },
      data: {
        order: validated.order
      }
    })
    
    const languages = ['ru', 'kz', 'en'] as const
    
    for (const lang of languages) {
      const translation = validated.translations[lang]
      
      if (translation) {
        await tx.priorityDirectionTranslation.upsert({
          where: {
            priorityDirectionId_languageCode: {
              priorityDirectionId: id,
              languageCode: lang
            }
          },
          update: { name: translation },
          create: {
            priorityDirectionId: id,
            languageCode: lang,
            name: translation
          }
        })
      }
    }
  })
  
  revalidatePath('/admin/dictionaries/directions')
  revalidatePath('/api/priority-directions')
  
  return { success: true }
}

export async function deletePriorityDirection(id: string) {
  await requireRole('SUPER_ADMIN')
  
  // Проверка на наличие связанных объектов
  const count = await prisma.objectPriorityDirection.count({
    where: { priorityDirectionId: id }
  })
  
  if (count > 0) {
    throw new Error(`Невозможно удалить направление: существует ${count} связанных объектов`)
  }
  
  await prisma.priorityDirection.delete({
    where: { id }
  })
  
  revalidatePath('/admin/dictionaries/directions')
  revalidatePath('/api/priority-directions')
  
  return { success: true }
}