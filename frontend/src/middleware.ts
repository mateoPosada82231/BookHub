import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas públicas que no requieren autenticación
const publicPaths = [
  "/",
  "/login",
  "/registro",
  "/recuperar-password",
  "/reset-password",
  "/negocio",
];

// Rutas que redirigen al home si el usuario YA está autenticado
const authOnlyPaths = ["/login", "/registro", "/recuperar-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Si es una ruta de API, archivos estáticos o _next, no interferir
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Verificar si es una ruta pública
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );

  // Si es ruta pública, permitir acceso
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Para rutas protegidas, la verificación real la hace el componente ProtectedRoute
  // El middleware permite el paso pero el cliente verificará la autenticación
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
