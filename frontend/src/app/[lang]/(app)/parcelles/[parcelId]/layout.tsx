import { parcels } from "@/lib/mocks";

/** Prérendu des parcelles de démonstration (à remplacer par GET /farms/{id}/parcels en phase 3). */
export function generateStaticParams() {
  return parcels.map((p) => ({ parcelId: p.id }));
}

export default function ParcelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
