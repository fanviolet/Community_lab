import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <DashboardSidebar />
      <div className="flex min-h-screen flex-col pl-[260px]">
        <DashboardHeader />
        <main className="flex-1 p-6 transition-colors duration-200 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
