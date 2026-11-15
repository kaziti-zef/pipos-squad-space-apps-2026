import { MobileNav, MobileTopBar, Sidebar } from "@/components/layout/Sidebar";
import { AppProvider } from "@/lib/api/app-context";
import { API_ENABLED } from "@/lib/api/config";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider apiEnabled={API_ENABLED}>
      <div className="flex min-h-dvh bg-beige">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
          <MobileTopBar />
          {children}
        </div>
        <MobileNav />
      </div>
    </AppProvider>
  );
}
