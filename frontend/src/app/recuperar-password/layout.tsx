import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recuperar Contraseña | BookHub",
  description: "Recupera el acceso a tu cuenta de BookHub.",
};

export default function RecuperarPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
