import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/test']
  const isPublicPath = publicPaths.includes(pathname)
  
  // Allow access to any file in the public directory
  const isPublicFile = pathname.startsWith('/') && !pathname.startsWith('/api') && !pathname.startsWith('/_next')

  // If trying to access a protected route without a token
  if (!token && !isPublicPath && !isPublicFile) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If trying to access login/signup page with a token
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 