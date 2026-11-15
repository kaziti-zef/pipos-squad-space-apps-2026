"use client";

import { useEffect, useRef, useState } from "react";
import { Info, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { members } from "@/lib/mocks";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";


const AVATAR: Record<string, string> = {
  mbr_01: "bg-leaf text-forest-950",
  mbr_02: "bg-warn-100 text-warn-800",
  mbr_03: "bg-info-600 text-white",
  mbr_05: "bg-stone text-ink-muted",
};

/** Membres de la ferme (CU2) : rôles, invitation d'un compte inexistant. */
export function MembersView() {
  const { t } = useI18n();
  const mb = t.members;
  const ROLE_LABEL: Record<Role, string> = t.roles;
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("advisor");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">{t.common.farmName}</p>
          <h1 className="mt-1.5 font-display text-[30px] font-bold tracking-[-0.5px]">{mb.title}</h1>
          <p className="mt-1.5 text-ink-muted">{mb.subtitle}</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus aria-hidden className="size-[18px]" strokeWidth={2.2} /> {mb.add}
        </Button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr className="text-[13px] uppercase tracking-[1px] text-ink-muted">
              <th className="px-4 py-3 font-semibold">{mb.cols.member}</th>
              <th className="px-4 py-3 font-semibold">{mb.cols.role}</th>
              <th className="px-4 py-3 font-semibold">{mb.cols.status}</th>
              <th className="px-4 py-3 font-semibold">{mb.cols.added}</th>
              <th className="px-4 py-3">
                <span className="sr-only">{mb.cols.actions}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const pending = m.status === "pending";
              return (
                <tr key={m.member_id} className="border-t border-line-soft text-sm">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className={cn("flex size-10 items-center justify-center rounded-full font-bold", AVATAR[m.member_id])}>{m.initials}</span>
                      <div>
                        <p className={cn("font-semibold", pending && "text-ink-muted")}>
                          {pending ? mb.invitationSent : m.role === "owner" ? `${m.full_name} ${mb.you}` : m.full_name}
                        </p>
                        <p className="text-sm text-ink-muted">{m.identifier}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {m.role === "owner" || pending ? (
                      <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[13px] font-bold", m.role === "owner" ? "bg-forest text-white" : "bg-info-100 text-info-800")}>
                        {ROLE_LABEL[m.role]}
                      </span>
                    ) : (
                      <select aria-label={fmt(mb.roleOf, { name: m.full_name ?? "" })} defaultValue={m.role} className="field-input min-h-10 w-auto">
                        <option value="co_farmer">{t.roles.co_farmer}</option>
                        <option value="advisor">{t.roles.advisor}</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-semibold">
                    {pending ? <span className="text-warn-700">{mb.pending}</span> : <span className="text-forest">{mb.active}</span>}
                  </td>
                  <td className="px-4 py-3.5">{m.added_at}</td>
                  <td className="px-4 py-3.5 text-right">
                    {m.role === "owner" ? (
                      <button type="button" className="min-h-10 text-sm font-semibold text-forest">{mb.transfer}</button>
                    ) : pending ? (
                      <button type="button" className="min-h-10 text-sm font-semibold text-forest">{mb.resend}</button>
                    ) : (
                      <button type="button" className="min-h-10 text-sm font-semibold text-danger-600">{mb.remove}</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
        {mb.roleCards.map(({ title: t, text: d }) => (
          <div key={t} className="card p-[18px]">
            <p className="font-bold">{t}</p>
            <p className="mt-1.5 text-sm leading-[1.5] text-ink-muted">{d}</p>
          </div>
        ))}
      </div>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        aria-labelledby="add-member-title"
        className="m-auto w-[min(560px,calc(100%-32px))] rounded-2xl bg-white p-0 shadow-card backdrop:bg-forest-950/45"
      >
        <div className="flex flex-col gap-4 p-[26px]">
          <div className="flex items-center justify-between">
            <h2 id="add-member-title" className="font-display text-[21px] font-semibold">{mb.modal.title}</h2>
            <button type="button" aria-label={t.common.close} onClick={() => setOpen(false)} className="flex size-11 items-center justify-center rounded-full bg-beige">
              <X aria-hidden className="size-[18px]" />
            </button>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">{mb.modal.identifier}</span>
            <input className="field-input" defaultValue="conseiller.irad@exemple.cm" />
          </label>
          <div className="flex flex-wrap gap-2.5">
            {(
              [
                ["co_farmer", t.roles.co_farmer, mb.modal.coFarmerHint],
                ["advisor", t.roles.advisor, mb.modal.advisorHint],
              ] as const
            ).map(([value, label, hint]) => (
              <button
                key={value}
                type="button"
                aria-pressed={role === value}
                onClick={() => setRole(value)}
                className={cn(
                  "flex-[1_1_200px] rounded-lg border-[1.5px] p-3.5 text-left text-sm",
                  role === value ? "border-forest bg-leaf-50" : "border-field bg-white",
                )}
              >
                <strong>{label}</strong>
                <br />
                <span className="text-sm text-ink-muted">{hint}</span>
              </button>
            ))}
          </div>
          <p className="flex gap-2.5 rounded-md bg-warn-100 px-3.5 py-3 text-sm leading-[1.45] text-warn-800">
            <Info aria-hidden className="mt-px size-[18px] shrink-0" />
            {mb.modal.notFound}
          </p>
          <div className="flex flex-wrap justify-end gap-2.5">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={() => setOpen(false)}>{mb.modal.send}</Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
