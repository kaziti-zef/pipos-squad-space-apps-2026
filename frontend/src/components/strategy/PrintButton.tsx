"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";

/** Export PDF : en attendant GET …/export.pdf, repli sur l'impression du navigateur (CU12-E1). */
export function PrintButton() {
  const { t } = useI18n();
  return (
    <Button variant="outline" onClick={() => window.print()} className="no-print">
      <Download aria-hidden className="size-[18px]" /> {t.common.exportPdf}
    </Button>
  );
}
