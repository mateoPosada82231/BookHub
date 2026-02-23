import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Agenda | BookHub",
  description: "Consulta tu agenda de trabajo y citas programadas en BookHub.",
};

export default function MiAgendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
