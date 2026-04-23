import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { Toaster } from "@/components/ui/toast";
import { ErrorBoundaryWrapper } from "@/components/ui/ErrorBoundaryWrapper";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BookHub - Reserva en tus lugares favoritos",
  description:
    "Reserva citas en restaurantes, salones de belleza, gimnasios, spas, cafeterías y más. Encuentra, compara y agenda servicios en tu ciudad.",
  keywords: [
    "reservas",
    "citas",
    "restaurantes",
    "spa",
    "salón de belleza",
    "gimnasio",
    "cafetería",
  ],
  openGraph: {
    title: "BookHub - Reserva en tus lugares favoritos",
    description:
      "La plataforma para descubrir y reservar en tus establecimientos favoritos.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`dark ${inter.variable} ${plusJakarta.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className={`antialiased ${inter.className}`}>
        <AuthProvider>
          <NotificationProvider>
            <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
