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

// Rutas protegidas que requieren autenticación
const protectedPaths = [
  "/perfil",
  "/mis-citas",
  "/mi-agenda",
  "/mi-negocio",
  "/favoritos",
  "/notificaciones",
];

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

  // Check for access token in cookies (middleware can't read localStorage)
  const accessToken = request.cookies.get("accessToken")?.value;
  const hasToken = !!accessToken;

  // Si el usuario está autenticado y visita rutas de auth-only, redirigir al home
  if (hasToken) {
    const isAuthOnlyPath = authOnlyPaths.some(
      (path) => pathname === path || pathname.startsWith(path + "/"),
    );
    if (isAuthOnlyPath) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Verificar si es una ruta pública
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );

  // Si es ruta pública, permitir acceso
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Para rutas protegidas, la verificación final la hace ProtectedRoute en el cliente
  // (ya que el middleware no tiene acceso a localStorage donde se guardan los tokens)
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
