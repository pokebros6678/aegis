import { auth } from "@/auth";
import { Shell } from "@/components/Shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await auth();
  return <Shell>{children}</Shell>;
}