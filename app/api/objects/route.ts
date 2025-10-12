import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import prisma from "@/lib/prisma"

// Кэширование на 10 минут
export const revalidate = parseInt(process.env.CACHE_REVALIDATE_SECONDS || "600")

const querySchema = z.object({
  lang: z.enum(["ru", "kz", "en"]).default("ru"),
  search: z.string().optional(),
  regionIds: z.array(z.string().uuid()).optional(),
  typeIds: z.array(z.string().uuid()).optional(),
  directionIds: z.array(z.string().uuid()).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional()
})

const DEFAULT_LIMIT = (() => {
  const value = Number(process.env.OBJECTS_API_DEFAULT_LIMIT ?? process.env.NEXT_PUBLIC_OBJECTS_LIMIT ?? "500")
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 500
})()

const MAX_LIMIT = (() => {
  const value = Number(process.env.OBJECTS_API_MAX_LIMIT ?? "1000")
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1000
})()

const normalizePhones = (phones: unknown): string[] | null => {
  if (!Array.isArray(phones)) {
    return null
  }

  const normalized = phones
    .map(phone => {
      if (typeof phone === "string") {
        return phone.trim()
      }
      if (typeof phone === "number" || typeof phone === "bigint") {
        return String(phone)
      }
      return ""
    })
    .filter((phone): phone is string => Boolean(phone))

  return normalized.length > 0 ? normalized : null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl

    // Парсинг параметров
      const params = {
        lang: searchParams.get("lang") || "ru",
        search: searchParams.get("search") || undefined,
        regionIds: searchParams.getAll("regionIds[]").filter(Boolean),
        typeIds: searchParams.getAll("typeIds[]").filter(Boolean),
        directionIds: searchParams.getAll("directionIds[]").filter(Boolean),
        page: searchParams.get("page") ?? undefined,
        limit: searchParams.get("limit") ?? undefined
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

      const page = parsed.data.page ?? 1
      const requestedLimit = parsed.data.limit ?? DEFAULT_LIMIT

      if (requestedLimit > MAX_LIMIT) {
        return NextResponse.json(
          {
            error: `The requested limit exceeds the maximum allowed value (${MAX_LIMIT}).`,
            maxLimit: MAX_LIMIT
          },
          { status: 400 }
        )
      }

      const limit = Math.min(requestedLimit, MAX_LIMIT)
      const skip = (page - 1) * limit

      // Построение условий поиска
      const where: Prisma.ObjectWhereInput = {
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
    
    const translationLanguages = lang === "ru" ? ["ru"] : [lang, "ru"]

    // Запрос к БД с оптимизированным select
    const [objects, total] = await Promise.all([
      prisma.object.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
                where: {
                  languageCode: { in: translationLanguages }
                },
                select: { languageCode: true, name: true }
              }
            }
          },
          region: {
            select: {
              id: true,
              code: true,
              translations: {
                where: {
                  languageCode: { in: translationLanguages }
                },
                select: { languageCode: true, name: true }
              }
            }
          },
          translations: {
            where: {
              languageCode: { in: translationLanguages }
            },
            select: {
              languageCode: true,
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
                    where: {
                      languageCode: { in: translationLanguages }
                    },
                    select: { languageCode: true, name: true }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.object.count({ where })
    ])

    // Форматирование ответа
    const formattedObjects = objects.map(obj => {
      const pickTranslation = <T extends { languageCode: string }>(
        translations: (T & { name?: string | null; address?: string | null })[]
      ) => {
        if (!translations || translations.length === 0) return undefined
        return (
          translations.find(t => t.languageCode === lang) ||
          translations.find(t => t.languageCode === "ru") ||
          translations[0]
        )
      }

      const objectTranslation = pickTranslation(obj.translations)
      const typeTranslation = pickTranslation(obj.infrastructureType.translations)
      const regionTranslation = pickTranslation(obj.region.translations)

      return {
        id: obj.id,
        latitude: obj.latitude,
        longitude: obj.longitude,
        website: obj.website,
        googleMapsUrl: obj.googleMapsUrl,
        contactPhones: normalizePhones(obj.contactPhones),
        type: {
          id: obj.infrastructureType.id,
          code: obj.infrastructureType.code,
          color: obj.infrastructureType.markerColor,
          name: typeTranslation?.name || obj.infrastructureType.code
        },
        region: {
          id: obj.region.id,
          code: obj.region.code,
          name: regionTranslation?.name || obj.region.code
        },
        name: objectTranslation?.name || "",
        address: objectTranslation?.address || "",
        directions: obj.priorityDirections.map(pd => {
          const directionTranslation = pickTranslation(
            pd.priorityDirection.translations
          )

          return {
            id: pd.priorityDirection.id,
            name: directionTranslation?.name || ""
          }
        })
      }
    })
    
    return NextResponse.json({
      data: formattedObjects,
      meta: {
        total,
        page,
        limit,
        hasMore: page * limit < total
      }
    })

  } catch (error) {
    console.error('Error fetching objects:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}