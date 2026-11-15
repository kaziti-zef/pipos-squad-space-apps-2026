import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { I18nProvider } from "@/i18n/client";
import { LOCALES } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { ApiModeProvider } from "@/lib/api/app-context";
import { API_ENABLED } from "@/lib/api/config";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700"],
});

/** Les deux langues sont prérendues (obligatoire avec Cache Components). */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: t.meta.title, template: "%s · AgriRot" },
    description: t.meta.description,
    alternates: { languages: { fr: "/fr", en: "/en" } },
  };
}

export const viewport: Viewport = {
  themeColor: "#14532D",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getI18n();
  return (
    <html lang={lang} data-scroll-behavior="smooth" className={`${inter.variable} ${poppins.variable} h-full`}>
      <body className="min-h-full">
        <I18nProvider lang={lang} dict={t}>
          <ApiModeProvider apiEnabled={API_ENABLED}>{children}</ApiModeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
