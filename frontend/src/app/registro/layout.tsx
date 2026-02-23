import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registro | BookHub",
  description:
    "Crea tu cuenta en BookHub. Reserva citas o gestiona tu negocio de belleza.",
};

export default function RegistroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
