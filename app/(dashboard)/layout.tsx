import { auth } from "@/auth";
import { Shell } from "@/components/Shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  return <Shell isAdmin={isAdmin}>{children}</Shell>;
}