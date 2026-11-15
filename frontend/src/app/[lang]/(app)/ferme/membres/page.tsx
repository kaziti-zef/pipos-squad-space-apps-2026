import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageHeader";
import { MembersView } from "@/components/farm/MembersView";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.members.pageTitle };
}

export default function MembersPage() {
  return (
    <main className="flex-1">
      <PageContainer width="narrow" className="gap-5 pt-8">
        <MembersView />
      </PageContainer>
    </main>
  );
}
