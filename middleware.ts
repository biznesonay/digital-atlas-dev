import { NextRequest, NextResponse } from 'next/server'

const BLOCKED_PATHS = [
  '/wp-content',
  '/wp-admin',
  '/wordpress',
  '.php',
  '.cgi',
  '/devicesgateway',
  '/apply_sec',
  '/.env',
  '/config',
  '/phpmyadmin',
  '/.git',
  '/backup',
]

export function middleware(request: NextRequest) {
  const start = Date.now()
  const { pathname, searchParams } = request.nextUrl
  const pathnameLower = pathname.toLowerCase()

  const isBlocked = BLOCKED_PATHS.some((path) => pathnameLower.includes(path))

  if (isBlocked) {
    console.warn(
      `[SECURITY] Blocked suspicious request: ${pathname} from ${request.ip ?? 'unknown'}`
    )

    return new NextResponse(null, { status: 404 })
  }

  // Логирование API запросов
  if (pathname.startsWith('/api/')) {
    console.log(
      `[API] ${new Date().toISOString()} ${request.method} ${pathname}${
        searchParams.toString() ? `?${searchParams.toString()}` : ''
      }`
    )
  }

  // Логирование админских действий
  if (pathname.startsWith('/admin/')) {
    const sessionToken = request.cookies.get('next-auth.session-token')
    console.log(
      `[ADMIN] ${new Date().toISOString()} ${request.method} ${pathname} [Session: ${
        sessionToken ? 'Active' : 'None'
      }]`
    )
  }

  // Создание ответа с заголовками производительности и безопасности
  const response = NextResponse.next()
  
  // Заголовки производительности
  response.headers.set('X-Response-Time', `${Date.now() - start}ms`)
  
  // Заголовки безопасности
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
  
  // CSP в report-only режиме для MVP
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy-Report-Only',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "connect-src 'self' https://maps.googleapis.com; " +
      "frame-src 'self' https://maps.google.com"
    )
  }
  
  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
}