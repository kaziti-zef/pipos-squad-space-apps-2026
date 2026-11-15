import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Poppins } from "next/font/google";
import { BrandMark } from "@/components/layout/Logo";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "600"] });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["700"] });

export const metadata: Metadata = {
  title: "Page introuvable · Page not found — AgriRot",
};

/**
 * 404 des URL qui ne correspondent à aucune route (option experimental.globalNotFound).
 * Rendue hors de app/[lang] : pas de dictionnaire, donc message bilingue.
 * Les 404 internes (notFound() dans une page) utilisent app/[lang]/not-found.tsx, traduite.
 */
export default function GlobalNotFound() {
  return (
    <html lang="fr" className={`${inter.variable} ${poppins.variable} h-full`}>
      <body className="flex min-h-full items-center justify-center bg-beige px-4 py-16">
        <main className="card flex max-w-[480px] flex-col items-center gap-4 p-8 text-center">
          <BrandMark size={56} />
          <h1 className="font-display text-2xl font-bold">Page introuvable</h1>
          <p className="text-base leading-[1.55] text-ink-soft">Cette page n&apos;existe pas ou a été déplacée.</p>
          <p lang="en" className="text-base leading-[1.55] text-ink-muted">
            Page not found. This page does not exist or has been moved.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/fr"
              className="inline-flex min-h-[46px] items-center rounded-full bg-forest px-[18px] text-sm font-semibold text-white no-underline hover:bg-forest-950 hover:text-white"
            >
              Retour à l&apos;accueil
            </Link>
            <Link
              href="/en"
              lang="en"
              className="inline-flex min-h-[46px] items-center rounded-full bg-sand-200 px-[18px] text-sm font-semibold text-forest no-underline hover:bg-sand"
            >
              Back to home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
