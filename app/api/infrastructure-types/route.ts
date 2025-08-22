import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const revalidate = parseInt(process.env.CACHE_REVALIDATE_SECONDS || "600")

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const lang = searchParams.get("lang") || "ru"
    
    const types = await prisma.infrastructureType.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        code: true,
        markerColor: true,
        order: true,
        translations: {
          where: { languageCode: lang },
          select: { name: true }
        }
      }
    })
    
    const formattedTypes = types.map(type => ({
      id: type.id,
      code: type.code,
      color: type.markerColor,
      order: type.order,
      name: type.translations[0]?.name || type.code
    }))
    
    return NextResponse.json({ data: formattedTypes })
    
  } catch (error) {
    console.error('Error fetching infrastructure types:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}