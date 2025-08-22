import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const revalidate = parseInt(process.env.CACHE_REVALIDATE_SECONDS || "600")

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const lang = searchParams.get("lang") || "ru"
    
    const directions = await prisma.priorityDirection.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        order: true,
        translations: {
          where: { languageCode: lang },
          select: { name: true }
        }
      }
    })
    
    const formattedDirections = directions.map(direction => ({
      id: direction.id,
      order: direction.order,
      name: direction.translations[0]?.name || ''
    }))
    
    return NextResponse.json({ data: formattedDirections })
    
  } catch (error) {
    console.error('Error fetching priority directions:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}