import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  // Public routes — always allowed
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/'
  ) {
    // Redirect authenticated users away from auth pages
    if (token && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
      const role = token.role as string
      return NextResponse.redirect(
        new URL(role === 'ADMIN' || role === 'SUPER_ADMIN' ? '/admin' : '/app/dashboard', req.url),
      )
    }
    return NextResponse.next()
  }

  // Unauthenticated — redirect to login
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin routes — require ADMIN or SUPER_ADMIN role
  if (pathname.startsWith('/admin')) {
    const role = token.role as string
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/app/dashboard', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
