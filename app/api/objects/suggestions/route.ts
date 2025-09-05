import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const revalidate = parseInt(process.env.CACHE_REVALIDATE_SECONDS || "600")

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("query")?.trim()
    if (!query) {
      return NextResponse.json([])
    }

    const objects = await prisma.object.findMany({
      where: {
        isPublished: true,
        translations: {
          some: {
            languageCode: "ru",
            OR: [
              { name: { startsWith: query, mode: "insensitive" } },
              { address: { startsWith: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
              { address: { contains: query, mode: "insensitive" } }
            ]
          }
        }
      },
      select: {
        id: true,
        translations: {
          where: { languageCode: "ru" },
          select: { name: true, address: true }
        }
      },
      take: 10
    })

    const suggestions = objects.map(obj => ({
      id: obj.id,
      name: obj.translations[0]?.name || "",
      address: obj.translations[0]?.address || ""
    }))

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error("Error fetching object suggestions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}