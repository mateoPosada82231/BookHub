import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Perfil | BookHub",
  description: "Gestiona tu perfil, citas y favoritos en BookHub.",
};

export default function PerfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
