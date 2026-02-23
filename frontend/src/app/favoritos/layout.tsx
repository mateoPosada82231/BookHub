import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mis Favoritos | BookHub",
  description: "Tus negocios favoritos guardados en BookHub.",
};

export default function FavoritosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
