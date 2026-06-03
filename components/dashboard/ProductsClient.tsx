"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { createProduct, updateProduct, deleteProduct } from "@/lib/actions/products";
import { formatMoney, type Currency } from "@/lib/format";
import type { ProductView } from "@/lib/queries";
import type { Locale } from "@/i18n/config";

type ProductsDict = {
  title: string;
  subtitle: string;
  add: string;
  empty: string;
  name: string;
  price: string;
  namePlaceholder: string;
  pricePlaceholder: string;
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  deleteConfirm: string;
  saving: string;
  error: string;
  newProduct: string;
  editProduct: string;
};

type Props = { locale: Locale; products: ProductView[]; currency: Currency; dict: ProductsDict };

export function ProductsClient({ locale, products, currency, dict }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openNew() {
    setEditing(null);
    setError(null);
    setOpen(true);
  }
  function openEdit(p: ProductView) {
    setEditing(p);
    setError(null);
    setOpen(true);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("locale", locale);
    if (editing) fd.set("id", editing.id);
    startTransition(async () => {
      const res = editing ? await updateProduct(fd) : await createProduct(fd);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else setError(dict.error);
    });
  }

  function onDelete(p: ProductView) {
    if (!confirm(dict.deleteConfirm)) return;
    const fd = new FormData();
    fd.set("id", p.id);
    fd.set("locale", locale);
    startTransition(async () => {
      await deleteProduct(fd);
      router.refresh();
    });
  }

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

      {products.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-white p-10 text-center text-sm text-muted">
          {dict.empty}
        </p>
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-white shadow-soft">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">{dict.name}</th>
                <th className="px-5 py-3 text-right font-medium">{dict.price}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-5 py-3.5 font-medium text-ink">{p.name}</td>
                  <td className="px-5 py-3.5 text-right font-bold tabular-nums text-ink">{formatMoney(p.price, currency)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:border-brand-300 hover:text-brand-700"
                      >
                        {dict.edit}
                      </button>
                      <button
                        onClick={() => onDelete(p)}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                      >
                        {dict.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? dict.editProduct : dict.newProduct}>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">{dict.name}</span>
            <input
              name="name"
              required
              defaultValue={editing?.name}
              placeholder={dict.namePlaceholder}
              className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">{dict.price}</span>
            <input
              name="price"
              required
              type="text"
              inputMode="numeric"
              defaultValue={editing ? String(editing.price) : ""}
              placeholder={dict.pricePlaceholder}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface"
            >
              {dict.cancel}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-60"
            >
              {pending ? dict.saving : dict.save}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
