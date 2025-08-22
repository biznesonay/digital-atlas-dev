import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const revalidate = parseInt(process.env.CACHE_REVALIDATE_SECONDS || "600")

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const lang = searchParams.get("lang") || "ru"
    
    const regions = await prisma.region.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        code: true,
        order: true,
        translations: {
          where: { languageCode: lang },
          select: { name: true }
        }
      }
    })
    
    const formattedRegions = regions.map(region => ({
      id: region.id,
      code: region.code,
      order: region.order,
      name: region.translations[0]?.name || region.code
    }))
    
    return NextResponse.json({ data: formattedRegions })
    
  } catch (error) {
    console.error('Error fetching regions:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}