import { MobileNav, MobileTopBar, Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-beige">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <MobileTopBar />
        {children}
      </div>
      <MobileNav />
    </div>
  );
}
