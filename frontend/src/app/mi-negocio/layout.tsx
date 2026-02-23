import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Negocio | BookHub",
  description:
    "Administra tu negocio, servicios, trabajadores y citas en BookHub.",
};

export default function MiNegocioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
