import { PageContainer } from "./PageHeader";

/** Repli affiché pendant la résolution des paramètres de route (Suspense). */
export function PageSkeleton({ width = "app" }: { width?: "app" | "wide" | "narrow" }) {
  return (
    <PageContainer width={width}>
      <div className="h-[72px] w-2/3 animate-pulse rounded-md bg-sand" aria-hidden />
      <div className="card h-[520px] animate-pulse" aria-hidden />
    </PageContainer>
  );
}
