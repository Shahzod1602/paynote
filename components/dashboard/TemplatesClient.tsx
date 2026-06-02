"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTemplate, updateTemplate, deleteTemplate } from "@/lib/actions/templates";
import { renderTemplate, SAMPLE_VARS, TEMPLATE_VARIABLES } from "@/lib/notify/template";
import type { TemplateView, TemplateType, TemplateStatus } from "@/lib/queries";
import type { Locale } from "@/i18n/config";

type Lang = "uz" | "ru" | "en";

type TemplatesDict = {
  title: string;
  subtitle: string;
  add: string;
  empty: string;
  edit: string;
  delete: string;
  deleteConfirm: string;
  save: string;
  cancel: string;
  saving: string;
  error: string;
  newTemplate: string;
  editTemplate: string;
  moderationNote: string;
  typeLabel: string;
  nameLabel: string;
  namePlaceholder: string;
  bodyLabel: string;
  bodyPlaceholder: string;
  variablesHint: string;
  requiresDebt: string;
  requiresDay: string;
  smsEnabled: string;
  previewSender: string;
  previewEmpty: string;
  types: Record<TemplateType, string>;
  statuses: Record<TemplateStatus, string>;
};

type Props = { locale: Locale; templates: TemplateView[]; dict: TemplatesDict };

const TYPES: TemplateType[] = ["REMINDER", "OVERDUE", "PAYMENT", "CUSTOM"];
const LANGS: Lang[] = ["uz", "ru", "en"];
const LANG_LABEL: Record<Lang, string> = { uz: "UZ", ru: "RU", en: "EN" };

const statusBadge: Record<TemplateStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-rose-50 text-rose-700",
};

function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button type="button" onClick={onToggle} className="flex items-center gap-2.5 text-left">
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-brand-600" : "bg-slate-200"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? "left-[22px]" : "left-0.5"}`}
        />
      </span>
      <span className="text-sm text-ink">{label}</span>
    </button>
  );
}

export function TemplatesClient({ locale, templates, dict }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Editor state
  const [type, setType] = useState<TemplateType>("REMINDER");
  const [name, setName] = useState("");
  const [bodies, setBodies] = useState<Record<Lang, string>>({ uz: "", ru: "", en: "" });
  const [lang, setLang] = useState<Lang>("uz");
  const [requiresDebt, setRequiresDebt] = useState(true);
  const [requiresDay, setRequiresDay] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function openNew() {
    setEditing(null);
    setType("REMINDER");
    setName("");
    setBodies({ uz: "", ru: "", en: "" });
    setLang("uz");
    setRequiresDebt(true);
    setRequiresDay(false);
    setSmsEnabled(true);
    setError(null);
    setOpen(true);
  }

  function openEdit(t: TemplateView) {
    setEditing(t);
    setType(t.type);
    setName(t.name);
    setBodies({ uz: t.bodyUz, ru: t.bodyRu, en: t.bodyEn });
    setLang("uz");
    setRequiresDebt(t.requiresDebt);
    setRequiresDay(t.requiresDay);
    setSmsEnabled(t.smsEnabled);
    setError(null);
    setOpen(true);
  }

  function insertVar(v: string) {
    const token = `{{${v}}}`;
    const el = textareaRef.current;
    const current = bodies[lang];
    if (!el) {
      setBodies((b) => ({ ...b, [lang]: current + token }));
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    setBodies((b) => ({ ...b, [lang]: next }));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function setBody(value: string) {
    setBodies((b) => ({ ...b, [lang]: value }));
  }

  function onSubmit() {
    setError(null);
    if (name.trim().length < 2 || !bodies.uz.trim() || !bodies.ru.trim() || !bodies.en.trim()) {
      setError(dict.error);
      return;
    }
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("type", type);
    fd.set("name", name.trim());
    fd.set("bodyUz", bodies.uz.trim());
    fd.set("bodyRu", bodies.ru.trim());
    fd.set("bodyEn", bodies.en.trim());
    fd.set("requiresDebt", String(requiresDebt));
    fd.set("requiresDay", String(requiresDay));
    fd.set("smsEnabled", String(smsEnabled));
    if (editing) fd.set("id", editing.id);
    startTransition(async () => {
      const res = editing ? await updateTemplate(fd) : await createTemplate(fd);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(dict.error);
      }
    });
  }

  function onDelete(t: TemplateView) {
    if (!confirm(dict.deleteConfirm)) return;
    const fd = new FormData();
    fd.set("id", t.id);
    fd.set("locale", locale);
    startTransition(async () => {
      await deleteTemplate(fd);
      router.refresh();
    });
  }

  const preview = renderTemplate(bodies[lang], SAMPLE_VARS);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">{dict.title}</h1>
          <p className="mt-1 text-sm text-muted">{dict.subtitle}</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {dict.add}
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-card border border-line bg-white p-10 text-center text-sm text-muted shadow-soft">
          {dict.empty}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="flex flex-col rounded-card border border-line bg-white p-4 shadow-soft">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-muted">{dict.types[t.type]}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge[t.status]}`}>
                  {dict.statuses[t.status]}
                </span>
              </div>
              <p className="mb-3 line-clamp-3 flex-1 text-sm text-muted">{t.bodyUz}</p>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {t.smsEnabled && <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs text-brand-700">SMS</span>}
                {t.requiresDebt && <span className="rounded-md bg-surface px-2 py-0.5 text-xs text-muted">{dict.requiresDebt}</span>}
                {t.requiresDay && <span className="rounded-md bg-surface px-2 py-0.5 text-xs text-muted">{dict.requiresDay}</span>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(t)}
                  className="flex-1 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-surface"
                >
                  {dict.edit}
                </button>
                <button
                  onClick={() => onDelete(t)}
                  className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  {dict.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-line bg-white p-5 shadow-pop sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">{editing ? dict.editTemplate : dict.newTemplate}</h3>
              <button
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-ink"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">{dict.moderationNote}</div>

            <div className="grid gap-5 md:grid-cols-[1fr_280px]">
              {/* Left: form */}
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">{dict.typeLabel}</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TemplateType)}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-400"
                  >
                    {TYPES.map((ty) => (
                      <option key={ty} value={ty}>{dict.types[ty]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">{dict.nameLabel}</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={dict.namePlaceholder}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-400"
                  />
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  <Switch on={requiresDebt} onToggle={() => setRequiresDebt((v) => !v)} label={dict.requiresDebt} />
                  <Switch on={requiresDay} onToggle={() => setRequiresDay((v) => !v)} label={dict.requiresDay} />
                  <Switch on={smsEnabled} onToggle={() => setSmsEnabled((v) => !v)} label={dict.smsEnabled} />
                </div>

                <div>
                  <div className="mb-2 inline-flex rounded-lg border border-line p-0.5">
                    {LANGS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLang(l)}
                        className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                          lang === l ? "bg-brand-600 text-white" : "text-muted hover:text-ink"
                        }`}
                      >
                        {LANG_LABEL[l]}
                      </button>
                    ))}
                  </div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">{dict.bodyLabel}</label>
                  <textarea
                    ref={textareaRef}
                    value={bodies[lang]}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={dict.bodyPlaceholder}
                    rows={5}
                    className="w-full resize-y rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-400"
                  />
                  <p className="mt-2 text-xs text-muted">{dict.variablesHint}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {TEMPLATE_VARIABLES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVar(v)}
                        className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-xs text-brand-700 transition hover:bg-brand-50"
                      >
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: phone preview */}
              <div className="flex justify-center">
                <div className="w-[260px] rounded-[2rem] border-4 border-slate-800 bg-slate-100 p-2 shadow-pop">
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] text-slate-500">
                    <span>12:45</span>
                    <span>●●● ▭</span>
                  </div>
                  <div className="rounded-2xl bg-white px-2 pb-4 pt-2">
                    <div className="border-b border-line pb-2 text-center">
                      <p className="text-sm font-semibold text-ink">{dict.previewSender}</p>
                      <p className="text-[10px] text-muted">SMS Service</p>
                    </div>
                    <div className="mt-3 min-h-[80px]">
                      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2 text-xs text-ink">
                        {preview.trim() ? preview : <span className="text-muted">{dict.previewEmpty}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface"
              >
                {dict.cancel}
              </button>
              <button
                onClick={onSubmit}
                disabled={pending}
                className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-60"
              >
                {pending ? dict.saving : dict.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
