import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/prisma"

// Кэширование на 10 минут
export const revalidate = parseInt(process.env.CACHE_REVALIDATE_SECONDS || "600")

const querySchema = z.object({
  lang: z.enum(["ru", "kz", "en"]).default("ru"),
  search: z.string().optional(),
  regionIds: z.array(z.string().uuid()).optional(),
  typeIds: z.array(z.string().uuid()).optional(),
  directionIds: z.array(z.string().uuid()).optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    
    // Парсинг параметров
    const params = {
      lang: searchParams.get("lang") || "ru",
      search: searchParams.get("search") || undefined,
      regionIds: searchParams.getAll("regionIds[]").filter(Boolean),
      typeIds: searchParams.getAll("typeIds[]").filter(Boolean),
      directionIds: searchParams.getAll("directionIds[]").filter(Boolean)
    }
    
    // Валидация
    const parsed = querySchema.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    
    const { lang, search, regionIds, typeIds, directionIds } = parsed.data
    
    // Построение условий поиска
    const where: any = {
      isPublished: true
    }
    
    if (regionIds && regionIds.length > 0) {
      where.regionId = { in: regionIds }
    }
    
    if (typeIds && typeIds.length > 0) {
      where.infrastructureTypeId = { in: typeIds }
    }
    
    if (directionIds && directionIds.length > 0) {
      where.priorityDirections = {
        some: {
          priorityDirectionId: { in: directionIds }
        }
      }
    }
    
    if (search) {
      where.translations = {
        some: {
          languageCode: lang,
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } }
          ]
        }
      }
    }
    
    // Запрос к БД с оптимизированным select
    const objects = await prisma.object.findMany({
      where,
      select: {
        id: true,
        latitude: true,
        longitude: true,
        website: true,
        googleMapsUrl: true,
        contactPhones: true,
        infrastructureType: {
          select: {
            id: true,
            code: true,
            markerColor: true,
            translations: {
              where: { languageCode: lang },
              select: { name: true }
            }
          }
        },
        region: {
          select: {
            id: true,
            code: true,
            translations: {
              where: { languageCode: lang },
              select: { name: true }
            }
          }
        },
        translations: {
          where: { languageCode: lang },
          select: {
            name: true,
            address: true
          }
        },
        priorityDirections: {
          select: {
            priorityDirection: {
              select: {
                id: true,
                translations: {
                  where: { languageCode: lang },
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    })
    
    // Форматирование ответа
    const formattedObjects = objects.map(obj => ({
      id: obj.id,
      latitude: obj.latitude,
      longitude: obj.longitude,
      website: obj.website,
      googleMapsUrl: obj.googleMapsUrl,
      contactPhones: obj.contactPhones as string[] | null,
      type: {
        id: obj.infrastructureType.id,
        code: obj.infrastructureType.code,
        color: obj.infrastructureType.markerColor,
        name: obj.infrastructureType.translations[0]?.name || obj.infrastructureType.code
      },
      region: {
        id: obj.region.id,
        code: obj.region.code,
        name: obj.region.translations[0]?.name || obj.region.code
      },
      name: obj.translations[0]?.name || '',
      address: obj.translations[0]?.address || '',
      directions: obj.priorityDirections.map(pd => ({
        id: pd.priorityDirection.id,
        name: pd.priorityDirection.translations[0]?.name || ''
      }))
    }))
    
    return NextResponse.json({
      data: formattedObjects,
      total: formattedObjects.length
    })
    
  } catch (error) {
    console.error('Error fetching objects:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}