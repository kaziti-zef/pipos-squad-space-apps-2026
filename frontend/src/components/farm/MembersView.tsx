"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Info, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { useApp } from "@/lib/api/app-context";
import * as endpoints from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import type { MemberItem } from "@/lib/api/types";
import { members as demoMembers } from "@/lib/mocks";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

type Row = MemberItem & { added_at?: string };

const AVATAR: Record<Role | "pending", string> = {
  owner: "bg-leaf text-forest-950",
  co_farmer: "bg-warn-100 text-warn-800",
  advisor: "bg-info-600 text-white",
  pending: "bg-stone text-ink-muted",
};

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/**
 * Membres de la ferme (CU2) : rôles, invitation d'un compte inexistant.
 * Backend : GET/POST/PATCH/DELETE /farms/{id}/members ; seul l'agriculteur principal gère les membres.
 */
export function MembersView() {
  const { t } = useI18n();
  const { apiEnabled, farm, role: myRole } = useApp();
  const mb = t.members;
  const ROLE_LABEL: Record<Role, string> = t.roles;
  const canManage = !apiEnabled || myRole === "owner";
  const [rows, setRows] = useState<Row[]>(apiEnabled ? [] : (demoMembers as unknown as Row[]));
  const [loadError, setLoadError] = useState("");
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("advisor");
  const [identifier, setIdentifier] = useState(apiEnabled ? "" : "conseiller.irad@exemple.cm");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [invitation, setInvitation] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const reload = useCallback(async () => {
    if (!apiEnabled || !farm) return;
    try {
      setRows((await endpoints.farms.members(farm.id)).members);
      setLoadError("");
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : t.api.network);
    }
  }, [apiEnabled, farm, t.api.network]);

  useEffect(() => {
    const id = setTimeout(() => void reload(), 0);
    return () => clearTimeout(id);
  }, [reload]);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      await reload();
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : t.api.network);
    }
  };

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!apiEnabled) return setOpen(false);
    if (!farm || !identifier.trim()) return;
    setPending(true);
    setFormError("");
    try {
      const created = await endpoints.farms.addMember(farm.id, identifier.trim(), role === "owner" ? "co_farmer" : role);
      await reload();
      if (created.status === "pending" && created.invitation) setInvitation(created.invitation.link);
      else {
        setOpen(false);
        setIdentifier("");
      }
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t.api.network);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">{apiEnabled ? farm?.name : t.common.farmName}</p>
          <h1 className="mt-1.5 font-display text-[30px] font-bold tracking-[-0.5px]">{mb.title}</h1>
          <p className="mt-1.5 text-ink-muted">{mb.subtitle}</p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setInvitation(null);
              setFormError("");
              setOpen(true);
            }}
          >
            <Plus aria-hidden className="size-[18px]" strokeWidth={2.2} /> {mb.add}
          </Button>
        )}
      </div>

      {loadError && (
        <p role="alert" className="rounded-md bg-danger-100 px-3.5 py-3 text-sm text-danger-800">
          {loadError}
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr className="text-[13px] uppercase tracking-[1px] text-ink-muted">
              <th className="px-4 py-3 font-semibold">{mb.cols.member}</th>
              <th className="px-4 py-3 font-semibold">{mb.cols.role}</th>
              <th className="px-4 py-3 font-semibold">{mb.cols.status}</th>
              {!apiEnabled && <th className="px-4 py-3 font-semibold">{mb.cols.added}</th>}
              <th className="px-4 py-3">
                <span className="sr-only">{mb.cols.actions}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const isPending = m.status === "pending";
              return (
                <tr key={m.member_id} className="border-t border-line-soft text-sm">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className={cn("flex size-10 items-center justify-center rounded-full font-bold", AVATAR[isPending ? "pending" : m.role])}>
                        {initials(m.full_name)}
                      </span>
                      <div>
                        <p className={cn("font-semibold", isPending && "text-ink-muted")}>
                          {isPending ? mb.invitationSent : m.role === "owner" && myRole === "owner" ? `${m.full_name} ${mb.you}` : m.full_name}
                        </p>
                        <p className="text-sm text-ink-muted">{m.identifier}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {m.role === "owner" || isPending || !canManage ? (
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[13px] font-bold",
                          m.role === "owner" ? "bg-forest text-white" : "bg-info-100 text-info-800",
                        )}
                      >
                        {ROLE_LABEL[m.role]}
                      </span>
                    ) : (
                      <select
                        aria-label={fmt(mb.roleOf, { name: m.full_name ?? "" })}
                        value={m.role}
                        onChange={(e) => {
                          const next = e.target.value as "co_farmer" | "advisor";
                          if (!apiEnabled || !farm) return setRows((r) => r.map((x) => (x.member_id === m.member_id ? { ...x, role: next } : x)));
                          void act(() => endpoints.farms.updateMember(farm.id, m.member_id, { role: next, resend_invitation: false }));
                        }}
                        className="field-input min-h-10 w-auto"
                      >
                        <option value="co_farmer">{t.roles.co_farmer}</option>
                        <option value="advisor">{t.roles.advisor}</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-semibold">
                    {isPending ? <span className="text-warn-700">{mb.pending}</span> : <span className="text-forest">{mb.active}</span>}
                  </td>
                  {!apiEnabled && <td className="px-4 py-3.5">{m.added_at}</td>}
                  <td className="px-4 py-3.5 text-right">
                    {!canManage || m.role === "owner" ? null : (
                      <button
                        type="button"
                        onClick={() => farm && apiEnabled && void act(() => endpoints.farms.removeMember(farm.id, m.member_id))}
                        className="min-h-10 text-sm font-semibold text-danger-600"
                      >
                        {mb.remove}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
        {mb.roleCards.map(({ title, text }) => (
          <div key={title} className="card p-[18px]">
            <p className="font-bold">{title}</p>
            <p className="mt-1.5 text-sm leading-[1.5] text-ink-muted">{text}</p>
          </div>
        ))}
      </div>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        aria-labelledby="add-member-title"
        className="m-auto w-[min(560px,calc(100%-32px))] rounded-2xl bg-white p-0 shadow-card backdrop:bg-forest-950/45"
      >
        <form onSubmit={add} className="flex flex-col gap-4 p-[26px]">
          <div className="flex items-center justify-between">
            <h2 id="add-member-title" className="font-display text-[21px] font-semibold">{mb.modal.title}</h2>
            <button type="button" aria-label={t.common.close} onClick={() => setOpen(false)} className="flex size-11 items-center justify-center rounded-full bg-beige">
              <X aria-hidden className="size-[18px]" />
            </button>
          </div>
          {invitation ? (
            <div className="flex flex-col gap-2.5 rounded-md bg-warn-100 px-3.5 py-3 text-sm leading-[1.45] text-warn-800">
              <p className="flex gap-2.5">
                <Info aria-hidden className="mt-px size-[18px] shrink-0" />
                {mb.modal.notFound}
              </p>
              <input readOnly value={invitation} aria-label={t.api.invitationLink} className="field-input bg-white text-ink" onFocus={(e) => e.currentTarget.select()} />
            </div>
          ) : (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">{mb.modal.identifier}</span>
                <input className="field-input" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
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
              {!apiEnabled && (
                <p className="flex gap-2.5 rounded-md bg-warn-100 px-3.5 py-3 text-sm leading-[1.45] text-warn-800">
                  <Info aria-hidden className="mt-px size-[18px] shrink-0" />
                  {mb.modal.notFound}
                </p>
              )}
              {formError && (
                <p role="alert" className="rounded-md bg-danger-100 px-3.5 py-3 text-sm text-danger-800">
                  {formError}
                </p>
              )}
            </>
          )}
          <div className="flex flex-wrap justify-end gap-2.5">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {invitation ? t.common.close : t.common.cancel}
            </Button>
            {!invitation && (
              <Button type="submit" disabled={pending}>
                {pending ? t.api.pending : mb.modal.send}
              </Button>
            )}
          </div>
        </form>
      </dialog>
    </>
  );
}
