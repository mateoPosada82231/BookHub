import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mis Citas | BookHub",
  description: "Revisa y gestiona tus citas programadas en BookHub.",
};

export default function MisCitasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
