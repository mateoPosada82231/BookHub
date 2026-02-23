import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión | BookHub",
  description:
    "Inicia sesión en BookHub para reservar citas y gestionar tu negocio.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
