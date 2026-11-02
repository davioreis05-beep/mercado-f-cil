import { useEffect, useSyncExternalStore } from "react";
import { PRODUCTS } from "./catalog";

export type Method = "PEPS" | "PVPS" | "MEDIO";
export type Location = "Loja" | "Depósito";
export type MoveType = "entrada" | "saida" | "transferencia" | "perda" | "ajuste";
export type Origin = "PDV" | "Compras" | "Produção" | "Transferência" | "Inventário" | "Perda";

export type Item = { id: number; min: number; max: number; reorder: number; method: Method; cost: number };
export type Lot = { id: string; itemId: number; code: string; serial: string; qty: number; cost: number; expiry: string; entered: string; location: Location };
export type Movement = { id: string; date: string; itemId: number; type: MoveType; qty: number; origin: Origin; cost: number; value: number; lot: string; doc: string; note: string };
export type Invoice = { number: string; date: string; kind: "Saída" | "Entrada"; ref: string; total: number };
export type State = { items: Item[]; lots: Lot[]; moves: Movement[]; invoices: Invoice[]; seq: number };

const KEY = "sf-inventory-v1";
const DAY = 86400000;
const BASE = Date.UTC(2026, 10, 2, 12);
const iso = (t: number) => new Date(t).toISOString();

function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
}

function seed(): State {
  const r = rng(42);
  const items: Item[] = PRODUCTS.map((p, i) => ({
    id: p.id, min: 10 + (i % 4) * 5, max: 80 + (i % 3) * 40, reorder: 20 + (i % 4) * 5,
    method: p.cat === "Hortifruti" || p.cat === "Laticínios" || p.cat === "Açougue" || p.cat === "Padaria" ? "PVPS" : i % 2 ? "MEDIO" : "PEPS",
    cost: +((p.promo ?? p.price) * 0.62).toFixed(2),
  }));
  const lots: Lot[] = [];
  const moves: Movement[] = [];
  let seq = 1;
  for (const it of items) {
    const p = PRODUCTS.find((x) => x.id === it.id)!;
    const perish = it.method === "PVPS";
    for (let k = 0; k < 2; k++) {
      const entered = BASE - (30 - k * 12) * DAY;
      const qty = Math.round(20 + r() * 40);
      const lot: Lot = {
        id: `L${seq++}`, itemId: it.id, code: `${p.name.slice(0, 3).toUpperCase()}-${2610 + k}`, serial: `SN${100000 + seq}`,
        qty, cost: +(it.cost * (1 + k * 0.04)).toFixed(2),
        expiry: iso(perish ? BASE + (k === 0 ? 3 + (it.id % 5) : 20) * DAY : BASE + 240 * DAY).slice(0, 10),
        entered: iso(entered), location: k === 0 ? "Loja" : "Depósito",
      };
      lots.push(lot);
      moves.push({ id: `M${seq++}`, date: lot.entered, itemId: it.id, type: "entrada", qty, origin: "Compras", cost: lot.cost, value: qty * lot.cost, lot: lot.code, doc: `NF-e ${5000 + seq}`, note: "Carga inicial" });
    }
  }
  const s: State = { items, lots, moves, invoices: [], seq };
  // vendas históricas
  for (let d = 14; d >= 1; d--) {
    for (const it of items) {
      if (r() < 0.45) continue;
      const q = Math.ceil(r() * (it.id % 3 === 0 ? 6 : 3));
      consume(s, it.id, q, "saida", "PDV", `PDV-${d}`, "Venda balcão", BASE - d * DAY);
    }
  }
  consume(s, 3, 4, "perda", "Perda", "PERDA-1", "Avaria", BASE - 3 * DAY);
  consume(s, 1, 3, "perda", "Perda", "PERDA-2", "Vencido", BASE - 2 * DAY);
  return s;
}

export function stockOf(s: State, itemId: number, loc?: Location) {
  return s.lots.filter((l) => l.itemId === itemId && (!loc || l.location === loc)).reduce((a, l) => a + l.qty, 0);
}
export function avgCost(s: State, itemId: number) {
  const ls = s.lots.filter((l) => l.itemId === itemId && l.qty > 0);
  const q = ls.reduce((a, l) => a + l.qty, 0);
  return q ? ls.reduce((a, l) => a + l.qty * l.cost, 0) / q : (s.items.find((i) => i.id === itemId)?.cost ?? 0);
}
export function orderLots(s: State, itemId: number, loc?: Location) {
  const it = s.items.find((i) => i.id === itemId);
  const ls = s.lots.filter((l) => l.itemId === itemId && l.qty > 0 && (!loc || l.location === loc));
  return it?.method === "PVPS" ? ls.sort((a, b) => a.expiry.localeCompare(b.expiry)) : ls.sort((a, b) => a.entered.localeCompare(b.entered));
}

/** Baixa do estoque seguindo PEPS/PVPS; custo médio quando o método é MEDIO. Retorna quantidade efetivamente baixada. */
export function consume(s: State, itemId: number, qty: number, type: MoveType, origin: Origin, doc: string, note: string, at = Date.now(), loc?: Location) {
  const it = s.items.find((i) => i.id === itemId);
  const avg = avgCost(s, itemId);
  let left = qty;
  for (const lot of orderLots(s, itemId, loc)) {
    if (left <= 0) break;
    const take = Math.min(lot.qty, left);
    lot.qty -= take; left -= take;
    const cost = it?.method === "MEDIO" ? avg : lot.cost;
    s.moves.push({ id: `M${s.seq++}`, date: iso(at), itemId, type, qty: take, origin, cost, value: take * cost, lot: lot.code, doc, note });
  }
  return qty - left;
}

// ---------- store ----------
let state: State = seed();
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
function commit(fn: (s: State) => void) {
  const next: State = structuredClone(state);
  fn(next);
  state = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  emit();
}
function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const raw = localStorage.getItem(KEY);
  if (raw) { state = JSON.parse(raw); emit(); }
  window.addEventListener("storage", (e) => { if (e.key === KEY && e.newValue) { state = JSON.parse(e.newValue); emit(); } });
}
export function useInventory() {
  useEffect(hydrate, []);
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state, () => state);
}
export const resetInventory = () => commit((s) => Object.assign(s, seed()));

// ---------- ações ----------
const nfe = (s: State) => `${String(100000 + s.seq).padStart(9, "0")}`;

export function registerSale(cart: Record<number, number>, orderId: string) {
  commit((s) => {
    let total = 0;
    const doc = `NF-e ${nfe(s)}`;
    for (const [id, q] of Object.entries(cart)) {
      const p = PRODUCTS.find((x) => x.id === +id);
      const done = consume(s, +id, q, "saida", "PDV", doc, `Pedido online #${orderId}`, Date.now(), "Loja");
      const rest = q - done ? consume(s, +id, q - done, "saida", "PDV", doc, `Pedido online #${orderId}`) : 0;
      total += (done + rest) * (p?.promo ?? p?.price ?? 0);
    }
    s.invoices.unshift({ number: doc, date: iso(Date.now()), kind: "Saída", ref: `Pedido #${orderId}`, total });
  });
}

export function registerPurchase(i: { itemId: number; qty: number; cost: number; code: string; expiry: string; serial: string; location: Location; origin: "Compras" | "Produção" }) {
  commit((s) => {
    const doc = i.origin === "Compras" ? `NF-e ${nfe(s)}` : `OP-${s.seq}`;
    const lot: Lot = { id: `L${s.seq++}`, itemId: i.itemId, code: i.code || `LT-${s.seq}`, serial: i.serial, qty: i.qty, cost: i.cost, expiry: i.expiry, entered: iso(Date.now()), location: i.location };
    s.lots.push(lot);
    s.moves.push({ id: `M${s.seq++}`, date: lot.entered, itemId: i.itemId, type: "entrada", qty: i.qty, origin: i.origin, cost: i.cost, value: i.qty * i.cost, lot: lot.code, doc, note: i.origin === "Compras" ? "Recebimento de compra" : "Ordem de produção" });
    if (i.origin === "Compras") s.invoices.unshift({ number: doc, date: lot.entered, kind: "Entrada", ref: lot.code, total: i.qty * i.cost });
  });
}

export function registerTransfer(itemId: number, qty: number, from: Location, to: Location) {
  commit((s) => {
    let left = qty;
    for (const lot of orderLots(s, itemId, from)) {
      if (left <= 0) break;
      const take = Math.min(lot.qty, left);
      lot.qty -= take; left -= take;
      s.lots.push({ ...lot, id: `L${s.seq++}`, qty: take, location: to });
      s.moves.push({ id: `M${s.seq++}`, date: iso(Date.now()), itemId, type: "transferencia", qty: take, origin: "Transferência", cost: lot.cost, value: take * lot.cost, lot: lot.code, doc: `TR-${s.seq}`, note: `${from} → ${to}` });
    }
  });
}

export function registerLoss(itemId: number, qty: number, note: string) {
  commit((s) => { consume(s, itemId, qty, "perda", "Perda", `PERDA-${s.seq}`, note); });
}

export function applyCount(counts: Record<number, number>) {
  commit((s) => {
    for (const [id, counted] of Object.entries(counts)) {
      const diff = counted - stockOf(s, +id);
      if (!diff) continue;
      if (diff < 0) consume(s, +id, -diff, "ajuste", "Inventário", `INV-${s.seq}`, "Ajuste de inventário (falta)");
      else {
        const cost = avgCost(s, +id);
        s.lots.push({ id: `L${s.seq++}`, itemId: +id, code: `AJ-${s.seq}`, serial: "", qty: diff, cost, expiry: iso(Date.now() + 30 * DAY).slice(0, 10), entered: iso(Date.now()), location: "Loja" });
        s.moves.push({ id: `M${s.seq++}`, date: iso(Date.now()), itemId: +id, type: "ajuste", qty: diff, origin: "Inventário", cost, value: diff * cost, lot: `AJ-${s.seq}`, doc: `INV-${s.seq}`, note: "Ajuste de inventário (sobra)" });
      }
    }
  });
}

export function updateItem(id: number, patch: Partial<Omit<Item, "id">>) {
  commit((s) => { const it = s.items.find((i) => i.id === id); if (it) Object.assign(it, patch); });
}

// ---------- análises ----------
export function abc(s: State) {
  const rows = s.items.map((it) => {
    const p = PRODUCTS.find((x) => x.id === it.id)!;
    const sold = s.moves.filter((m) => m.itemId === it.id && m.type === "saida");
    const qty = sold.reduce((a, m) => a + m.qty, 0);
    return { id: it.id, name: p.name, emoji: p.emoji, qty, revenue: qty * (p.promo ?? p.price) };
  }).sort((a, b) => b.revenue - a.revenue);
  const total = rows.reduce((a, r) => a + r.revenue, 0) || 1;
  let acc = 0;
  return rows.map((r) => { acc += r.revenue; const pct = (acc / total) * 100; return { ...r, share: (r.revenue / total) * 100, acc: pct, cls: (pct - (r.revenue / total) * 100 < 80 ? "A" : pct - (r.revenue / total) * 100 < 95 ? "B" : "C") as "A" | "B" | "C" }; });
}

export function itemStatus(s: State, it: Item) {
  const q = stockOf(s, it.id);
  if (q <= 0) return "ruptura" as const;
  if (q <= it.min) return "critico" as const;
  if (q <= it.reorder) return "repor" as const;
  if (q > it.max) return "excesso" as const;
  return "ok" as const;
}

export function turnover(s: State, itemId: number) {
  const out = s.moves.filter((m) => m.itemId === itemId && m.type === "saida").reduce((a, m) => a + m.qty, 0);
  const stock = stockOf(s, itemId);
  return stock ? out / ((stock + out / 2) || 1) : out ? Infinity : 0;
}

export const daysTo = (date: string, now = Date.now()) => Math.ceil((new Date(date + "T23:59:59").getTime() - now) / DAY);
